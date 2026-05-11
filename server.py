from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import shutil
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


# простой тест, чтобы /docs и / работали
@app.get("/")
def root():
    return {"ok": True}

# модель Whisper
model = WhisperModel("base", compute_type="int8")


@app.post("/speech")
async def speech(file: UploadFile = File(...)):
    # временный файл
    filename = f"{uuid.uuid4()}.webm"

    try:
        # сохраняем аудио
        with open(filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # распознаём
        segments, info = model.transcribe(filename)

        text = " ".join([s.text for s in segments]).strip()

        return {"text": text}

    finally:
        # чистим файл
        if os.path.exists(filename):
            os.remove(filename)


import edge_tts
from fastapi.responses import FileResponse
from pydantic import BaseModel

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"

@app.post("/tts")
async def tts(data: TTSRequest):
    text = data.text
    voice = data.voice

    print("TEXT:", text)
    print("VOICE FROM FRONTEND:", voice)

    filename = f"{uuid.uuid4()}.mp3"
    path = os.path.join(".", filename)

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(path)

    return FileResponse(
        path,
        media_type="audio/mpeg",
        filename="speech.mp3"
    )
