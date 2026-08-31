# ShilpMitra — Backend Architecture Guide

Ye guide batata hai ki abhi jo frontend (website, karigar dashboard, buyer marketplace) banaya hai, usko **real, working product** banane ke liye backend mein kya banana hoga.

## 1. High-Level Architecture

```
Mobile App / Website (frontend)
        |
        v
   API Gateway (REST/GraphQL)
        |
   -----------------------------
   |        |         |        |
 Auth     Catalog   Orders   AI Services
 Service  Service   Service  (image, price, voice)
   |        |         |        |
   -----------------------------
        |
   Database (Postgres) + File Storage (S3)
        |
   Third-party: Payment Gateway, E-commerce APIs, SMS/WhatsApp
```

## 2. Recommended Tech Stack

| Layer | Suggestion | Kyun |
|---|---|---|
| Backend framework | Node.js (Express/NestJS) ya Python (FastAPI/Django) | Dono mein AI/ML libraries aur third-party API integration aasan hai |
| Database | PostgreSQL | Structured data (users, products, orders) ke liye reliable |
| File storage | AWS S3 / Cloudflare R2 | Product photos, voice notes store karne ke liye |
| Auth | Firebase Auth ya Auth0, phone-number OTP based | Artisans ke liye password yaad rakhna mushkil hota hai — OTP simpler hai |
| AI/ML | Cloud vision API (image tagging) + LLM API (description/translation) + custom price model | Build karne mein time bachega, existing APIs se shuru karo |
| Hosting | AWS / GCP / Render / Railway | Auto-scaling aur managed database options |
| Push notifications | Firebase Cloud Messaging | Order updates artisans ko turant bhejne ke liye |

## 3. Core Database Tables (Simplified Schema)

**users**
- id, name, phone, role (artisan/buyer/admin), language_pref, region, trust_score, created_at

**products**
- id, artisan_id, title, description, category, price, ai_suggested_price, photo_url, status (draft/live/review), verified_badge, created_at

**orders**
- id, buyer_id, product_id, quantity, total_price, status (new/shipped/delivered), payment_status, created_at

**reviews / trust_events**
- id, artisan_id, rating, comment, verified_by (community/admin), created_at

**transactions**
- id, order_id, artisan_payout, commission_amount, payment_gateway_ref, status

## 4. Key API Endpoints (REST example)

```
POST   /api/auth/otp/send
POST   /api/auth/otp/verify

POST   /api/products              -> naya product create karo
POST   /api/products/ai-catalog   -> photo/voice bhejo, AI response mein title/desc/price milega
GET    /api/products?category=&region=&maxPrice=
GET    /api/products/:id

POST   /api/orders
GET    /api/orders?artisan_id= / ?buyer_id=
PATCH  /api/orders/:id/status

GET    /api/artisans/:id/trust-score
POST   /api/artisans/:id/verify
```

## 5. AI Features — Kaise Implement Karein

1. **Smart Cataloging (photo → text)**
   - Photo ko cloud vision API (Google Vision / AWS Rekognition) ko bhejo — labels milenge.
   - Us label ko ek LLM API (jaise Claude API) ko prompt ke saath bhejo: "Is product ke liye Hindi mein title, description aur category banao."
   - Response ko structured JSON mein wapas lo aur database mein save karo.

2. **Voice Input**
   - Speech-to-text API (Google Speech-to-Text supports Indian languages) se voice ko text mein convert karo.
   - Us text ko upar wale LLM step mein bhejo.

3. **AI Fair Price Suggestion**
   - Shuru mein simple rule-based model use karo: category ka average price + material cost input + demand multiplier.
   - Jaise-jaise data badhta hai, isko ek regression/ML model mein upgrade karo jo historical sales data se seekhe.

4. **Regional Language Support**
   - Translation API (Google Translate API / IndicTrans) use karo taaki har user apni bhasha mein interact kar sake.

## 6. Payments & Commission Flow

1. Buyer order place karta hai → payment gateway (Razorpay/PayU/Stripe-India) se payment collect hota hai.
2. System commission (5-10%) kaat kar baaki artisan ke linked bank account/UPI mein transfer karta hai (payout API, jaise Razorpay Route).
3. Transaction record `transactions` table mein save hota hai, taaki dono taraf transparency rahe.

## 7. Security & Compliance Basics

- Sabhi APIs HTTPS par hi chalen.
- Artisan aur buyer ka phone number OTP-verified rakho.
- Payment details kabhi apne database mein raw store mat karo — payment gateway ka tokenized reference use karo.
- Photos/voice files ko access-controlled storage (signed URLs) mein rakho.

## 8. Suggested Build Order (MVP se aage tak)

1. **Phase 1 (MVP):** Auth + product listing (manual entry) + simple product feed — bina AI ke.
2. **Phase 2:** AI cataloging (photo → text) add karo.
3. **Phase 3:** Orders + payments + commission flow.
4. **Phase 4:** Voice input, regional language, trust score system.
5. **Phase 5:** E-commerce platform integrations (Amazon Karigar, Flipkart Samarth APIs).

---

Ye guide ek starting blueprint hai — jab aap actual development shuru karo, to hackathon/competition ke time-frame ke hisaab se Phase 1 aur 2 par focus karna sabse practical rahega.
