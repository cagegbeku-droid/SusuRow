# 🇬🇭 SusuRow — Digital Rotating Savings & Credit Platform for Ghana

**SusuRow** digitizes the traditional West African "Susu" rotational peer-to-peer savings model (ROSCA) for the Ghanaian fintech ecosystem with automated Ghana Mobile Money settlement, escrow deposit security, and transparent rotational rounds.

---

## 🚀 Key Features

- **Public Marketplace & Groups**: Browse savings groups, explore cycle rounds, inspect rules, and estimate returns with the built-in Pot Calculator.
- **Action-Gated Authentication**: Secure Phone Number + Password accounts with instant Ghana SMS OTP verification (Arkesel single-segment GSM routing).
- **Ghana Mobile Money Integration**: Real-time MoMo collections and disbursements via **Paystack Ghana** (MTN MoMo, Telecel Cash, AT Money).
- **Flexible Rotation Schemes**:
  - `SEQUENTIAL`: Pre-assigned round turns.
  - `BALLOT`: Automated provably fair shuffle with cryptographic seed.
  - `BIDDING`: German/ROSCA auction where members bid discounts for early turns.
- **Financial Protection**: Upfront commitment deposits in escrow and creator rules to protect saver funds.
- **Senior / Large-Text Accessibility**: High-contrast, scalable text mode for comfortable reading for both young savers and elders.
- **Referral & Share Hub**: 1-tap WhatsApp, Telegram, X, Facebook, and Native Device sharing.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Axios, Canvas Confetti.
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy ORM, Pydantic v2, Uvicorn ASGI.
- **Database**: SQLite (local development) / PostgreSQL on Supabase (production).
- **Payments & Telephony**: Paystack Ghana Mobile Money API, Arkesel SMS Gateway.

---

## 💻 Local Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/susurow.git
cd susurow
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in your ARKESEL_API_KEY and PAYSTACK_SECRET_KEY in backend/.env

# Run FastAPI Backend Server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Web App will be live at: `http://localhost:5173`

---

## 🧪 Running Tests

```bash
cd backend
python -m pytest test_auth.py test_backend.py -v
```

---

## 🌐 Production Deployment

- **Database**: Free managed PostgreSQL on [Supabase](https://supabase.com).
- **Backend**: 1-click deploy to [Render.com](https://render.com) using `backend/render.yaml` or `backend/Dockerfile`.
- **Frontend**: 1-click deploy to [Vercel](https://vercel.com) using `frontend/vercel.json`.
- **Android App**: Package `.aab` for Google Play Store using Capacitor.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for full step-by-step instructions.

---

## 📄 License
MIT License. Built for the Ghanaian FinTech Ecosystem.
