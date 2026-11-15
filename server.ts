import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARIA_SYSTEM_INSTRUCTION = `You are ARIA (AI Response & Intelligence Assistant), a dedicated women's safety AI assistant.
Always respond with empathy and urgency-awareness.
Keep responses clear, short, and actionable.
Always end with a relevant helpline number.
Respond in same language as user.
Hindi/Hinglish is fully supported.`;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Compatible /api/chat endpoint (used by SelfDefenseView and general callers)
  app.post('/api/chat', async (req, res) => {
    try {
      const ai = getGenAI();
      const { system_instruction, contents, generationConfig, systemInstruction } = req.body || {};

      const sysText =
        system_instruction?.parts?.[0]?.text ||
        (typeof systemInstruction === 'string' ? systemInstruction : undefined);

      const responseMimeType = generationConfig?.response_mime_type;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: contents || '',
        config: {
          ...(sysText ? { systemInstruction: sysText } : {}),
          ...(responseMimeType ? { responseMimeType } : {}),
        },
      });

      const text = response.text || '';
      return res.json({
        candidates: [
          {
            content: {
              parts: [{ text }],
            },
          },
        ],
        text,
      });
    } catch (error: any) {
      console.error('Gemini /api/chat error:', error);
      return res.status(500).json({
        error: { message: error?.message || 'Failed to generate response' },
      });
    }
  });

  // ARIA Chat endpoint
  app.post('/api/aria/chat', async (req, res) => {
    try {
      const ai = getGenAI();
      const { message, history = [] } = req.body || {};

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      const formattedHistory = Array.isArray(history)
        ? history.map((h: { role: string; text: string }) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          }))
        : [];

      const chat = ai.chats.create({
        model: 'gemini-4-hydrogen',
        config: {
          systemInstruction: ARIA_SYSTEM_INSTRUCTION,
        },
        history: formattedHistory,
      });

      const result = await chat.sendMessage({ message });
      return res.json({
        success: true,
        text: result.text || 'Stay safe. If this is an emergency, call 112 immediately.',
      });
    } catch (error: any) {
      console.error('Gemini /api/aria/chat error:', error);
      return res.status(500).json({
        success: false,
        text: 'Having trouble connecting. If emergency, call 112 immediately.',
      });
    }
  });

  // ARIA Danger Detection endpoint
  app.post('/api/aria/danger', async (req, res) => {
    try {
      const ai = getGenAI();
      const { message } = req.body || {};

      if (!message || typeof message !== 'string') {
        return res.json({
          dangerLevel: 'low',
          suggestSOS: false,
          immediateAction: 'Stay aware of surroundings',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze this message for danger level.\nMessage: "${message}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dangerLevel: {
                type: Type.STRING,
                description: 'One of low, medium, high, critical',
              },
              suggestSOS: {
                type: Type.BOOLEAN,
              },
              immediateAction: {
                type: Type.STRING,
              },
            },
            required: ['dangerLevel', 'suggestSOS', 'immediateAction'],
          },
        },
      });

      const raw = (response.text || '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (error) {
      console.error('Gemini /api/aria/danger error:', error);
      return res.json({
        dangerLevel: 'low',
        suggestSOS: false,
        immediateAction: 'Stay aware of surroundings',
      });
    }
  });

  // Silent Geofence Notification Dispatch endpoint
  app.post('/api/alerts/silent-geofence', async (req, res) => {
    try {
      const {
        userName = 'Guardian User',
        userPhone = '',
        zoneName,
        eventType,
        lat,
        lng,
        contacts = [],
        timestamp,
      } = req.body || {};

      if (!zoneName || (eventType !== 'enter' && eventType !== 'exit')) {
        return res.status(400).json({ ok: false, error: 'Invalid geofence payload' });
      }

      const mapLink =
        typeof lat === 'number' && typeof lng === 'number'
          ? `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`
          : '';
      const actionVerb = eventType === 'enter' ? 'entered' : 'exited';
      const formattedTime =
        timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const message = `[Silent Guardian Alert] ${userName}${
        userPhone ? ` (${userPhone})` : ''
      } has ${actionVerb} marked unsafe area "${zoneName}" at ${formattedTime}.${
        mapLink ? ` Live coordinates: ${mapLink}` : ''
      }`;

      const recipientList = Array.isArray(contacts)
        ? contacts.map((c: any) => `${c.friendName || 'Contact'} (${c.friendPhone || ''})`)
        : [];

      // Optional external webhook forwarding if configured via secret
      const webhookUrl = process.env.SILENT_ALERT_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              silent: true,
              type: 'geofence',
              eventType,
              zoneName,
              userName,
              userPhone,
              lat,
              lng,
              recipients: recipientList,
              message,
              dispatchedAt: new Date().toISOString(),
            }),
          });
        } catch (webhookErr) {
          console.warn('Optional silent alert webhook failed:', webhookErr);
        }
      }

      return res.json({
        ok: true,
        silent: true,
        dispatchedAt: new Date().toISOString(),
        recipientCount: recipientList.length,
        recipients: recipientList,
        message,
      });
    } catch (error: any) {
      console.error('Silent geofence dispatch error:', error);
      return res.status(500).json({ ok: false, error: 'Failed to dispatch silent alert' });
    }
  });

  // Vite middleware in development, static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Guardian server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
