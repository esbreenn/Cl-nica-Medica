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

class TurnoUpdate(BaseModel):
    profesional_id: int
    servicio_id: int
    sucursal_id: int
    fecha_hora_inicio: str
    

class EstadoIn(BaseModel):
    estado: str  # 'reservado' | 'confirmado' | 'atendido' | 'cancelado' | 'ausente'

@router.patch("/{id}/estado")
async def cambiar_estado(id: int, data: EstadoIn):
    if data.estado not in {"reservado","confirmado","atendido","cancelado","ausente"}:
        raise HTTPException(400, "Estado inválido")
    if not await db.fetch_one("SELECT id FROM turnos WHERE id=:id", {"id": id}):
        raise HTTPException(404, "Turno no encontrado")
    await db.execute("UPDATE turnos SET estado=:estado WHERE id=:id", {"estado": data.estado, "id": id})
    return {"ok": True}


@router.put("/{id}")
async def reprogramar(id: int, data: TurnoUpdate):
    try:
        row = await db.fetch_one(
            "CALL sp_reprogramar_turno(:id,:prof,:serv,:suc,:fecha);",
            {
                "id": id,
                "prof": data.profesional_id,
                "serv": data.servicio_id,
                "suc": data.sucursal_id,
                "fecha": data.fecha_hora_inicio
            }
        )
        return {"ok": True, "turno_actualizado": dict(row) if row else None}
    except Exception as e:
        if "conflicto" in str(e).lower():
            raise HTTPException(409, "Conflicto de agenda")
        raise HTTPException(400, "Error al reprogramar turno")


@router.get("/", response_model=List[Turno])
async def listar(
    limit: int = 50,
    offset: int = 0,
    profesional_id: int | None = None,
    estado: str | None = None,                 # reservado | confirmado | atendido | cancelado | ausente
    desde: str | None = None,                  # 'YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS'
    hasta: str | None = None,
    paciente_dni: int | None = None
):
    base = """
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
    WHERE 1=1
    """
    vals = {"limit": limit, "offset": offset}
    if profesional_id:
        base += " AND t.profesional_id=:profesional_id"
        vals["profesional_id"] = profesional_id
    if estado:
        base += " AND t.estado=:estado"
        vals["estado"] = estado
    if desde:
        base += " AND t.fecha_hora_inicio >= :desde"
        vals["desde"] = desde
    if hasta:
        base += " AND t.fecha_hora_inicio <= :hasta"
        vals["hasta"] = hasta
    if paciente_dni:
        base += " AND p.dni = :paciente_dni"
        vals["paciente_dni"] = paciente_dni

    q = base + " ORDER BY t.fecha_hora_inicio DESC LIMIT :limit OFFSET :offset"
    return await db.fetch_all(q, vals)

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

@router.delete("/{id}")
async def eliminar(id: int):
    if not await db.fetch_one("SELECT id FROM turnos WHERE id=:id", {"id": id}):
        raise HTTPException(404, "Turno no encontrado")
    await db.execute("DELETE FROM turnos WHERE id=:id", {"id": id})
    return {"ok": True}
