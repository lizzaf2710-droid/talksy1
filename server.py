from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
import edge_tts
import uuid
import os
from groq import Groq
import tempfile

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY is not set")

client = Groq(api_key=api_key)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Root
# ----------------------
@app.get("/")
def root():
    return {"ok": True}

# ----------------------
# Speech-to-text 
# ----------------------
@app.post("/speech")
async def speech(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3",
                language="en"
            )

        return {"text": transcript.text}

    finally:
        os.remove(tmp_path)

# ----------------------
# TTS
# ----------------------
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

# ----------------------
# Chat
# ----------------------
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: list[Message]

@app.post("/chat")
async def chat(data: ChatRequest):

    model = data.model if data.model else "llama-3.3-70b-versatile"

    messages = [
        {"role": m.role, "content": m.content}
        for m in data.messages
    ]

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7
    )

    return {
        "message": {
            "content": response.choices[0].message.content
        }
    }

