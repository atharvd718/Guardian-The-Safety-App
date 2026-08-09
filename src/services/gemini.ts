import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(
  import.meta.env.GEMINI_API_KEY || 
  process.env.GEMINI_API_KEY || ""
)

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `You are ARIA (AI Response & 
    Intelligence Assistant), a dedicated women's 
    safety AI assistant.
    Always respond with empathy and urgency-awareness.
    Keep responses clear, short, and actionable.
    Always end with a relevant helpline number.
    Respond in same language as user.
    Hindi/Hinglish is fully supported.`
})

export const chatWithARIA = async (
  message: string,
  history: { role: string; text: string }[] = []
) => {
  try {
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      }))
    })
    const result = await chat.sendMessage(message)
    return { success: true, text: result.response.text() }
  } catch (error) {
    return { success: false, text: "Having trouble connecting. If emergency, call 112 immediately." }
  }
}

export const detectDanger = async (message: string) => {
  try {
    const result = await model.generateContent(`
      Analyze this message for danger level.
      Return ONLY valid JSON, nothing else:
      {"dangerLevel": "low/medium/high/critical", "suggestSOS": true/false, "immediateAction": "one sentence"}
      Message: "${message}"
    `)
    const text = result.response.text()
    const clean = text.replace(/\`\`\`json|\`\`\`/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return { dangerLevel: "low", suggestSOS: false, immediateAction: "Stay aware of surroundings" }
  }
}
