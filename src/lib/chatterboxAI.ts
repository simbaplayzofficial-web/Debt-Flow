/**
 * Chatterbox AI Peripheral
 * Handles secure communication with the DebtFlow Intelligence Backend.
 * 
 * NOTE: All AI operations are proxied through /api/chatterbox to protect 
 * credentials.
 */

export interface ChatterboxRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  userText: string;
}

export async function askChatterbox(request: ChatterboxRequest): Promise<string> {
  try {
    const response = await fetch('/api/chatterbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorDetail = data.details || data.error || "Chatterbox temporarily unavailable.";
      console.error("CHATTERBOX UPLINK ERROR:", errorDetail);
      throw new Error(errorDetail);
    }

    return data.text || "Chatterbox temporarily unavailable.";
  } catch (error: any) {
    console.error("CHATTERBOX PERIPHERAL FAILURE:", error);
    throw new Error("Chatterbox temporarily unavailable.");
  }
}
