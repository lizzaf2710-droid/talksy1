from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
import edge_tts
import uuid
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
async def speech():
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
    user_text = data.messages[-1].content

    return {
        "message": {
            "content": f"That's interesting! You said: {user_text}"
        }
<<<<<<< HEAD
    }
=======
    }
>>>>>>> 1ea2a56198c42e3111fb41e0e95858cc19c11e00
