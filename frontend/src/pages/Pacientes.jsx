import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Pacientes() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({
    dni: "", nombre: "", apellido: "",
    fecha_nac: "", obra_social: "", telefono: "", email: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    const { data } = await api.get("/pacientes");
    setLista(data);
  };

  useEffect(() => { cargar(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.post("/pacientes", {
        ...form,
        dni: Number(form.dni) || 0,
        fecha_nac: form.fecha_nac || null
      });
      setForm({ dni:"", nombre:"", apellido:"", fecha_nac:"", obra_social:"", telefono:"", email:"" });
      await cargar();
      alert("Paciente creado ✅");
    } catch (err) {
      if (err.response?.status === 409) setError("DNI duplicado");
      else setError("Error al crear paciente");
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h2>Pacientes</h2>

      <form onSubmit={onSubmit} style={{ display:"grid", gap:8, maxWidth:560, marginBottom:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <input name="dni" placeholder="DNI" value={form.dni} onChange={onChange} required/>
          <input name="fecha_nac" type="date" value={form.fecha_nac} onChange={onChange}/>
          <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} required/>
          <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={onChange} required/>
          <input name="obra_social" placeholder="Obra social" value={form.obra_social} onChange={onChange}/>
          <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={onChange}/>
          <input name="email" placeholder="Email" value={form.email} onChange={onChange}/>
        </div>
        <button disabled={loading}>{loading ? "Guardando..." : "Guardar paciente"}</button>
        {error && <span style={{ color:"crimson" }}>{error}</span>}
      </form>

      <table border="1" cellPadding="6" style={{ borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th>ID</th><th>DNI</th><th>Nombre</th><th>Apellido</th><th>Obra Social</th><th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.dni}</td>
              <td>{p.nombre}</td>
              <td>{p.apellido}</td>
              <td>{p.obra_social || "-"}</td>
              <td>{p.telefono || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
