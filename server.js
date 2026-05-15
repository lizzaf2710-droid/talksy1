const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Talksy backend is running 🚀");
});

const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
  console.error("GROQ_API_KEY is missing");
}

app.post("/chat", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
       headers: {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json"
},
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: req.body.messages,
          temperature: 0.7
        })
   });

    const data = await response.json();

    res.json({
      message: data.choices?.[0]?.message || {
        content: "No response"
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
