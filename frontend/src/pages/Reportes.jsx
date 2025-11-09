import { useEffect, useState } from "react";
import { api } from "../api/axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* -------------------- UI helpers -------------------- */
function Card({ children }) {
  return (
    <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
      {children}
    </section>
  );
}

function SectionHeader({ title, onRefresh, loading, onExport }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Cargando...
            </span>
          ) : (
            "Actualizar"
          )}
        </Button>
        <Button onClick={onExport}>Exportar a Excel</Button>
      </div>
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants = {
    primary:
      "bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-600 disabled:opacity-60 disabled:cursor-not-allowed",
    secondary:
      "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-sky-600 disabled:opacity-60 disabled:cursor-not-allowed",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-sky-600"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-90" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4"/>
    </svg>
  );
}

function Empty({ children = "Sin datos" }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
      {children}
    </div>
  );
}

function DataTable({ cols, rows }) {
  if (!rows?.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[560px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-700">
            {cols.map((c) => (
              <th
                key={c.key}
                className="border-b border-slate-200 px-3 py-2 text-left font-semibold"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-800">
          {rows.map((r, i) => (
            <tr key={i} className="even:bg-slate-50/30">
              {cols.map((c) => (
                <td key={c.key} className="border-b border-slate-100 px-3 py-2">
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- hook de reporte -------------------- */
function useReporte(loaderFn) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await loaderFn();
      setData(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const exportar = (nombreHoja, nombreArchivo = "reporte.xlsx") => {
    const hoja = XLSX.utils.json_to_sheet(data);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
    const buffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), nombreArchivo);
  };

  return { data, loading, cargar, exportar };
}

/* -------------------- Página -------------------- */
export default function Reportes() {
  // 1) Turnos por paciente (JOIN + GROUP BY)
  const repTurnosPaciente = useReporte(() =>
    api.get("/reportes/turnos_por_paciente")
  );

  // 2) Pacientes sin turnos recientes (SUBQUERY)
  const repPacSinTurnos = useReporte(() =>
    api.get("/reportes/pacientes_sin_turnos_recientes")
  );

  // 3) Turnos por profesional (LEFT JOIN + GROUP BY)
  const repTurnosProfesional = useReporte(() =>
    api.get("/reportes/turnos_por_profesional")
  );

  useEffect(() => {
    repTurnosPaciente.cargar();
    repPacSinTurnos.cargar();
    repTurnosProfesional.cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <Card>
        <SectionHeader
          title="Turnos por paciente"
          onRefresh={repTurnosPaciente.cargar}
          loading={repTurnosPaciente.loading}
          onExport={() =>
            repTurnosPaciente.exportar(
              "TurnosPorPaciente",
              "turnos_por_paciente.xlsx"
            )
          }
        />
        <DataTable
          cols={[
            { key: "paciente", label: "Nombre" },
            { key: "apellido", label: "Apellido" },
            { key: "total_turnos", label: "Total turnos" },
          ]}
          rows={repTurnosPaciente.data}
        />
      </Card>

      <Card>
        <SectionHeader
          title="Pacientes sin turnos recientes (30 días)"
          onRefresh={repPacSinTurnos.cargar}
          loading={repPacSinTurnos.loading}
          onExport={() =>
            repPacSinTurnos.exportar(
              "PacientesSinTurnos",
              "pacientes_sin_turnos_recientes.xlsx"
            )
          }
        />
        <DataTable
          cols={[
            { key: "nombre", label: "Nombre" },
            { key: "apellido", label: "Apellido" },
          ]}
          rows={repPacSinTurnos.data}
        />
      </Card>

      <Card>
        <SectionHeader
          title="Turnos por profesional"
          onRefresh={repTurnosProfesional.cargar}
          loading={repTurnosProfesional.loading}
          onExport={() =>
            repTurnosProfesional.exportar(
              "TurnosPorProfesional",
              "turnos_por_profesional.xlsx"
            )
          }
        />
        <DataTable
          cols={[
            { key: "profesional", label: "Profesional" },
            { key: "especialidad", label: "Especialidad" },
            { key: "total_turnos", label: "Total turnos" },
          ]}
          rows={repTurnosProfesional.data}
        />
      </Card>
    </div>
  );
}
