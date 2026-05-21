import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (apiKey) {
    console.log("AI SYSTEM: Key detected (prefix: " + apiKey.substring(0, 4) + "****)");
  } else {
    console.warn("AI WARNING: No GEMINI_API_KEY or VITE_GEMINI_API_KEY found in process.env");
  }

  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // Startup Validation
  const validateAI = async () => {
    if (!genAI) return;
    
    // We try gemini-2.0-flash which often requires v1beta
    const testModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: "v1beta" });
    try {
      await testModel.generateContent("Hello");
      console.log("AI ONLINE: gemini-2.0-flash (v1beta) verified.");
    } catch (err: any) {
      console.warn("AI WARNING (gemini-2.0-flash):", err.message);
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1beta" });
        await fallbackModel.generateContent("Hello");
        console.log("AI ONLINE: fallback gemini-1.5-flash (v1beta) verified.");
      } catch (err2: any) {
        console.error("CRITICAL AI FAILURE: All model nodes offline.", err2.message);
      }
    }
  };
  validateAI();

  // AI Proxy Route
  app.post('/api/chatterbox', async (req, res) => {
    const { messages, context, userText, deepResearch, responseMode } = req.body;

    if (!genAI) {
      return res.status(500).json({ 
        error: "AI Config Error", 
        details: "Chatterbox AI model configuration failed. Please verify GEMINI_API_KEY in the platform secrets." 
      });
    }

    try {
      const modeInstruction = 
        responseMode === 'Quick Summary' ? "Mode: QUICK SUMMARY. Be extremely concise. Core facts only." :
        responseMode === 'Political Analysis' ? "Mode: POLITICAL ANALYSIS. Focus on power dynamics, governance, and implications." :
        responseMode === 'Educational' ? "Mode: EDUCATIONAL. Explain concepts clearly for a student level." :
        responseMode === 'Deep Research' ? "Mode: DEEP RESEARCH. Exhaustive analysis mode ENABLED. Provide structured, multi-dimensional breakdowns." :
        "Mode: NORMAL. Balanced intelligence response.";

      const systemInstruction = `
        You are a helpful assistant inside a chat application ("Chatterbox" hub of DebtFlow).
        
        Rules:
        - Be concise and accurate.
        - If unsure, say you are unsure.
        - Never assume API/model capabilities.
        - If a request depends on unavailable tools or models, explain the limitation and suggest alternatives.
        - Do not reference internal API errors.
        - Keep responses user-focused and simple.
        
        CURRENT OPERATIONAL MODE: ${modeInstruction}
        
        SAFE CONTEXT:
        ${context}
      `;

      // Fallback Engine Logic
      const generateResponse = async () => {
        const models = [
          "gemini-1.5-pro-latest",
          "gemini-1.5-flash",
          "gemini-1.0-pro"
        ];

        // Clean messages for the SDK
        const cleanedMessages = messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content || "" }]
        })).filter((m: any) => m.parts[0].text.length > 0);

        for (const modelName of models) {
          try {
            console.log(`[Chatterbox] Engaging Node: ${modelName}...`);
            const aiModel = genAI.getGenerativeModel({ 
              model: modelName,
              systemInstruction: systemInstruction 
            }, { apiVersion: "v1beta" });

            const result = await aiModel.generateContent({
              contents: [
                ...cleanedMessages,
                { role: 'user', parts: [{ text: userText }] }
              ],
              tools: modelName.includes('flash') ? [{ googleSearch: {} }] as any : [],
              generationConfig: {
                maxOutputTokens: deepResearch ? 4096 : 1024,
                temperature: deepResearch ? 0.8 : 0.4,
              }
            });
            
            console.log(`[Chatterbox] Response Success from ${modelName}`);
            return result.response;
          } catch (e: any) {
            console.warn(`[Chatterbox] Node ${modelName} Failed:`, e.message);
            if (e.status === 404 || e.message?.includes('404')) continue;
            throw e;
          }
        }
        
        throw new Error("All models failed");
      };

      const response = await generateResponse();
      const text = response.text() || "AI service temporarily unavailable. Switching to backup model...";
      
      res.json({ text });
    } catch (error: any) {
      console.error("CHATTERBOX CRITICAL ERROR:", error);
      res.status(error.status || 500).json({ 
        error: "Uplink Error", 
        details: "AI service is currently unavailable. Please try again in a moment."
      });
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
