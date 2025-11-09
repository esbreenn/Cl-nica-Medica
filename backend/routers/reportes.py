from fastapi import APIRouter
from config.database import db

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"]
)

# 1) INNER JOIN
@router.get("/turnos_por_paciente")
async def turnos_por_paciente():
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

# 2) SUBCONSULTA
@router.get("/pacientes_sin_turnos_recientes")
async def pacientes_sin_turnos_recientes():
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

# 3) GROUP BY
@router.get("/turnos_por_profesional")
async def turnos_por_profesional():
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
