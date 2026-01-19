#!/usr/bin/env python3
"""
Test Suite de Validación de Microservicios
Proyecto Acompañamiento - Sistema de Gestión Educativa

Ejecuta pruebas completas de todos los servicios y flujos
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import subprocess

# Configuración de instancias
INSTANCES = {
    'core': '3.236.99.88',
    'api_gateway': '98.86.94.92',
    'messaging': '35.172.111.207',
    'db': '13.217.220.8',
    'notifications': '98.92.17.165',
    'monitoring': '54.205.158.101',
    'frontend': '52.72.57.10',
}

# Puertos de servicios
PORTS = {
    'api_gateway': 8080,
    'auth': 5005,
    'estudiantes': 5002,
    'maestros': 5001,
    'notificaciones': 5006,
    'reportes_estudiantes': 5003,
    'reportes_maestros': 5004,
    'analytics': 5007,
    'monitoring': 5009,
}

class TestResult:
    def __init__(self, name: str, status: bool, message: str = "", duration: float = 0):
        self.name = name
        self.status = status
        self.message = message
        self.duration = duration
        self.timestamp = datetime.now()

    def __repr__(self):
        icon = "✅" if self.status else "❌"
        return f"{icon} {self.name} ({self.duration:.2f}s) - {self.message}"


class TestSuite:
    def __init__(self):
        self.results: List[TestResult] = []
        self.auth_token: Optional[str] = None
        self.student_id: Optional[str] = None
        self.teacher_id: Optional[str] = None
        self.report_id: Optional[str] = None
        self.timeout = 10

    def run_test(self, name: str, test_fn) -> TestResult:
        """Ejecuta un test y registra el resultado"""
        start = time.time()
        try:
            print(f"🧪 {name}...", end=" ", flush=True)
            test_fn()
            duration = time.time() - start
            result = TestResult(name, True, "OK", duration)
            self.results.append(result)
            print(f"✅ ({duration:.2f}s)")
            return result
        except Exception as e:
            duration = time.time() - start
            result = TestResult(name, False, str(e), duration)
            self.results.append(result)
            print(f"❌ ({duration:.2f}s) - {e}")
            return result

    def print_summary(self):
        """Imprime resumen de resultados"""
        print("\n" + "=" * 100)
        print("📊 RESUMEN DE PRUEBAS")
        print("=" * 100)

        for result in self.results:
            print(result)

        passed = sum(1 for r in self.results if r.status)
        failed = sum(1 for r in self.results if not r.status)
        total = len(self.results)
        success_rate = (passed / total * 100) if total > 0 else 0

        print("\n" + "-" * 100)
        print(f"✅ Pasadas: {passed} | ❌ Fallidas: {failed} | 📊 Total: {total}")
        print(f"🎯 Tasa de éxito: {success_rate:.2f}%")
        print("=" * 100 + "\n")

        return passed, failed

    # ================ HEALTH CHECKS ================

    def health_check(self, service: str, ip: str, port: int, path: str = "/health"):
        """Verifica que un servicio esté disponible"""
        url = f"http://{ip}:{port}{path}"
        response = requests.get(url, timeout=self.timeout)
        assert response.status_code == 200, f"Status {response.status_code}"

    def test_health_checks(self):
        """Ejecuta health checks de todos los servicios"""
        services = [
            ("API Gateway", INSTANCES['api_gateway'], PORTS['api_gateway']),
            ("Auth Service", INSTANCES['core'], PORTS['auth']),
            ("Estudiantes", INSTANCES['core'], PORTS['estudiantes']),
            ("Maestros", INSTANCES['core'], PORTS['maestros']),
            ("Notificaciones", INSTANCES['notifications'], PORTS['notificaciones']),
            ("Reportes Estudiantes", INSTANCES['core'], PORTS['reportes_estudiantes']),
            ("Reportes Maestros", INSTANCES['core'], PORTS['reportes_maestros']),
            ("Analytics", INSTANCES['core'], PORTS['analytics']),
        ]

        for service, ip, port in services:
            self.run_test(
                f"Health: {service}",
                lambda s=service, i=ip, p=port: self.health_check(s, i, p)
            )

    # ================ AUTHENTICATION ================

    def test_auth_login(self):
        """Login de usuario maestro"""
        def auth_login():
            response = requests.post(
                f"http://{INSTANCES['core']}:{PORTS['auth']}/login",
                json={"email": "maestro@test.com", "password": "Test@123"},
                timeout=self.timeout
            )
            assert response.status_code in [200, 201], f"Status {response.status_code}"
            data = response.json()
            assert "token" in data, "No token en respuesta"
            self.auth_token = data["token"]

        self.run_test("Auth: Login maestro", auth_login)

    def test_auth_token_validation(self):
        """Valida token JWT"""
        def token_validation():
            assert self.auth_token, "No hay token para validar"
            response = requests.post(
                f"http://{INSTANCES['core']}:{PORTS['auth']}/validate",
                json={"token": self.auth_token},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"
            data = response.json()
            assert data.get("valid") == True, "Token no válido"

        self.run_test("Auth: Validar token JWT", token_validation)

    def test_auth_rbac(self):
        """Prueba control de acceso basado en roles"""
        def rbac():
            assert self.auth_token, "No hay token para consultar roles"
            response = requests.get(
                f"http://{INSTANCES['core']}:{PORTS['auth']}/roles",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"
            data = response.json()
            assert isinstance(data.get("roles", []), list), "Roles no es lista"

        self.run_test("Auth: RBAC - Control de roles", rbac)

    # ================ STUDENT MANAGEMENT ================

    def test_create_student(self):
        """Crea nuevo estudiante"""
        def create():
            response = requests.post(
                f"http://{INSTANCES['api_gateway']}:{PORTS['api_gateway']}/api/estudiantes",
                json={
                    "nombre": "Juan",
                    "apellido": "Test",
                    "email": f"juan.{int(time.time())}@test.com",
                    "grado": "10A",
                },
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code in [200, 201], f"Status {response.status_code}"
            data = response.json()
            self.student_id = data.get("id") or data.get("_id")
            assert self.student_id, "No se retornó ID de estudiante"

        self.run_test("Estudiantes: CREATE", create)

    def test_read_student(self):
        """Lee estudiante creado"""
        def read():
            assert self.student_id, "No hay studentId"
            response = requests.get(
                f"http://{INSTANCES['api_gateway']}:{PORTS['api_gateway']}/api/estudiantes/{self.student_id}",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"

        self.run_test("Estudiantes: READ", read)

    def test_update_student(self):
        """Actualiza estudiante"""
        def update():
            assert self.student_id, "No hay studentId"
            response = requests.put(
                f"http://{INSTANCES['api_gateway']}:{PORTS['api_gateway']}/api/estudiantes/{self.student_id}",
                json={"grado": "10B"},
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"

        self.run_test("Estudiantes: UPDATE", update)

    def test_list_students(self):
        """Lista estudiantes"""
        def list_students():
            response = requests.get(
                f"http://{INSTANCES['api_gateway']}:{PORTS['api_gateway']}/api/estudiantes",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"
            data = response.json()
            assert isinstance(data, (list, dict)), "Respuesta no es lista o dict"

        self.run_test("Estudiantes: LIST", list_students)

    # ================ TEACHER MANAGEMENT ================

    def test_create_teacher(self):
        """Crea nuevo maestro"""
        def create():
            response = requests.post(
                f"http://{INSTANCES['api_gateway']}:{PORTS['api_gateway']}/api/maestros",
                json={
                    "nombre": "Carlos",
                    "apellido": "Test",
                    "email": f"carlos.{int(time.time())}@test.com",
                    "asignatura": "Matemáticas",
                },
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code in [200, 201], f"Status {response.status_code}"
            data = response.json()
            self.teacher_id = data.get("id") or data.get("_id")
            assert self.teacher_id, "No se retornó ID de maestro"

        self.run_test("Maestros: CREATE", create)

    def test_read_teacher(self):
        """Lee maestro creado"""
        def read():
            assert self.teacher_id, "No hay teacherId"
            response = requests.get(
                f"http://{INSTANCES['api_gateway']}:{PORTS['api_gateway']}/api/maestros/{self.teacher_id}",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"

        self.run_test("Maestros: READ", read)

    def test_list_teachers(self):
        """Lista maestros"""
        def list_teachers():
            response = requests.get(
                f"http://{INSTANCES['api_gateway']}:{PORTS['api_gateway']}/api/maestros",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"

        self.run_test("Maestros: LIST", list_teachers)

    # ================ NOTIFICATIONS ================

    def test_send_notification(self):
        """Envía notificación"""
        def send():
            response = requests.post(
                f"http://{INSTANCES['notifications']}:{PORTS['notificaciones']}/api/notificaciones",
                json={
                    "destinatario": "test@example.com",
                    "asunto": "Test",
                    "mensaje": "Mensaje de prueba",
                    "tipo": "email"
                },
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code in [200, 201], f"Status {response.status_code}"

        self.run_test("Notificaciones: SEND", send)

    def test_get_notifications(self):
        """Obtiene notificaciones"""
        def get_notif():
            response = requests.get(
                f"http://{INSTANCES['notifications']}:{PORTS['notificaciones']}/api/notificaciones",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"

        self.run_test("Notificaciones: GET", get_notif)

    # ================ REPORTS ================

    def test_generate_report(self):
        """Genera reporte"""
        def generate():
            response = requests.post(
                f"http://{INSTANCES['core']}:{PORTS['reportes_estudiantes']}/api/reportes",
                json={"tipo": "desempeño", "periodo": "2024-Q1"},
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code in [200, 201], f"Status {response.status_code}"
            data = response.json()
            self.report_id = data.get("id") or data.get("reportId")

        self.run_test("Reportes: GENERATE", generate)

    def test_query_report(self):
        """Consulta reporte"""
        def query():
            if self.report_id:
                response = requests.get(
                    f"http://{INSTANCES['core']}:{PORTS['reportes_estudiantes']}/api/reportes/{self.report_id}",
                    headers={"Authorization": f"Bearer {self.auth_token}"},
                    timeout=self.timeout
                )
                assert response.status_code == 200, f"Status {response.status_code}"
            else:
                raise Exception("No report ID available")

        if self.report_id:
            self.run_test("Reportes: QUERY", query)

    # ================ ANALYTICS ================

    def test_analytics_metrics(self):
        """Obtiene métricas de analytics"""
        def metrics():
            response = requests.get(
                f"http://{INSTANCES['core']}:{PORTS['analytics']}/api/analytics/metrics",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=self.timeout
            )
            assert response.status_code == 200, f"Status {response.status_code}"

        self.run_test("Analytics: GET METRICS", metrics)

    # ================ EXECUTE ALL ================

    def run_all(self):
        """Ejecuta toda la suite"""
        print("\n" + "=" * 100)
        print("🚀 INICIANDO SUITE DE PRUEBAS - MICROSERVICIOS")
        print("=" * 100 + "\n")

        print("📋 FASE 1: Health Checks")
        self.test_health_checks()

        print("\n📋 FASE 2: Autenticación")
        self.test_auth_login()
        self.test_auth_token_validation()
        self.test_auth_rbac()

        print("\n📋 FASE 3: Gestión de Estudiantes")
        self.test_create_student()
        self.test_read_student()
        self.test_update_student()
        self.test_list_students()

        print("\n📋 FASE 4: Gestión de Maestros")
        self.test_create_teacher()
        self.test_read_teacher()
        self.test_list_teachers()

        print("\n📋 FASE 5: Notificaciones")
        self.test_send_notification()
        self.test_get_notifications()

        print("\n📋 FASE 6: Reportes")
        self.test_generate_report()
        self.test_query_report()

        print("\n📋 FASE 7: Analytics")
        self.test_analytics_metrics()

        passed, failed = self.print_summary()
        return 0 if failed == 0 else 1


if __name__ == "__main__":
    suite = TestSuite()
    exit_code = suite.run_all()
    sys.exit(exit_code)
