from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from config.database import db

router = APIRouter(tags=["Turnos"], prefix="/turnos")

class TurnoIn(BaseModel):
    paciente_id: int
    profesional_id: int
    servicio_id: int
    sucursal_id: int
    fecha_hora_inicio: str
    monto: Optional[float] = 0
    metodo: Optional[str] = "efectivo"

class Turno(BaseModel):
    id: int
    paciente: str
    profesional: str
    servicio: str
    sucursal: str
    fecha_hora_inicio: str
    fecha_hora_fin: str
    estado: str

@router.get("/", response_model=List[Turno])
async def listar(limit: int = 50, offset: int = 0):
    q = """
    SELECT t.id,
           CONCAT(p.nombre,' ',p.apellido) AS paciente,
           pr.nombre AS profesional,
           s.nombre  AS servicio,
           su.nombre AS sucursal,
           DATE_FORMAT(t.fecha_hora_inicio,'%Y-%m-%d %H:%i:%s') AS fecha_hora_inicio,
           DATE_FORMAT(t.fecha_hora_fin,'%Y-%m-%d %H:%i:%s')   AS fecha_hora_fin,
           t.estado
    FROM turnos t
    JOIN pacientes p      ON p.id=t.paciente_id
    JOIN profesionales pr ON pr.id=t.profesional_id
    JOIN servicios s      ON s.id=t.servicio_id
    JOIN sucursales su    ON su.id=t.sucursal_id
    ORDER BY t.fecha_hora_inicio DESC
    LIMIT :limit OFFSET :offset
    """
    return await db.fetch_all(q, {"limit": limit, "offset": offset})

@router.post("/")
async def crear_turno(data: TurnoIn):
    try:
        row = await db.fetch_one(
            "CALL sp_crear_turno_con_pago(:paciente_id,:profesional_id,:servicio_id,:sucursal_id,:fecha,:monto,:metodo);",
            {
              "paciente_id": data.paciente_id,
              "profesional_id": data.profesional_id,
              "servicio_id": data.servicio_id,
              "sucursal_id": data.sucursal_id,
              "fecha": data.fecha_hora_inicio,
              "monto": data.monto or 0,
              "metodo": data.metodo or "efectivo"
            }
        )
        return {"ok": True, "turno_creado": dict(row) if row else None}
    except Exception as e:
        if "Conflicto de agenda" in str(e):
            raise HTTPException(409, "Conflicto de agenda")
        raise HTTPException(400, "Error al crear turno")

@router.get("/profesionales")
async def listar_profesionales():
    q = "SELECT id, nombre, especialidad FROM profesionales ORDER BY nombre"
    return await db.fetch_all(q)

@router.get("/servicios")
async def listar_servicios():
    q = "SELECT id, nombre, duracion_min FROM servicios WHERE activo=1 ORDER BY nombre"
    return await db.fetch_all(q)

@router.get("/sucursales")
async def listar_sucursales():
    q = "SELECT id, nombre FROM sucursales WHERE activo=1 ORDER BY nombre"
    return await db.fetch_all(q)
