import { useState } from "react";
import Pacientes from "./pages/Pacientes";
import Turnos from "./pages/Turnos";

export default function App() {
  const [tab, setTab] = useState("pacientes");
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Clínica · Gestión</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("pacientes")}>Pacientes</button>
        <button onClick={() => setTab("turnos")}>Turnos</button>
      </div>
      {tab === "pacientes" ? <Pacientes /> : <Turnos />}
    </div>
  );
}
