# Guardian - The Safety App (Web Application)

Guardian is a full-stack React safety web application designed to ensure personal security by providing emergency tools like SOS alerts, live GPS location tracking, emergency audio recording, customizable trusted emergency contacts, and an AI Safety Assistant (ShieldMate Bot).

## Core Features

- **SOS Broadcast**: One-tap emergency broadcast that automatically fetches your current GPS location, generates Google Maps links, alerts all emergency contacts, and initializes audio recording.
- **Emergency SMS**: Custom emergency distress message composer with automatic user tag and recipient progress tracking.
- **Audio Recording**: Full-featured audio recorder with live recording timer (`00:00.00`), pause/resume/stop controls, waveform visualizer, and instant WhatsApp / system audio sharing.
- **Track Me**: Live GPS map tracking with current latitude/longitude, address geocoding, and one-tap location link sharing.
- **ShieldMate AI Chatbot**: 24/7 AI Safety Assistant powered by Gemini API providing emergency advice, self-defense guidelines, and emergency helplines.
- **Emergency Contacts Manager**: Add and manage trusted emergency contacts with name, 10-digit phone number, and relationship tags.
- **Onboarding Carousel**: Interactive 3-slide introduction walking users through Guardian's core protection features.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend / API**: Node.js, Express, Vite, Google Gemini API (`@google/genai`)
- **State & Persistence**: LocalStorage & Ephemeral Storage Service
