const API = "http://localhost:3000";

async function cargarMaestros() {
  const res = await fetch(`${API}/maestros/horarios`);
  const data = await res.json();

  const select = document.getElementById("listaMaestros");
  select.innerHTML = "";

  data.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h.maestro;
    opt.innerText = h.maestro;
    select.appendChild(opt);
  });
}

async function cargarHoras() {
  const res = await fetch(`${API}/maestros/horarios`);
  const data = await res.json();

  const select = document.getElementById("listaHoras");
  select.innerHTML = "";

  data.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h.hora;
    opt.innerText = `${h.dia} - ${h.hora}`;
    select.appendChild(opt);
  });
}

cargarMaestros();
cargarHoras();

async function reservar() {
  const estudiante = document.getElementById("nombreEst").value;
  const maestro = document.getElementById("listaMaestros").value;
  const hora = document.getElementById("listaHoras").value;

  await fetch(`${API}/estudiantes/reservar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estudiante, maestro, hora })
  });

  alert("Reserva realizada");
}

async function verReporteEst() {
  const id = document.getElementById("estIdReporte").value;

  const res = await fetch(`${API}/reportes/estudiantes/${id}`);
  const data = await res.json();

  document.getElementById("resultadoEst").innerHTML = JSON.stringify(data, null, 2);
}
