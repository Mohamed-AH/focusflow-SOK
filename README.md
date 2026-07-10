# FocusFlow

**Track habits. Build streaks. Stay focused.**

FocusFlow is a fast, clean habit tracker that works instantly in your browser — no
signup required. Plan your day, check off activities, and watch streaks compound.
Sign in with OAuth to sync progress across devices, and manage habit-builder
customers from the built-in admin dashboard.

## Features

### For individuals
- **One-screen days** — plan activities, check them off, watch the progress ring fill
- **Streak system** — hit your daily goal to extend the streak; track current, best, and perfect days
- **Multiple profiles** — separate routines for student, professional, founder, creative, and parent roles
- **Analytics** — completion trends, category performance, time-of-day heatmaps, streak history
- **Cloud sync with localStorage fallback** — works offline and signed-out; OAuth sign-in (Google/GitHub) syncs progress to MongoDB across devices
- **Desktop-optimized** — full app-shell layout on large screens, responsive down to mobile

### For coaches & teams (admin dashboard at `/admin`)
- **Account management** — list, deactivate/reactivate, and delete accounts
- **Customer onboarding** — pre-provision habit-builder customers by email with localized defaults
- **Localization** — per-deployment locale, currency, timezone, week start, and customizable tracking-metric labels/units
- **Engagement analytics** — daily active users, completion averages, streak leaderboards, top activity categories

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — with no environment
variables the app runs in localStorage-only mode.

To enable OAuth, cloud sync, and the admin dashboard, copy `.env.example` to
`.env.local` and fill in MongoDB Atlas + OAuth credentials. See
**[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full walkthrough.

## Deployment

The repo is pre-configured for **Render's free tier** (see [`render.yaml`](./render.yaml))
with **MongoDB Atlas free tier (M0)** for storage. Full instructions, including OAuth
credential setup: **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## Tech stack

- [Next.js 14](https://nextjs.org/) (pages router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Lucide icons](https://lucide.dev/)
- [NextAuth.js](https://next-auth.js.org/) — Google & GitHub OAuth (both optional)
- [MongoDB](https://www.mongodb.com/) — progress sync, accounts, org settings, analytics events
- [Framer Motion](https://www.framer.com/motion/) + [Recharts](https://recharts.org/)

## Marketing

B2B/B2C positioning and launch copy for Twitter/X and LinkedIn live in
**[MARKETING.md](./MARKETING.md)**.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
