import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Turnos() {
  const [pacientes, setPacientes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [lista, setLista] = useState([]);

  const [form, setForm] = useState({
    paciente_id: "", profesional_id: "", servicio_id: "", sucursal_id: "",
    fecha_hora_inicio: "", monto: 0, metodo: "efectivo",
  });

  const cargarCombos = async () => {
    const [pacs, profs, servs, sucs] = await Promise.all([
      api.get("/pacientes"), api.get("/turnos/profesionales"),
      api.get("/turnos/servicios"), api.get("/turnos/sucursales")
    ]);
    setPacientes(pacs.data);
    setProfesionales(profs.data);
    setServicios(servs.data);
    setSucursales(sucs.data);
  };

  const cargarTurnos = async () => {
    const { data } = await api.get("/turnos");
    setLista(data);
  };

  useEffect(() => { cargarCombos(); cargarTurnos(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/turnos", {
        ...form,
        paciente_id: Number(form.paciente_id),
        profesional_id: Number(form.profesional_id),
        servicio_id: Number(form.servicio_id),
        sucursal_id: Number(form.sucursal_id),
        monto: Number(form.monto || 0)
      });
      alert("Turno creado ✅");
      setForm({ paciente_id:"", profesional_id:"", servicio_id:"", sucursal_id:"", fecha_hora_inicio:"", monto:0, metodo:"efectivo" });
      await cargarTurnos();
    } catch (err) {
      if (err.response?.status === 409) alert("⚠️ Conflicto de agenda");
      else alert("Error al crear turno");
    }
  };

  return (
    <div>
      <h2>Turnos</h2>

      <form onSubmit={onSubmit} style={{ display:"grid", gap:8, maxWidth:620, marginBottom:16 }}>
        <select name="paciente_id" value={form.paciente_id} onChange={onChange} required>
          <option value="">Paciente</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.dni} - {p.nombre} {p.apellido}</option>)}
        </select>

        <select name="profesional_id" value={form.profesional_id} onChange={onChange} required>
          <option value="">Profesional</option>
          {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.especialidad})</option>)}
        </select>

        <select name="servicio_id" value={form.servicio_id} onChange={onChange} required>
          <option value="">Servicio</option>
          {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.duracion_min}m)</option>)}
        </select>

        <select name="sucursal_id" value={form.sucursal_id} onChange={onChange} required>
          <option value="">Sucursal</option>
          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>

        <input name="fecha_hora_inicio" type="datetime-local" value={form.fecha_hora_inicio} onChange={onChange} required/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <input name="monto" type="number" step="0.01" value={form.monto} onChange={onChange} placeholder="Monto (opcional)"/>
          <select name="metodo" value={form.metodo} onChange={onChange}>
            <option value="efectivo">efectivo</option>
            <option value="debito">debito</option>
            <option value="credito">credito</option>
            <option value="mp">mp</option>
          </select>
        </div>

        <button>Crear turno</button>
      </form>

      <table border="1" cellPadding="6" style={{ borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th>ID</th><th>Paciente</th><th>Profesional</th><th>Servicio</th>
            <th>Sucursal</th><th>Inicio</th><th>Fin</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.paciente}</td>
              <td>{t.profesional}</td>
              <td>{t.servicio}</td>
              <td>{t.sucursal}</td>
              <td>{t.fecha_hora_inicio}</td>
              <td>{t.fecha_hora_fin}</td>
              <td>{t.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
