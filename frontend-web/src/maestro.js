const API = "http://localhost:3000";

async function registrarHorario() {
  const nombre = document.getElementById("nombreMaestro").value;
  const dia = document.getElementById("dia").value;
  const hora = document.getElementById("hora").value;

  const res = await fetch(`${API}/maestros/horarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maestro: nombre, dia, hora })
  });

  alert("Horario registrado");
}

async function verReporteMaestro() {
  const id = document.getElementById("reporteMaestroId").value;

  const res = await fetch(`${API}/reportes/maestros/${id}`);
  const data = await res.json();

  document.getElementById("resultado").innerHTML = JSON.stringify(data, null, 2);
}
