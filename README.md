# GharSaathi V2

This project is a staged rebuild using the approved white-and-sage-green household UI.

## Current stage: authentication foundation + UI prototype

Implemented in this stage:
- Login and registration screen; dashboard is gated behind a valid server session.
- Email/password register and login using bcrypt password hashing.
- HTTP-only, SameSite=Lax session cookie with a 7-day signed session.
- Automatic creation of a personal space after registration/login.
- Visible logout button in the profile area; logging out clears the session and returns to login.
- API health endpoint.
- Responsive grocery-list design prototype and local add/search/check interactions.
- Separate database name `gharsaathi_v2` in the environment template.

Not implemented yet:
- Google OAuth callback flow (button is a placeholder until credentials and callback are integrated).
- CSRF hardening beyond SameSite cookie, rate limiting, password reset, email verification, and production deployment hardening.
- Database-backed grocery, pantry, tasks, reminders, notifications, household invitations, Gemini actions, and voice integration.
- Grocery UI currently uses local component state; do not treat it as saved data.

## Setup in Windows PowerShell

1. Extract this ZIP to a new folder and open the folder in VS Code.
2. Open Terminal → New Terminal. PowerShell is fine; do not type `bash`.
3. Run:

   ```powershell
   npm install
   npm run install:all
   ```

4. Copy `server/.env.example` to `server/.env`.
5. Fill in `MONGODB_URI` using your Atlas cluster and the **new** database `gharsaathi_v2`. Do not use the old `gharsaathi` database URI.
6. Generate a secret by running this in PowerShell:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Put the output in `JWT_SECRET` in `server/.env`. Do not share or commit the secret.
7. Start both apps:

   ```powershell
   npm run dev
   ```

8. Open `http://localhost:5173`.

API health check: `http://localhost:4000/api/health`.

## MongoDB Atlas notes
- Ensure Atlas Network Access permits your current IP.
- Ensure the database user has permission to create/read/write in `gharsaathi_v2`.
- URL-encode special characters in the password.
- Never paste credentials or API keys into chat or frontend code.
- The server logs the connected database name; confirm it says `gharsaathi_v2`.

## Next stages
1. Google OAuth and auth hardening (rate limits, CSRF strategy, verification/password recovery).
2. Authorized household membership and invitation lifecycle.
3. Database-backed groceries, categories, shopping mode, and purchase event history.
4. Pantry and tasks, dates/priorities, reliable configurable reminders.
5. Notification centre and activity notifications.
6. Gemini provider adapter, validated AI actions, text/voice input.
7. Automated tests and end-to-end acceptance checks.
