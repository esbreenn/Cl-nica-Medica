import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Turnos() {
  const [pacientes, setPacientes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [lista, setLista] = useState([]);

  // Form alta
  const [form, setForm] = useState({
    paciente_id: "",
    profesional_id: "",
    servicio_id: "",
    sucursal_id: "",
    fecha_hora_inicio: "",
    monto: 0,
    metodo: "efectivo",
  });

  // Filtros
  const [filtro, setFiltro] = useState({
    profesional_id: "",
    estado: "",
    desde: "",
    hasta: "",
    paciente_dni: "",
  });

  // -------- carga de combos + lista ----------
  const cargarCombos = async () => {
    const [pacs, profs, servs, sucs] = await Promise.all([
      api.get("/pacientes"),
      api.get("/turnos/profesionales"),
      api.get("/turnos/servicios"),
      api.get("/turnos/sucursales"),
    ]);
    setPacientes(pacs.data);
    setProfesionales(profs.data);
    setServicios(servs.data);
    setSucursales(sucs.data);
  };

  const cargarTurnos = async (params = {}) => {
    const { data } = await api.get("/turnos", { params });
    setLista(data);
  };

  useEffect(() => {
    cargarCombos();
    cargarTurnos();
  }, []);

  // -------- alta ----------
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
        monto: Number(form.monto || 0),
      });
      alert("Turno creado ✅");
      setForm({
        paciente_id: "",
        profesional_id: "",
        servicio_id: "",
        sucursal_id: "",
        fecha_hora_inicio: "",
        monto: 0,
        metodo: "efectivo",
      });
      await cargarTurnos();
    } catch (err) {
      if (err.response?.status === 409) alert("⚠️ Conflicto de agenda");
      else alert("Error al crear turno");
    }
  };

  // -------- filtros ----------
  const aplicarFiltros = async () => {
    const params = {};
    if (filtro.profesional_id) params.profesional_id = filtro.profesional_id;
    if (filtro.estado) params.estado = filtro.estado;
    if (filtro.desde) params.desde = filtro.desde.replace("T", " ");
    if (filtro.hasta) params.hasta = filtro.hasta.replace("T", " ");
    if (filtro.paciente_dni) params.paciente_dni = filtro.paciente_dni;
    await cargarTurnos(params);
  };

  const limpiarFiltros = async () => {
    setFiltro({ profesional_id: "", estado: "", desde: "", hasta: "", paciente_dni: "" });
    await cargarTurnos();
  };

  // -------- acciones por fila ----------
  async function eliminarTurno(id) {
    if (!confirm("¿Eliminar turno? Esta acción no se puede deshacer.")) return;
    await api.delete(`/turnos/${id}`);
    await cargarTurnos();
  }

  async function cambiarEstado(id, estado) {
    await api.patch(`/turnos/${id}/estado`, { estado });
    await cargarTurnos();
  }

  async function reprogramar(id) {
    const fecha = prompt("Nueva fecha/hora (YYYY-MM-DD HH:MM:SS):");
    if (!fecha) return;
    const prof = prompt("ID profesional (actual u otro):");
    const serv = prompt("ID servicio:");
    const suc = prompt("ID sucursal:");
    if (!prof || !serv || !suc) return;
    try {
      await api.put(`/turnos/${id}`, {
        profesional_id: Number(prof),
        servicio_id: Number(serv),
        sucursal_id: Number(suc),
        fecha_hora_inicio: fecha,
      });
      alert("Turno reprogramado ✅");
      await cargarTurnos();
    } catch (e) {
      if (e.response?.status === 409) alert("⚠️ Conflicto de agenda");
      else alert("Error al reprogramar");
    }
  }

  // -------- UI ----------
  return (
    <div>
      <h2>Turnos</h2>

      {/* Filtros */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, margin: "12px 0" }}>
        <select
          value={filtro.profesional_id}
          onChange={(e) => setFiltro({ ...filtro, profesional_id: e.target.value })}
        >
          <option value="">Filtrar profesional</option>
          {profesionales.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <select value={filtro.estado} onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}>
          <option value="">Estado</option>
          <option value="reservado">reservado</option>
          <option value="confirmado">confirmado</option>
          <option value="atendido">atendido</option>
          <option value="cancelado">cancelado</option>
          <option value="ausente">ausente</option>
        </select>

        <input
          type="datetime-local"
          value={filtro.desde}
          onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })}
        />
        <input
          type="datetime-local"
          value={filtro.hasta}
          onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })}
        />
        <input
          placeholder="DNI paciente"
          value={filtro.paciente_dni}
          onChange={(e) => setFiltro({ ...filtro, paciente_dni: e.target.value })}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={aplicarFiltros}>Aplicar filtros</button>
        <button onClick={limpiarFiltros}>Limpiar</button>
      </div>

      {/* Alta */}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 620, marginBottom: 16 }}>
        <select name="paciente_id" value={form.paciente_id} onChange={onChange} required>
          <option value="">Paciente</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.dni} - {p.nombre} {p.apellido}
            </option>
          ))}
        </select>

        <select name="profesional_id" value={form.profesional_id} onChange={onChange} required>
          <option value="">Profesional</option>
          {profesionales.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.especialidad})
            </option>
          ))}
        </select>

        <select name="servicio_id" value={form.servicio_id} onChange={onChange} required>
          <option value="">Servicio</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} ({s.duracion_min}m)
            </option>
          ))}
        </select>

        <select name="sucursal_id" value={form.sucursal_id} onChange={onChange} required>
          <option value="">Sucursal</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>

        <input
          name="fecha_hora_inicio"
          type="datetime-local"
          value={form.fecha_hora_inicio}
          onChange={onChange}
          required
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            name="monto"
            type="number"
            step="0.01"
            value={form.monto}
            onChange={onChange}
            placeholder="Monto (opcional)"
          />
          <select name="metodo" value={form.metodo} onChange={onChange}>
            <option value="efectivo">efectivo</option>
            <option value="debito">debito</option>
            <option value="credito">credito</option>
            <option value="mp">mp</option>
          </select>
        </div>

        <button>Crear turno</button>
      </form>

      {/* Listado */}
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Paciente</th>
            <th>Profesional</th>
            <th>Servicio</th>
            <th>Sucursal</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.paciente}</td>
              <td>{t.profesional}</td>
              <td>{t.servicio}</td>
              <td>{t.sucursal}</td>
              <td>{t.fecha_hora_inicio}</td>
              <td>{t.fecha_hora_fin}</td>
              <td>{t.estado}</td>
              <td>
                <button onClick={() => cambiarEstado(t.id, "confirmado")}>Confirmar</button>{" "}
                <button onClick={() => cambiarEstado(t.id, "atendido")}>Atendido</button>{" "}
                <button onClick={() => cambiarEstado(t.id, "cancelado")}>Cancelar</button>{" "}
                <button onClick={() => reprogramar(t.id)}>Reprogramar</button>{" "}
                <button onClick={() => eliminarTurno(t.id)} style={{ color: "crimson" }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
