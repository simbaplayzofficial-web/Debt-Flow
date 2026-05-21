/**
 * Chatterbox AI Peripheral
 * Handles secure communication with the DebtFlow Intelligence Backend.
 * 
 * NOTE: All AI operations are proxied through /api/chatterbox to protect 
 * credentials and enforce security protocols.
 */

export interface ChatterboxRequest {
  messages: { role: string; content: string }[];
  context: string;
  userText: string;
  deepResearch: boolean;
  responseMode: string;
}

export async function askChatterbox(request: ChatterboxRequest) {
  try {
    const response = await fetch('/api/chatterbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      // Provide detailed error feedback for debugging as requested
      const errorDetail = data.details || data.error || "Uplink Failure";
      console.error("CHATTERBOX UPLINK ERROR:", errorDetail);
      throw new Error(errorDetail);
    }

    return data.text;
  } catch (error: any) {
    console.error("CHATTERBOX PERIPHERAL FAILURE:", error);
    throw error;
  }
}
