import { useMemo, useState } from "react";
import Pacientes from "./pages/Pacientes";
import Turnos from "./pages/Turnos";
import Reportes from "./pages/Reportes";

// Defino las pestañas principales de la app con un id y el texto visible.
const tabs = [
  { id: "pacientes", label: "Pacientes" },
  { id: "turnos", label: "Turnos" },
  { id: "reportes", label: "Reportes" },
];

export default function App() {
  // Manejo el estado de la pestaña activa. Empiezo mostrando la sección de pacientes.
  const [tab, setTab] = useState("pacientes");

  // Calculo el nombre legible de la pestaña activa para el subtítulo.
  const activeTab = useMemo(() => tabs.find((t) => t.id === tab)?.label, [tab]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Clínica · MESIS
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Administra pacientes, turnos y operaciones diarias con un vistazo.
            </p>
          </div>
          <nav className="flex w-full max-w-md gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200/80">
            {tabs.map((item) => {
              const isActive = item.id === tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  // Uso clases dinámicas de Tailwind para marcar la pestaña seleccionada.
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                    isActive
                      ? "bg-sky-600 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 space-y-8">
          <h2 className="text-xl font-semibold text-slate-700">{activeTab}</h2>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            {/* Según la pestaña seleccionada renderizo el módulo correspondiente. */}
            {tab === "pacientes" && <Pacientes />}
            {tab === "turnos" && <Turnos />}
            {tab === "reportes" && <Reportes />}
          </div>
        </main>
      </div>
    </div>
  );
}
