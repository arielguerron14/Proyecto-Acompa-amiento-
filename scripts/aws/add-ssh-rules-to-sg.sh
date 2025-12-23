#!/usr/bin/env bash
set -euo pipefail

# add-ssh-rules-to-sg.sh
# Safely add SSH ingress rules to the Security Group(s) attached to an EC2 instance
# Usage:
#  ./add-ssh-rules-to-sg.sh --instance-id i-0123456789abcdef0 --my-ip 198.51.100.123 --region us-east-1 [--apply]
# Options:
#   --instance-id <id>    : target instance id (preferred)
#   --tag-name <name>     : or find instance by Name tag (uses wildcard)
#   --my-ip <cidr>        : your IP in CIDR (e.g., 1.2.3.4/32). If omitted, detected automatically.
#   --allow-github        : also add GitHub Actions CIDRs to allow SSH (recommended for CI)
#   --apply               : actually modify SGs; without it the script only performs a dry-run
#   --region <aws-region> : AWS region (default us-east-1)

usage(){
  sed -n '1,120p' "$0"
}

MY_IP=""
INSTANCE_ID=""
TAG_NAME=""
ALLOW_GITHUB=false
APPLY=false
REGION="us-east-1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --instance-id) INSTANCE_ID="$2"; shift 2;;
    --tag-name) TAG_NAME="$2"; shift 2;;
    --my-ip) MY_IP="$2"; shift 2;;
    --allow-github) ALLOW_GITHUB=true; shift 1;;
    --apply) APPLY=true; shift 1;;
    --region) REGION="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [[ -z "$INSTANCE_ID" && -z "$TAG_NAME" ]]; then
  echo "ERROR: --instance-id or --tag-name is required" >&2
  usage
  exit 1
fi

command -v aws >/dev/null 2>&1 || { echo "aws CLI not found; install and configure it before running." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq not found; please install jq to run this script." >&2; exit 1; }

if [[ -z "$MY_IP" ]]; then
  echo "Detecting your public IP..."
  MY_IP_RAW=$(curl -fsS https://checkip.amazonaws.com || true)
  if [[ -z "$MY_IP_RAW" ]]; then
    echo "Failed to determine public IP; use --my-ip to provide one." >&2
    exit 1
  fi
  MY_IP="${MY_IP_RAW%$'\n'}/32"
fi

echo "Target instance: ${INSTANCE_ID:-(by tag: $TAG_NAME)}"
echo "Your IP CIDR: $MY_IP"
echo "AWS Region: $REGION"
echo "Dry-run mode: $(! $APPLY && echo true || echo false)"

get_instance_id_from_tag(){
  local tag="$1"
  aws ec2 describe-instances --filters "Name=tag:Name,Values=*${tag}*" --region "$REGION" \
    --query 'Reservations[].Instances[?State.Name==`running`].InstanceId' --output text | awk '{print $1}'
}

if [[ -z "$INSTANCE_ID" ]]; then
  INSTANCE_ID=$(get_instance_id_from_tag "$TAG_NAME")
  if [[ -z "$INSTANCE_ID" ]]; then
    echo "No running instance found with tag matching: $TAG_NAME" >&2
    exit 1
  fi
  echo "Resolved instance id: $INSTANCE_ID"
fi

echo "Fetching instance metadata..."
INSTANCE_JSON=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --output json)
STATE=$(echo "$INSTANCE_JSON" | jq -r '.Reservations[0].Instances[0].State.Name')
PUB_IP=$(echo "$INSTANCE_JSON" | jq -r '.Reservations[0].Instances[0].PublicIpAddress // empty')
SUBNET_ID=$(echo "$INSTANCE_JSON" | jq -r '.Reservations[0].Instances[0].SubnetId')
SG_IDS=($(echo "$INSTANCE_JSON" | jq -r '.Reservations[0].Instances[0].SecurityGroups[].GroupId'))

echo "Instance state: $STATE"
if [[ "$STATE" != "running" ]]; then
  echo "WARNING: Instance is not running. Start it before attempting SSH." >&2
fi

echo "Public IP: ${PUB_IP:-(none)}"
echo "Subnet: $SUBNET_ID"
echo "Security Groups attached: ${SG_IDS[*]}"

echo
echo "-- Verifying Subnet is public (route table -> 0.0.0.0/0 -> igw-)"
RT_IDS=$(aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=$SUBNET_ID" --region "$REGION" --query 'RouteTables[].RouteTableId' --output text)
if [[ -z "$RT_IDS" ]]; then
  echo "No associated route table found for subnet $SUBNET_ID" >&2
else
  for rt in $RT_IDS; do
    echo "Checking route table $rt"
    aws ec2 describe-route-tables --route-table-ids "$rt" --region "$REGION" --query 'RouteTables[].Routes[]' --output json | jq -r '.[] | "dest=" + (.DestinationCidrBlock // .DestinationIpv6CidrBlock // "") + " -> " + (.GatewayId // .NatGatewayId // "")'
  done
fi

echo
echo "-- Verifying Network ACL for subnet"
NACL_JSON=$(aws ec2 describe-network-acls --filters Name=association.subnet-id,Values="$SUBNET_ID" --region "$REGION" --output json)
if [[ -z "$NACL_JSON" || "$NACL_JSON" == "null" ]]; then
  echo "No NACL found for subnet $SUBNET_ID (using default NACL)"
else
  echo "$NACL_JSON" | jq -r '.NetworkAcls[] | {Id: .NetworkAclId,Entries: .Entries} '
  # Check for explicit DENY of port 22
  DENY22=$(echo "$NACL_JSON" | jq -r '.NetworkAcls[].Entries[] | select(.RuleAction=="deny") | select((.Protocol=="6" or .Protocol=="-1") and (.PortRange.From<=22 and .PortRange.To>=22)) | .RuleNumber' || true)
  if [[ -n "$DENY22" ]]; then
    echo "WARNING: Found NACL deny entries affecting port 22: $DENY22" >&2
  else
    echo "No DENY on port 22 found in NACL entries (good)"
  fi
fi

apply_sg_rule(){
  local SGID="$1"; local CIDR="$2"; local DESC="$3"
  echo "Checking SG $SGID for existing rule for $CIDR"
  EXIST=$(aws ec2 describe-security-groups --group-ids "$SGID" --region "$REGION" --query "SecurityGroups[0].IpPermissions[?FromPort==\`22\` && ToPort==\`22\` && IpProtocol=='tcp'].IpRanges[?CidrIp=='$CIDR'] | length(@)" --output text)
  if [[ "$EXIST" == "0" || -z "$EXIST" ]]; then
    echo "No existing rule for $CIDR on $SGID"
    if $APPLY; then
      echo "Authorizing ingress TCP/22 $CIDR on $SGID"
      aws ec2 authorize-security-group-ingress --group-id "$SGID" --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges="[{CidrIp=$CIDR,Description=\"$DESC\"}]" --region "$REGION"
    else
      echo "DRY-RUN: would add SSH rule $CIDR to $SGID"
    fi
  else
    echo "Rule for $CIDR already present on $SGID"
  fi
}

echo
echo "-- Preparing list of CIDRs to add"
CIDRS_TO_ADD=()
CIDRS_TO_ADD+=("$MY_IP")

if $ALLOW_GITHUB; then
  echo "Fetching GitHub Actions CIDRs from api.github.com/meta"
  GH_META=$(curl -fsS https://api.github.com/meta)
  ACTIONS_CIDRS=$(echo "$GH_META" | jq -r '.actions[]')
  for c in $ACTIONS_CIDRS; do
    CIDRS_TO_ADD+=("$c")
  done
fi

echo "CIDRs to add: ${CIDRS_TO_ADD[*]}"

for sg in "${SG_IDS[@]}"; do
  for c in "${CIDRS_TO_ADD[@]}"; do
    apply_sg_rule "$sg" "$c" "Added by add-ssh-rules-to-sg script"
  done
done

echo
echo "Done. If you ran in DRY-RUN mode, re-run with --apply to make changes." 
