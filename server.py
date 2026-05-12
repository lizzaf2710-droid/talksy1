from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
import edge_tts
import uuid
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True}


# Заглушка для распознавания речи
@app.post("/speech")
async def speech():
    return {"text": "Speech пока не подключён"}


# TTS
class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"


@app.post("/tts")
async def tts(data: TTSRequest):
    filename = f"{uuid.uuid4()}.mp3"

    communicate = edge_tts.Communicate(data.text, data.voice)
    await communicate.save(filename)

    return FileResponse(
        filename,
        media_type="audio/mpeg",
        filename="speech.mp3"
    )
