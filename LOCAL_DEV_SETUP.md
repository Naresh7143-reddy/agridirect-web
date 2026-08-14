# AgriDirect Local Development Setup

## Overview
Your project runs locally with cloud services. This provides fast local development while keeping backend and database in the cloud.

## Architecture
```
Your Machine (Local)
├── Frontend (Next.js 14)  → http://localhost:3000
│   └── env: .env.local
└── Backend (Spring Boot 3)  → http://localhost:8090
    └── Connects to: Supabase (Cloud)

Cloud Services
├── Database: Supabase PostgreSQL (AWS)
├── Auth: Firebase
├── File Storage: Cloudinary
├── Payments: Razorpay
└── AI: Gemini, Groq, XAI
```

## Quick Start

### 1. Start Backend (Spring Boot)
```bash
cd C:\Users\nares\Downloads\backend
.\start-server.bat
```
**Expected Output:**
```
Tomcat started on port 8090 (http) with context path ''
```
Backend will be ready at: `http://localhost:8090`

### 2. Start Frontend (Next.js)
```bash
cd C:\Users\nares\Downloads\agridirect-web
npm run dev
```
**Expected Output:**
```
✓ Ready in XX.Xs
- Local:        http://localhost:3000
```
Frontend will be ready at: `http://localhost:3000`

### 3. Open Your Browser
Navigate to: **http://localhost:3000**

---

## Environment Configuration

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL=http://localhost:8090` (Backend API)
- `NEXT_PUBLIC_FIREBASE_API_KEY` (Cloud)
- `NEXT_PUBLIC_RAZORPAY_KEY` (Cloud)

### Backend (start-server.bat)
- `DB_URL` → Supabase PostgreSQL (Cloud)
- `DB_USERNAME` → Supabase credentials
- `DB_PASSWORD` → Supabase credentials
- All other services → Cloud-based

---

## Troubleshooting

### Port Already in Use
**Error:** "Port 8090 was already in use"

**Solution:**
```powershell
# Find process using port 8090
Get-NetTCPConnection -LocalPort 8090

# Kill it
Stop-Process -Id <PID> -Force
```

### Backend Connection Failed
**Error:** "Unable to determine Dialect without JDBC metadata"

**Solution:** Make sure `start-server.bat` sets all environment variables correctly.

### Frontend Can't Reach Backend
**Error:** Network errors in browser console

**Check:**
1. Backend is running: `http://localhost:8090` (should load)
2. `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8090`
3. No firewall blocking local traffic

### Slow Performance
- Backend: Spring Boot might be slow first request (JVM warmup)
- Frontend: Next.js compilation takes time first run
- Both should be fast after warmup

---

## Development Tips

### Live Reload
- **Frontend:** Automatic (modify any file in `app/` or `components/`)
- **Backend:** Spring DevTools enabled (auto-restart on class changes)

### Database Access
To check data directly:
```
Host: aws-0-ap-southeast-2.pooler.supabase.com
Database: postgres
Username: postgres.otgnhaevwkzxmvjekbmn
(Use any PostgreSQL client like DBeaver)
```

### View Logs
- **Backend:** Check terminal running `start-server.bat`
- **Frontend:** Check terminal running `npm run dev`
- **Browser Console:** DevTools → Console tab

---

## Cloud Services Status

All cloud services remain unchanged:
- ✅ Supabase Database (PostgreSQL)
- ✅ Firebase Authentication
- ✅ Cloudinary Image Storage
- ✅ Razorpay Payments
- ✅ Gemini AI Integration
- ✅ Groq API
- ✅ XAI Integration

---

## Switching Back to Cloud Backend

If you need to use the Render deployment instead:

1. Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=https://agridirect-backend-80yz.onrender.com
```

2. Stop local backend

3. Restart frontend

---

## Common Commands

| Task | Command |
|------|---------|
| Start Backend | `cd C:\Users\nares\Downloads\backend && .\start-server.bat` |
| Start Frontend | `cd C:\Users\nares\Downloads\agridirect-web && npm run dev` |
| Run Tests | `npm run test` (frontend) or `mvn test` (backend) |
| Build for Production | `npm run build` (frontend) or `mvn clean package` (backend) |
| Format Code | `npm run lint` (frontend) |

---

## Notes
- Your database is in **Supabase** (cloud), so all data persists
- Local backend runs on **port 8090** (NOT 8080)
- Local frontend runs on **port 3000** (standard Next.js)
- Both services have hot-reload enabled for development

---

**Last Updated:** August 14, 2026
**Setup Type:** Local Frontend & Backend + Cloud Services
