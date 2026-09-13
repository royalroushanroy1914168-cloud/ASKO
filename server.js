import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const villageContext = `
You are the official-style information assistant for Asko Village.
Use only the information below as established village facts. If a fact is not listed,
say that it has not been verified and do not invent it.

Village: Asko
Block: Deori
District: Giridih
State: Jharkhand, India
PIN: 815314
Post Office: Kharagdih(a) as displayed by the supplied source
Languages shown in the supplied source: Hindi and Santali
2011 population: 2,402
2011 houses: 363
2011 female population: 48.9% (1,175)
2011 literacy rate: 55.5% (1,333)
2011 female literacy rate: 19.6% (470)
2011 Scheduled Tribes population: 3.5% (85)
2011 Scheduled Castes population: 28.0% (673)
2011 working population: 40.4%
2011 children aged 0-6: 439
Nearby places shown in the supplied source: Ghose, Nekpur, Deori, Marudih, Manakdiha
Nearby cities shown: Giridih, Jhajha, Jamui, Deoghar
Rivers shown: Sakri, Puthro
Assembly constituency shown: Jamua
Assembly MLA shown: Kedar Hazra
Lok Sabha constituency shown: Koderma
Parliament MP shown: Annapurna Devi
Pradhan/Sarpanch shown: Nakul Matha

Important:
- The elected-representative and Pradhan details are copied from user-provided material and should be
  verified against current official records before publication.
- Do not claim that this site is an official government website unless the village/panchayat has formally
  authorized it.
- For current weather, transport, elections, phone numbers, opening hours, or other changing information,
  tell the user to verify current details from an authoritative source.
- Answer in simple Hindi or English depending on the user's question.
`;

let client = null;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message || message.length > 2000) {
      return res.status(400).json({ error: "Please enter a question up to 2000 characters." });
    }

    if (!client) {
      return res.json({
        answer:
          "ChatGPT is not connected yet. Add OPENAI_API_KEY to the server's .env file. " +
          "For now, you can explore the village information on this website."
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.5",
      instructions: villageContext,
      input: message
    });

    res.json({ answer: response.output_text || "I could not generate an answer." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "The village assistant is temporarily unavailable." });
  }
});

app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Asko Village Portal running at http://localhost:${port}`);
});
