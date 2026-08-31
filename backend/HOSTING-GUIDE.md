# ShilpMitra — Apne Domain Par Deploy Karne Ki Guide

Ye guide batati hai ki `shilpmitra.com` (ya jo bhi tumhara domain hai) par ye poora project kaise live karein.

## Overview — Do Cheezein Deploy Karni Hongi

1. **Backend** (Node.js server) — ek server chahiye jo 24x7 chale
2. **Frontend** (HTML files) — ye kahin bhi static hosting par chal sakta hai

## Option A — Sabse Aasan (Recommended for shuru mein)

**Backend:** [Render.com](https://render.com) ya [Railway.app](https://railway.app) — dono free tier dete hain
1. Apna `backend/` folder GitHub par push karo
2. Render/Railway par "New Web Service" banao, apna GitHub repo connect karo
3. Environment variables wahan set karo (Settings → Environment):
   - `JWT_SECRET`
   - `ANTHROPIC_API_KEY` (agar AI cataloging chahiye)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - `ALLOWED_ORIGIN=https://tumhara-domain.com`
4. Deploy hone ke baad tumhe ek URL milega jaisे `https://shilpmitra-backend.onrender.com`

**Frontend:** Apne domain registrar/hosting (jaise Hostinger, GoDaddy, Namecheap) ke **file manager** ya **FTP** se `frontend/` folder ke andar ki files apload karo apne domain ke root mein (jahan `public_html` ya `www` folder hota hai).

**Zaroori:** `buyer-marketplace.html` mein `API_BASE` variable ko update karo:
```js
var API_BASE = 'https://shilpmitra-backend.onrender.com/api'; // Render/Railway wala URL
```

## Option B — Poora Ek Hi VPS Par (agar tumhare paas apna server/VPS hai)

1. VPS par Node.js install karo (v22+)
2. `backend/` folder VPS par upload karo, `.env` file banao
3. `pm2` se server ko background mein chalao taaki crash hone par bhi restart ho:
   ```
   npm install -g pm2
   pm2 start server.js --name shilpmitra
   ```
4. **Nginx** install karo aur reverse proxy set karo — Nginx frontend files serve karega aur `/api` requests ko Node server (port 4000) tak forward karega
5. **HTTPS zaroori hai** (Razorpay ko chahiye) — free SSL certificate ke liye `certbot` use karo:
   ```
   sudo certbot --nginx -d tumhara-domain.com
   ```

## Razorpay Ke Liye Zaroori Steps

1. [dashboard.razorpay.com](https://dashboard.razorpay.com) par account banao
2. **Test Mode** mein turant keys milengi (koi KYC nahi chahiye) — pehle isi se test karo
3. Jab real paisa lena ho, **Live Mode** activate karne ke liye business KYC documents submit karne honge (PAN, bank account, business proof)
4. Live keys milne ke baad `.env` mein `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` ko live keys se replace kar dena
5. **Zaroori:** Razorpay Live Mode sirf HTTPS domains par kaam karta hai — isliye SSL certificate lagana na bhoolna

## CORS Checklist

Backend ke `.env` mein:
```
ALLOWED_ORIGIN=https://tumhara-domain.com
```
Agar ye set nahi kiya to koi bhi website tumhare backend ko call kar sakti hai — production mein isko zaroor set karna.

## Deploy Se Pehle Ka Checklist

- [ ] `.env` file mein saare secrets bhare hain (JWT_SECRET, Razorpay keys)
- [ ] `ALLOWED_ORIGIN` apne real domain par set hai
- [ ] `buyer-marketplace.html` mein `API_BASE` deployed backend URL par point kar raha hai
- [ ] Razorpay Test Mode mein pehle poora flow check kiya (fake card number: `4111 1111 1111 1111`)
- [ ] HTTPS/SSL lag chuka hai
- [ ] `.env` file GitHub par push nahi hui (`.gitignore` mein already hai)

## Test Card (Razorpay Test Mode)

Jab test mode mein checkout test karo, ye card details use karo:
- Card Number: `4111 1111 1111 1111`
- Expiry: koi bhi future date
- CVV: `123`
- OTP: `1234` (agar poocha jaaye)

Ye asli paisa nahi katega — sirf flow test karne ke liye hai.
