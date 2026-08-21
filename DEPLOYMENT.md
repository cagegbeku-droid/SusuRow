# SusuRow - Complete Cloud Hosting & Deployment Guide

This guide walks you through hosting **SusuRow** online for production with high availability, live Ghana Mobile Money transactions (Paystack), instant SMS verification (Arkesel), and publishing to the Google Play Store.

---

## Architecture Overview

```mermaid
graph TD
    A[Saver / Mobile User] -->|HTTPS| B[Vercel Frontend: susurow.com]
    B -->|API Requests| C[Render/Railway Backend: api.susurow.com]
    C -->|PostgreSQL Connection| D[(Supabase Managed DB)]
    C -->|Live Ghana MoMo Charge| E[Paystack Ghana API]
    C -->|Instant SMS OTP| F[Arkesel SMS Gateway]
    E -->|Instant Webhook| C
```

---

## 1. Step 1: Database Setup on Supabase (Free & Managed PostgreSQL)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** and name it `susurow-db`.
3. Choose region closest to West Africa (e.g. `EU - Frankfurt` or `London`).
4. Set a secure database password.
5. In **Project Settings** $\rightarrow$ **Database**, copy your **URI Connection String**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

---

## 2. Step 2: Deploy Backend to Render.com (or Railway.app)

1. Push your code to GitHub (`github.com/your-username/susurow`).
2. Go to [render.com](https://render.com) and create an account.
3. Click **New +** $\rightarrow$ **Web Service** and connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...` | Your Supabase connection string |
   | `JWT_SECRET_KEY` | `susurow_prod_secret_2026_gh` | Secret for user sessions |
   | `PAYSTACK_SECRET_KEY` | `YOUR_PAYSTACK_SECRET_KEY` | Live Paystack API Key |
   | `ARKESEL_API_KEY` | `YOUR_ARKESEL_API_KEY` | Arkesel SMS API Key |
   | `ARKESEL_SENDER_ID` | `SusuRow` | Registered SMS Sender ID |
6. Click **Create Web Service**. Your backend will be live at `https://susurow-backend.onrender.com`.

---

## 3. Step 3: Configure Live Paystack Webhook

1. Log in to your [dashboard.paystack.com](https://dashboard.paystack.com).
2. Go to **Settings** $\rightarrow$ **API Keys & Webhooks**.
3. In **Live Webhook URL**, paste:
   ```
   https://susurow-backend.onrender.com/api/payments/webhook
   ```
4. Click **Save Changes**. Now all Mobile Money customer approvals (MTN MoMo, Telecel Cash, AT Money) will instantly settle within SusuRow.

---

## 4. Step 4: Deploy Frontend to Vercel (Fast & Global CDN)

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project** and select your repository.
3. Set the following:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In `frontend/vercel.json`, update the destination URL with your live Render backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://susurow-backend.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
5. Click **Deploy**. Your web app is now live at `https://susurow.vercel.app` (or your custom domain like `https://susurow.com`).

---

## 5. Step 5: Android APK & Google Play Store Publishing

You can package SusuRow into a native Android app bundle (`.aab` / `.apk`) using **Capacitor**:

```powershell
# 1. Inside frontend folder, install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor
npx cap init "SusuRow" "com.susurow.app" --web-dir dist

# 3. Build production bundle
npm run build

# 4. Add Android platform & sync
npx cap add android
npx cap sync android

# 5. Open in Android Studio
npx cap open android
```

In **Android Studio**:
1. Click **Build** $\rightarrow$ **Generate Signed Bundle / APK**.
2. Select **Android App Bundle (.aab)** for Google Play Store.
3. Create your keystore certificate and generate the `.aab` file.
4. Upload the `.aab` file to your [Google Play Console](https://play.google.com/console) account under **Production Release**.
