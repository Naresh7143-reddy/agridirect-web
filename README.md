# AgriDirect Web

Next.js 14 + Tailwind + Firebase web app for AgriDirect — connecting Indian farmers directly to buyers.

**Live backend:** https://agridirect-backend-80yz.onrender.com (75/75 endpoints passing)

## Built so far ✅

| Page | Status | Path |
|---|---|---|
| Landing (marketing) | ✅ | `/` |
| Phone OTP login | ✅ | `/login` |
| Buyer Home | ✅ | `/buyer` |
| Browse / Search | ✅ | `/buyer/browse` |
| Product Detail | ✅ | `/buyer/product/[id]` |
| Cart | ✅ | `/buyer/cart` |
| AI Chat (Krishi AI) | ✅ | `/farmer/ai` |

## To finish (use the prompts in `AGRIDIRECT_WEB_PROMPTS.md`)

- Buyer checkout, orders, profile
- Farmer dashboard (home, products, orders, earnings)
- Delivery dashboard
- Admin panel
- Razorpay integration

## Run locally

```bash
pnpm install     # or npm install
cp .env.example .env.local   # fill in Firebase keys from console
pnpm dev         # localhost:3000
```

## Deploy to Vercel (one-click)

1. Push this repo to GitHub
2. Go to https://vercel.com/new → import the repo
3. Add these environment variables (Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` = `https://agridirect-backend-80yz.onrender.com`
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = (from Firebase Console)
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `agridirect-9427a.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `agridirect-9427a`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `agridirect-9427a.appspot.com`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `994573510262`
   - `NEXT_PUBLIC_FIREBASE_APP_ID` = (from Firebase Console)
4. Deploy
5. **Important:** Add your Vercel URL to Firebase Console → Authentication → Settings → Authorized domains

## Test

- Phone login with test number: `8919012622` → OTP `123456`
- Browse products from the live backend
- Add to cart, view product detail
- Try the AI chat

## Stack

- **Next.js 14** App Router
- **Tailwind CSS** + brand tokens
- **Framer Motion** animations
- **Firebase Web SDK** auth
- **Zustand** cart store (persists to localStorage)
- **axios** API client with JWT injection
- **sonner** toasts
- **Lucide React** icons

Built by [Godi Naresh Reddy](https://github.com/Naresh7143-reddy).
