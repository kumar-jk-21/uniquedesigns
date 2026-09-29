# Unique Designs – Full-Stack Fashion E-Commerce

React + Vite + Tailwind (client) · Node + Express + Prisma + PostgreSQL (server).

## Setup
1. Create a PostgreSQL database (e.g. `unique_designs`).
2. **Server**
   ```bash
   cd server
   cp .env.example .env      # fill DATABASE_URL, JWT_SECRET (long random string), SUPER_ADMIN_*, SMTP_*
   npm install
   npx prisma migrate dev --name init
   npm run seed              # creates SUPER_ADMIN from .env + starter categories
   npm run dev               # http://localhost:5000
   ```
3. **Client**
   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev               # http://localhost:5173  (proxies /api and /uploads to :5000)
   ```
4. Admin panel: `http://localhost:5173/admin/login` (SUPER_ADMIN credentials from `.env`).

## Notes
- Without SMTP settings, in development the OTP is printed in the server console; in production sending fails cleanly instead.
- Forgot-password returns the same message for unknown emails (prevents account enumeration).
- Districts data: `client/src/data/locations.json` (mirrored in `server/src/data/`). The lists are a practical subset; extend both files together.
- Checkout/payments are not included in the spec and are not implemented.
- Production: set `NODE_ENV=production`, `CLIENT_URL`, and `VITE_API_URL` / `VITE_SERVER_URL`; serve `uploads/` from persistent storage.
