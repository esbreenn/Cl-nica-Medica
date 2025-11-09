"""Reportes SQL para mostrar métricas rápidas de la clínica."""

from fastapi import APIRouter
from config.database import db

# Creo un router separado para agrupar consultas más analíticas.
router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"]
)


@router.get("/turnos_por_paciente")
async def turnos_por_paciente():
    """Reporte con INNER JOIN para ver quiénes son los pacientes con más turnos."""

    query = """
        SELECT
            p.nombre AS paciente,
            p.apellido AS apellido,
            COUNT(t.id) AS total_turnos
        FROM pacientes p
        INNER JOIN turnos t ON t.paciente_id = p.id
        GROUP BY p.id
        ORDER BY total_turnos DESC;
    """
    return await db.fetch_all(query)


@router.get("/pacientes_sin_turnos_recientes")
async def pacientes_sin_turnos_recientes():
    """Ejemplo de subconsulta para detectar pacientes inactivos en los últimos 30 días."""

    query = """
        SELECT nombre, apellido
        FROM pacientes
        WHERE id NOT IN (
            SELECT DISTINCT paciente_id
            FROM turnos
            WHERE fecha_hora_inicio > DATE_SUB(NOW(), INTERVAL 30 DAY)
        );
    """
    return await db.fetch_all(query)


@router.get("/turnos_por_profesional")
async def turnos_por_profesional():
    """Reporte con GROUP BY y LEFT JOIN para analizar la carga de turnos por profesional."""

    query = """
        SELECT
            pr.nombre AS profesional,
            pr.especialidad,
            COUNT(t.id) AS total_turnos
        FROM profesionales pr
        LEFT JOIN turnos t ON t.profesional_id = pr.id
        GROUP BY pr.id
        ORDER BY total_turnos DESC;
    """
    return await db.fetch_all(query)
