# Deploying FocusFlow (Render free tier + MongoDB Atlas free tier)

FocusFlow runs entirely on free infrastructure:

| Piece | Service | Plan | Cost |
| --- | --- | --- | --- |
| Web app (Next.js) | [Render](https://render.com) | Free web service | $0 |
| Database | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | M0 shared cluster | $0 |
| Sign-in | Google / GitHub OAuth | — | $0 |

Every backend feature is optional. With **no environment variables at all**, the app
still works: progress is saved to the browser's localStorage. Adding MongoDB and
OAuth unlocks cloud sync, multi-device progress, and the admin dashboard.

---

## 1. Create the MongoDB Atlas free cluster

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register) and create a project.
2. Click **Build a Database → M0 (Free)**, pick a region close to your Render region, and create the cluster.
3. Under **Database Access**, create a database user with a strong password (role: *Read and write to any database*).
4. Under **Network Access**, click **Add IP Address → Allow access from anywhere** (`0.0.0.0/0`).
   Render's free tier doesn't have static outbound IPs, so this is required.
5. Click **Connect → Drivers** and copy the connection string. It looks like:

   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   This is your `MONGODB_URI`. Collections (`users`, `progress`, `org_settings`, `events`)
   are created automatically on first use — no schema setup needed.

## 2. Create OAuth credentials

You can configure Google, GitHub, or both. Providers with missing credentials are
simply hidden from the sign-in screen.

### Google

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2. **Create credentials → OAuth client ID → Web application**.
3. Authorized redirect URI: `https://<your-app>.onrender.com/api/auth/callback/google`
   (add `http://localhost:3000/api/auth/callback/google` for local dev).
4. Copy the **Client ID** and **Client secret** → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### GitHub

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**.
2. Homepage URL: `https://<your-app>.onrender.com`
3. Authorization callback URL: `https://<your-app>.onrender.com/api/auth/callback/github`
4. Copy the **Client ID** and generate a **Client secret** → `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

## 3. Deploy to Render

### Option A — Blueprint (recommended)

This repo ships with a [`render.yaml`](./render.yaml) blueprint.

1. Push the repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, select the repo, and click **Apply**.
3. Render creates the free web service and generates `NEXTAUTH_SECRET` automatically.
4. Fill in the remaining environment variables (marked `sync: false`) in the service's
   **Environment** tab — see the table below.
5. After the first deploy, set `NEXTAUTH_URL` to the URL Render assigned
   (e.g. `https://focusflow.onrender.com`) and redeploy.

### Option B — Manual web service

1. **New → Web Service**, connect the repo.
2. Runtime: **Node**, Plan: **Free**.
3. Build command: `npm install && npm run build`
4. Start command: `npx next start -p $PORT`
5. Add the environment variables below.

### Environment variables

| Variable | Required for | Value |
| --- | --- | --- |
| `NEXTAUTH_URL` | OAuth | Your Render URL, e.g. `https://focusflow.onrender.com` |
| `NEXTAUTH_SECRET` | OAuth | Any random string (`openssl rand -base64 32`) |
| `MONGODB_URI` | Cloud sync + admin | Atlas connection string from step 1 |
| `MONGODB_DB` | optional | Database name (default `focusflow`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in | From step 2 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub sign-in | From step 2 |
| `ADMIN_EMAILS` | Admin dashboard | Comma-separated emails, e.g. `you@company.com,ops@company.com` |

## 4. Verify the deployment

1. Open your Render URL — the landing page should load.
2. Click **Sign in** and authenticate with Google or GitHub.
3. Create a profile and check an activity — the header badge should read **Synced**.
4. Open a private window, sign in with the same account: your profile should appear
   (cloud restore).
5. Sign in with an email listed in `ADMIN_EMAILS` and visit `/admin` to see accounts,
   onboarding, localization, and analytics.

## Free-tier notes & limits

- **Cold starts:** Render free services spin down after ~15 minutes of inactivity;
  the first request afterwards takes 30–60 s. Progress is never lost — the client
  keeps working from localStorage and re-syncs when the server wakes.
- **Atlas M0:** 512 MB storage — thousands of users' habit data fits comfortably
  (each user's progress document is typically a few KB).
- **No database?** The app degrades gracefully: `/api/progress` returns 503, the
  client shows "Local only", and everything keeps working in the browser.
- **Deactivated accounts** (set in `/admin`) are blocked at sign-in and from syncing.

## Local development

```bash
cp .env.example .env.local   # fill in what you need (or nothing at all)
npm install
npm run dev
```

Open http://localhost:3000. Without env vars you get localStorage-only mode, which
is exactly what the production fallback path uses.
