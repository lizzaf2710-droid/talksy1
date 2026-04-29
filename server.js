const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY
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
