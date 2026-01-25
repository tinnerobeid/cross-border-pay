import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Nuru Pay API")
DB_URL = os.getenv("DB_URL")

if not DB_URL:
    raise RuntimeError("DB_URL is missing. Create backend/.env and set DB_URL.")
