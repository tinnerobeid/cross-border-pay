import os
from uuid import uuid4
from fastapi import UploadFile
from app.core.config import settings

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

async def save_upload(user_id: int, file: UploadFile, kind: str) -> str:
    # kind: selfie | id_front | id_back
    root = settings.STORAGE_ROOT
    user_dir = os.path.join(root, "kyc", str(user_id))
    ensure_dir(user_dir)

    ext = os.path.splitext(file.filename or "")[1] or ".bin"
    filename = f"{kind}_{uuid4().hex}{ext}"
    full_path = os.path.join(user_dir, filename)

    contents = await file.read()
    with open(full_path, "wb") as f:
        f.write(contents)

    return full_path
