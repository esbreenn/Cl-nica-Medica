"""Configuración de la conexión asíncrona a MySQL."""

from databases import Database
from dotenv import load_dotenv
import os

# Cargo las variables de entorno desde el archivo .env para no exponer credenciales en el código.
load_dotenv()

# Recupero los datos de conexión. Si no defino el host uso localhost para desarrollo.
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Construyo la URL que entiende la librería `databases` con el driver asíncrono de MySQL (aiomysql).
DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306/{DB_NAME}?charset=utf8mb4"

# Instancio el objeto Database que reutilizo en todos los routers para ejecutar consultas async.
db = Database(DATABASE_URL)
