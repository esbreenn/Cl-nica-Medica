from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from config.database import db

router = APIRouter(tags=["Pacientes"], prefix="/pacientes")

class PacienteIn(BaseModel):
    dni: int = Field(..., ge=1)
    nombre: str = Field(..., min_length=1, max_length=120)
    apellido: str = Field(..., min_length=1, max_length=120)
    fecha_nac: Optional[str] = None
    obra_social: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

class Paciente(PacienteIn):
    id: int
    creado_en: Optional[str] = None

@router.get("/", response_model=List[Paciente])
async def listar(q: Optional[str] = Query(None), limit: int = 50, offset: int = 0):
    base = """
    SELECT id,dni,nombre,apellido,DATE_FORMAT(fecha_nac,'%Y-%m-%d') fecha_nac,
           obra_social,telefono,email,DATE_FORMAT(creado_en,'%Y-%m-%d %H:%i:%s') creado_en
    FROM pacientes
    """
    vals = {"limit": limit, "offset": offset}
    if q:
        query = base + " WHERE nombre LIKE :q OR apellido LIKE :q OR CAST(dni AS CHAR) LIKE :q ORDER BY creado_en DESC LIMIT :limit OFFSET :offset"
        vals["q"] = f"%{q}%"
    else:
        query = base + " ORDER BY creado_en DESC LIMIT :limit OFFSET :offset"
    return await db.fetch_all(query, vals)

@router.get("/{id}", response_model=Paciente)
async def obtener(id: int):
    row = await db.fetch_one("""
      SELECT id,dni,nombre,apellido,DATE_FORMAT(fecha_nac,'%Y-%m-%d') fecha_nac,
             obra_social,telefono,email,DATE_FORMAT(creado_en,'%Y-%m-%d %H:%i:%s') creado_en
      FROM pacientes WHERE id=:id
    """, {"id": id})
    if not row: raise HTTPException(404, "Paciente no encontrado")
    return row

@router.post("/", response_model=Paciente, status_code=201)
async def crear(p: PacienteIn):
    try:
        new_id = await db.execute("""
          INSERT INTO pacientes(dni,nombre,apellido,fecha_nac,obra_social,telefono,email)
          VALUES(:dni,:nombre,:apellido,:fecha_nac,:obra_social,:telefono,:email)
        """, p.dict())
    except Exception as e:
        if "1062" in str(e): raise HTTPException(409, "DNI duplicado")
        raise HTTPException(400, "Error al crear paciente")
    return await obtener(new_id)

@router.put("/{id}", response_model=Paciente)
async def actualizar(id: int, p: PacienteIn):
    if not await db.fetch_one("SELECT id FROM pacientes WHERE id=:id", {"id": id}):
        raise HTTPException(404, "Paciente no encontrado")
    await db.execute("""
      UPDATE pacientes SET dni=:dni,nombre=:nombre,apellido=:apellido,fecha_nac=:fecha_nac,
        obra_social=:obra_social,telefono=:telefono,email=:email
      WHERE id=:id
    """, {**p.dict(), "id": id})
    return await obtener(id)

@router.delete("/{id}")
async def borrar(id: int):
    if not await db.fetch_one("SELECT id FROM pacientes WHERE id=:id", {"id": id}):
        raise HTTPException(404, "Paciente no encontrado")
    await db.execute("DELETE FROM pacientes WHERE id=:id", {"id": id})
    return {"ok": True}
