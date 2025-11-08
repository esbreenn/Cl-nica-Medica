from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import db
from routers import pacientes, turnos
import os

app = FastAPI(title="Clínica - Gestión de Turnos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

@app.on_event("startup")
async def startup(): await db.connect()

@app.on_event("shutdown")
async def shutdown(): await db.disconnect()

@app.get("/")
async def root(): return {"message": "API viva y conectada"}

app.include_router(pacientes.router, prefix="/api")
app.include_router(turnos.router,    prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=int(os.getenv("PORT", 8000)), reload=True)
