from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
import edge_tts
import uuid
import os
from groq import Groq

app = FastAPI()

# Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
# Speech-to-text (заглушка)
# ----------------------
@app.post("/speech")
async def speech(file: UploadFile = File(...)):
    return {"text": "Hello, how are you?"}

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
    messages = [
        {
            "role": msg.role,
            "content": msg.content
        }
        for msg in data.messages
    ]

    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=messages,
        temperature=0.7
    )

    reply = response.choices[0].message.content

    return {
        "message": {
            "content": reply
        }
    }