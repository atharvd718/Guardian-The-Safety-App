> ⚠️ **PROPRIETARY** — All rights
> reserved. Do not clone or reuse.
> © 2026 Atharv Deshmukh

# Guardian 🛡️ — AI-Powered Women Safety App

> Built by **Atharv Deshmukh** — Solo Developer, Age 18

[

![Live Demo](https://img.shields.io/badge/Live-Demo-pink?style=for-the-badge)

](https://guardian-safety-app.vercel.app)
[

![Made with React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)

](https://react.dev)
[

![Powered by Gemini](https://img.shields.io/badge/Gemini-AI-orange?style=for-the-badge&logo=google)

](https://ai.google.dev)
[

![PWA Ready](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge)

](https://guardian-safety-app.vercel.app)

---

## 🎯 Problem Statement

Every 15 minutes a woman in India faces
a safety emergency with no fast way to
alert help. Existing solutions require
unlocking phone, opening apps, typing —
impossible in real danger.

---

## ✅ Solution

Guardian is a one-tap AI safety companion
that instantly:
- Sends live GPS location via WhatsApp
- Alerts all emergency contacts
- Shows nearest Police/Hospital on map
- Provides AI safety guidance via ARIA
- Records audio evidence automatically

---

## 🚀 Live Demo

🌐 **[guardian-safety-app.vercel.app](https://guardian-safety-app.vercel.app)**

> Sign in with Google → Test SOS button
> → Open ARIA chat → Find Safe Places

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🆘 One Tap SOS | Instant emergency alert with GPS |
| 📍 Live Location | Real-time location via WhatsApp |
| 🤖 ARIA AI | Gemini powered safety assistant |
| 🗺️ Safe Places | Nearest Police/Hospital on map |
| 🎙️ Audio Record | Evidence capture and storage |
| 📱 PWA | Installable on phone homescreen |
| 🔐 Auth | Google sign in via Clerk |
| 📄 FIR Generator | AI generated complaint document |

---

## 🛠️ Tech Stack

### Frontend
```text
React 18 + TypeScript    → UI framework
Vite                     → Build tool
Tailwind CSS             → Styling
shadcn/ui                → Components
Motion (Framer)          → Animations
React Leaflet            → Maps
```

### AI & Intelligence
```text
Google Gemini API        → ARIA chat + Vision
Grok API (xAI)          → Threat analysis
Vercel AI SDK            → AI streaming
```

### Backend & Services
```text
Node.js + Express        → API server
Firebase Firestore       → Real-time database
Clerk                    → Authentication
```

### DevOps
```text
Vercel                   → Frontend deploy
GitHub Actions           → CI/CD pipeline
PWA                      → Offline support
```

---

## 📊 Architecture

```text
User Opens App
      ↓
Clerk Auth (Google)
      ↓
React Dashboard
   ↙    ↘
ARIA    SOS Button
Chat      ↓
  ↓    Get GPS
Gemini    ↓
  API  WhatsApp Alert
       + SMS Backup
           ↓
    Emergency Contacts
    Notified instantly
```

---

## 🏗️ Project Structure

```text
guardian-the-safety-app/
├── src/
│   ├── components/
│   │   ├── DashboardView.tsx   ← Main dashboard
│   │   ├── ARIAView.tsx        ← AI chat
│   │   ├── SafePlacesView.tsx  ← Maps
│   │   └── InstallPWA.tsx      ← PWA install
│   ├── api/
│   │   ├── gemini.ts           ← Gemini AI
│   │   ├── grok.ts             ← Grok AI
│   │   └── aiRouter.ts         ← AI routing
│   ├── utils/
│   │   └── emergency.ts        ← SOS logic
│   └── App.tsx
├── public/
│   └── icons/                  ← PWA icons
├── .env.example                ← Key template
└── vercel.json                 ← Deploy config
```

---

## ⚡ Quick Start

```bash
# Clone repository
git clone https://github.com/atharvdeshmukh/guardian-the-safety-app

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Add your API keys to .env

# Run development server
npm run dev

# Open http://localhost:5173
```

---

## 🔑 Environment Variables

```bash
# Get from aistudio.google.com
VITE_GEMINI_API_KEY=

# Get from console.x.ai
VITE_GROK_API_KEY=

# Get from clerk.com
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

---

## 🧠 AI Features Deep Dive

### ARIA — AI Response & Intelligence Assistant
```text
Powered by: Google Gemini 1.5 Flash
Purpose:    24/7 safety companion
Features:
  → Emergency guidance
  → Self defense tips
  → India helplines (112, 1091, 181)
  → Hindi + English support
  → Context aware responses
```

### Threat Detection
```text
Powered by: Grok AI (xAI)
Purpose:    Analyze danger level
Features:
  → Danger score 1-10
  → Immediate action steps
  → Who to call guidance
  → Real-time analysis
```

### Scene Analyzer
```text
Powered by: Gemini Vision
Purpose:    Analyze surroundings
Features:
  → Photo based threat detection
  → Safe/Caution/Danger rating
  → Specific threat identification
```

---

## 📱 PWA Features

```text
✅ Install on Android homescreen
✅ Install on iPhone homescreen
✅ Works offline (core features)
✅ Push notifications
✅ SOS shortcut on long press
✅ ARIA shortcut on long press
✅ Splash screen
✅ Native app feel
```

---

## 🏆 Hackathon Achievements

```text
🥇 IDEA Competition 2026 — COEP
   Bhau Institute Submission

Category:  AI/IoT + Women Safety
TRL Level: 3-5 (Working Prototype)
Mentorship: Bhau Institute Selected
```

---

## 📈 Impact Metrics

```text
Target Users:    200M+ women in India
Response Time:   < 3 seconds SOS alert
Availability:    99.9% (Vercel SLA)
Cost to user:    ₹0 (completely free)
Languages:       Hindi + English
Platforms:       Any device with browser
```

---

## 🔮 Roadmap

```text
v1.0 ✅  Core SOS + GPS + ARIA
v1.1 🔄  Clerk Auth + PWA
v1.2 ⏳  Shake to SOS + Voice activation
v1.3 ⏳  112 API integration
v1.4 ⏳  React Native mobile app
v2.0 ⏳  Community safety network
```

---

## 👨‍💻 Developer

**Atharv Deshmukh**
- 🎓 Engineering Student
- 🚀 Solo Full Stack Developer
- 🤖 AI Application Builder
- 📍 Pune, India

[

![GitHub](https://img.shields.io/badge/GitHub-atharvdeshmukh-black?style=flat&logo=github)

](https://github.com/atharvdeshmukh)
[

![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)

](https://linkedin.com/in/atharvdeshmukh)

---

## 📄 License & Usage

**© 2026 Atharv Deshmukh. All Rights Reserved.**

⚠️ PROPRIETARY SOFTWARE

This project and its source code are the
exclusive intellectual property of
Atharv Deshmukh.

NOT permitted:
  ❌ Copy or clone this repository
  ❌ Use code in your own projects
  ❌ Redistribute any part of this app
  ❌ Commercial use of any kind
  ❌ Submit as your own work

PERMITTED:
  ✅ View code for learning purposes
  ✅ Star and share the repository
  ✅ Use the live demo
  ✅ Reference in research with credit

For licensing inquiries:
  📧 atharvdeshmukh4.11.2006@gmail.com

> This project was independently built
> by Atharv Deshmukh as part of
> Guardian Safety App initiative.
> Unauthorized use is strictly prohibited.

---

<div align="center">
Built with ❤️ for women's safety in India
<br/>
⭐ Star this repo if you find it useful!
</div>
