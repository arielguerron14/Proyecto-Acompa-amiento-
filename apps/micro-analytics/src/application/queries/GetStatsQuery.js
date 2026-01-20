class GetStatsQuery {
  constructor(period = '7d') {
    const validPeriods = ['1d', '7d', '30d', '90d', '1y'];
    if (!validPeriods.includes(period)) {
      throw new Error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }

    this.period = period;
  }
}

module.exports = GetStatsQuery;
