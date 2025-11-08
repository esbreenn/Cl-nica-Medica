import { useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";

const baseFieldClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-60";

const subtleButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300";

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
  const estadoOpciones = useMemo(
    () => ["reservado", "confirmado", "atendido", "cancelado", "ausente"],
    [],
  );

  return (
    <div className="space-y-10">
      {/* Filtros */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
          <p className="mt-1 text-sm text-slate-600">
            Ajusta los criterios para encontrar turnos específicos por profesional, estado o rango de fechas.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <select
            value={filtro.profesional_id}
            onChange={(e) => setFiltro({ ...filtro, profesional_id: e.target.value })}
            className={`${baseFieldClasses} md:col-span-2`}
          >
            <option value="">Filtrar profesional</option>
            {profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtro.estado}
            onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}
            className={baseFieldClasses}
          >
            <option value="">Estado</option>
            {estadoOpciones.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={filtro.desde}
            onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })}
            className={baseFieldClasses}
          />
          <input
            type="datetime-local"
            value={filtro.hasta}
            onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })}
            className={baseFieldClasses}
          />
          <input
            placeholder="DNI paciente"
            value={filtro.paciente_dni}
            onChange={(e) => setFiltro({ ...filtro, paciente_dni: e.target.value })}
            className={baseFieldClasses}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={aplicarFiltros} className={primaryButton}>
            Aplicar filtros
          </button>
          <button type="button" onClick={limpiarFiltros} className={subtleButton}>
            Limpiar
          </button>
        </div>
      </section>

      {/* Alta */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Crear turno</h3>
          <p className="mt-1 text-sm text-slate-600">
            Completa el formulario para generar un nuevo turno y asignarlo al profesional correspondiente.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 md:max-w-3xl">
          <select
            name="paciente_id"
            value={form.paciente_id}
            onChange={onChange}
            required
            className={baseFieldClasses}
          >
            <option value="">Paciente</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.dni} - {p.nombre} {p.apellido}
              </option>
            ))}
          </select>

          <select
            name="profesional_id"
            value={form.profesional_id}
            onChange={onChange}
            required
            className={baseFieldClasses}
          >
            <option value="">Profesional</option>
            {profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.especialidad})
              </option>
            ))}
          </select>

          <select
            name="servicio_id"
            value={form.servicio_id}
            onChange={onChange}
            required
            className={baseFieldClasses}
          >
            <option value="">Servicio</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.duracion_min}m)
              </option>
            ))}
          </select>

          <select
            name="sucursal_id"
            value={form.sucursal_id}
            onChange={onChange}
            required
            className={baseFieldClasses}
          >
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
            className={baseFieldClasses}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="monto"
              type="number"
              step="0.01"
              value={form.monto}
              onChange={onChange}
              placeholder="Monto (opcional)"
              className={baseFieldClasses}
            />
            <select
              name="metodo"
              value={form.metodo}
              onChange={onChange}
              className={baseFieldClasses}
            >
              <option value="efectivo">efectivo</option>
              <option value="debito">debito</option>
              <option value="credito">credito</option>
              <option value="mp">mp</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button type="submit" className={primaryButton}>
              Crear turno
            </button>
          </div>
        </form>
      </section>

      {/* Listado */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Turnos programados</h3>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona los estados o reprograma turnos directamente desde el listado.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["ID", "Paciente", "Profesional", "Servicio", "Sucursal", "Inicio", "Fin", "Estado", "Acciones"].map(
                    (header) => (
                      <th
                        key={header}
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {lista.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-700">{t.id}</td>
                    <td className="px-4 py-3">{t.paciente}</td>
                    <td className="px-4 py-3">{t.profesional}</td>
                    <td className="px-4 py-3">{t.servicio}</td>
                    <td className="px-4 py-3">{t.sucursal}</td>
                    <td className="px-4 py-3">{t.fecha_hora_inicio}</td>
                    <td className="px-4 py-3">{t.fecha_hora_fin}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {t.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarEstado(t.id, "confirmado")}
                          className={`${subtleButton} border-transparent bg-sky-50 text-sky-700 hover:bg-sky-100`}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarEstado(t.id, "atendido")}
                          className={`${subtleButton} border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                        >
                          Atendido
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarEstado(t.id, "cancelado")}
                          className={`${subtleButton} border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100`}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => reprogramar(t.id)}
                          className={`${subtleButton} border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200`}
                        >
                          Reprogramar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarTurno(t.id)}
                          className={`${subtleButton} border-transparent bg-rose-50 text-rose-700 hover:bg-rose-100`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
