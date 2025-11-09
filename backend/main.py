"""Punto de entrada de la API de gestión de turnos de la clínica."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import db
from routers import pacientes, turnos, reportes
import os


# Acá levanto la aplicación principal de FastAPI y le doy un título descriptivo.
app = FastAPI(title="Clínica - Gestión de Turnos")

# Configuro CORS para que cualquier frontend (por ejemplo el de Vite/React) pueda hablar con la API
# sin restricciones de origen, métodos o cabeceras. Esto facilita las pruebas en clase.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

# Registro los diferentes routers que modularizan las rutas de pacientes, turnos y reportes.
# El prefijo /api mantiene una convención clara para todos los endpoints de la API.
app.include_router(pacientes.router, prefix="/api")
app.include_router(turnos.router, prefix="/api")
app.include_router(reportes.router, prefix="/api")


@app.on_event("startup")
async def startup():
    """Cuando el servidor arranca abro la conexión a la base de datos."""

    await db.connect()


@app.on_event("shutdown")
async def shutdown():
    """Antes de apagar la aplicación cierro la conexión para liberar recursos."""

    await db.disconnect()


@app.get("/")
async def root():
    """Endpoint mínimo para comprobar que la API está viva."""

    return {"message": "API viva y conectada"}


if __name__ == "__main__":
    # Este bloque me permite ejecutar `python main.py` en local y levantar Uvicorn con recarga en caliente.
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=int(os.getenv("PORT", 8000)), reload=True)
