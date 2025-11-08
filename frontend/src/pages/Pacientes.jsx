import { useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";

const baseFieldClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-60";

export default function Pacientes() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    fecha_nac: "",
    obra_social: "",
    telefono: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    const { data } = await api.get("/pacientes");
    setLista(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/pacientes", {
        ...form,
        dni: Number(form.dni) || 0,
        fecha_nac: form.fecha_nac || null,
      });
      setForm({
        dni: "",
        nombre: "",
        apellido: "",
        fecha_nac: "",
        obra_social: "",
        telefono: "",
        email: "",
      });
      await cargar();
      alert("Paciente creado ✅");
    } catch (err) {
      if (err.response?.status === 409) setError("DNI duplicado");
      else setError("Error al crear paciente");
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders = useMemo(
    () => ["ID", "DNI", "Nombre", "Apellido", "Obra social", "Teléfono"],
    [],
  );

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Nuevo paciente</h3>
          <p className="mt-1 text-sm text-slate-500">
            Carga los datos básicos para registrar un nuevo paciente en el sistema.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="dni"
            placeholder="DNI"
            value={form.dni}
            onChange={onChange}
            required
            className={baseFieldClasses}
          />
          <input
            name="fecha_nac"
            type="date"
            value={form.fecha_nac}
            onChange={onChange}
            className={baseFieldClasses}
          />
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={onChange}
            required
            className={baseFieldClasses}
          />
          <input
            name="apellido"
            placeholder="Apellido"
            value={form.apellido}
            onChange={onChange}
            required
            className={baseFieldClasses}
          />
          <input
            name="obra_social"
            placeholder="Obra social"
            value={form.obra_social}
            onChange={onChange}
            className={baseFieldClasses}
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={onChange}
            className={baseFieldClasses}
          />
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            className={`${baseFieldClasses} md:col-span-2`}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {error && <span className="text-sm font-medium text-rose-600">{error}</span>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {loading ? "Guardando…" : "Guardar paciente"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-800">Listado</h3>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {lista.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-700">{p.id}</td>
                    <td className="px-4 py-3">{p.dni}</td>
                    <td className="px-4 py-3">{p.nombre}</td>
                    <td className="px-4 py-3">{p.apellido}</td>
                    <td className="px-4 py-3">{p.obra_social || "-"}</td>
                    <td className="px-4 py-3">{p.telefono || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
