# ShilpMitra — Poora Connected Business Product (Ab PWA Bhi Hai)

Teeno pieces connected hain: marketing website, artisan dashboard,
buyer marketplace — sab ek hi real backend se baat karte hain, aur ab
poora site ek **installable app (PWA)** bhi hai.

## Naya: Ab Ye Ek Installable App Hai

- Phone par website khologe to Chrome apne aap "App Install Karein" ka option dega (ya nav mein button dikhega)
- Install karne par apna icon home screen par aa jaata hai, poora full-screen app jaisa khulta hai (browser bar nahi dikhta)
- Offline bhi kaam karta hai (basic pages cache ho jaate hain — API data ke liye internet chahiye hoga)
- iPhone par: Safari mein "Share" button → "Add to Home Screen"

**Zaroori:** Ye tabhi kaam karega jab site **HTTPS** par live ho (GitHub Pages automatically HTTPS deta hai, toh tumhare case mein ye theek rahega). `file://` se kholne par ya sirf HTTP par install option nahi aayega.

## Kaise Chalayein (Local Test)

```
cd backend
npm install
cp .env.example .env
npm start
```

Frontend ko static server se kholna better hai:
```
cd frontend
npx serve .
```

## Files (Naye PWA files highlight kiye hain)

```
ShilpMitra-Final/
├── frontend/
│   ├── index.html
│   ├── karigar-dashboard.html
│   ├── buyer-marketplace.html
│   ├── manifest.json          <- NEW: PWA config
│   ├── sw.js                  <- NEW: service worker (offline caching)
│   ├── icon-192.png           <- NEW: app icon
│   ├── icon-512.png           <- NEW: app icon
│   ├── icon-512-maskable.png  <- NEW: Android adaptive icon
│   └── apple-touch-icon.png   <- NEW: iOS home screen icon
├── backend/
│   ├── server.js, db.js, routes/, services/
│   ├── README.md
│   ├── HOSTING-GUIDE.md
│   └── .env.example
└── ShilpMitra-Backend-Guide.md
```

## Business Ke Roop Mein Ye Ab Kya Kar Sakta Hai

| Cheez | Status |
|---|---|
| Artisan signup/login | ✅ Real (OTP+JWT), persist hota hai |
| Product catalog | ✅ Real database mein save/fetch hota hai |
| AI se catalog banana | ✅ Real (apni Anthropic key ke saath) |
| Buyer product browsing | ✅ Real backend se |
| Orders + commission | ✅ Real calculation (8%) |
| Payments | ✅ Real Razorpay integration |
| Installable app | ✅ PWA — home screen icon, offline shell |
| SMS delivery | ❌ Abhi console mein print hota hai |
| Live hosting | Deploy in progress — GitHub Pages (frontend) + Render (backend) |
