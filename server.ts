import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (apiKey) {
    console.log("AI SYSTEM [Modern]: Key detected (prefix: " + apiKey.substring(0, 4) + "****)");
  } else {
    console.warn("AI WARNING [Modern]: No GEMINI_API_KEY or VITE_GEMINI_API_KEY found in process.env");
  }

  const ai = apiKey ? new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // AI Proxy Route
  app.post('/api/chatterbox', async (req, res) => {
    const { messages, userText } = req.body;

    if (!ai) {
      return res.status(500).json({ 
        error: "AI Config Error", 
        details: "Chatterbox temporarily unavailable." 
      });
    }

    try {
      // Clean chat history for the modern SDK: Keep assistants as 'model' and users as 'user'
      const formattedContents = (messages || [])
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content || "" }]
        }))
        .filter((c: any) => c.parts[0].text.trim().length > 0);

      // Append raw user target text
      if (userText && userText.trim()) {
        formattedContents.push({
          role: 'user',
          parts: [{ text: userText.trim() }]
        });
      }

      if (formattedContents.length === 0) {
        return res.status(400).json({ error: "Missing active transmission payload" });
      }

      // Add 12-second gate timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("GATEWAY_TIMEOUT")), 12000);
      });

      const aiCallPromise = ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: `You are a cinematic cybernetic AI assistant for DebtFlow called "Chatterbox".
Purpose:
- Help users learn about DebtFlow (financial balance tracking, system updates, integrity scores).
- Answer history, science, literature, general knowledge, and tech inquiries.
- Act as simple stable assistant.

CRITICAL SECURITY RULE: You CANNOT access Special Ops, Global Audit, admin systems, or hidden tables. If asked, state clearly: "UPLINK DECONSOLIDATED: Access denied for Special Ops / compartmented systems."
Keep responses clear, concise, informative and engaging using standard Markdown. Do not expose internal technical logs.`,
          temperature: 0.7,
        }
      });

      // Race against timeout
      const result: any = await Promise.race([aiCallPromise, timeoutPromise]);
      const text = result?.text || "Chatterbox temporarily unavailable.";
      
      res.json({ text });
    } catch (error: any) {
      console.error("CHATTERBOX ERROR:", error);
      if (error.message === "GATEWAY_TIMEOUT") {
        return res.status(504).json({ error: "Uplink Timeout. Please retry." });
      }
      res.status(500).json({ error: "Chatterbox temporarily unavailable." });
    }
  });

  const isProduction = process.env.NODE_ENV === "production";
  console.log(`[System] Initializing in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
