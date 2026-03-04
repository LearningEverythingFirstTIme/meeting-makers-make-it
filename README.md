# Meeting Makers Make It

Production-ready meeting attendance tracker built with **Next.js (App Router) + TypeScript + Tailwind CSS + Firebase Auth + Firestore**.

## Features

- Email/password authentication (Firebase Auth)
- Create, edit, delete personal meetings
  - Meeting fields: name, location, time
- Daily check-ins for meetings
- Duplicate same-day check-in protection
  - UI disable + Firestore transaction guard using deterministic check-in IDs
- Activity dashboard
  - This week check-ins
  - Latest check-ins
  - Per-meeting recent history
- Firestore security rules + indexes included
- Unit test for date/check-in utility logic

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Firebase Web SDK (Auth + Firestore)
- Zod for validation
- Vitest for utility test

## Firestore Data Model

### `meetings` collection

Document fields:
- `userId: string`
- `name: string`
- `location: string`
- `time: string` (`HH:mm`)
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

### `checkins` collection

Document ID: `${userId}_${meetingId}_${dayKey}` (example: `uid123_mid456_2026-03-04`)

Document fields:
- `userId: string`
- `meetingId: string`
- `meetingName: string`
- `dayKey: string` (`YYYY-MM-DD`)
- `createdAt: Timestamp`

This deterministic ID acts as a data-level uniqueness guard for one check-in/day/meeting/user.

## 1) Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a **Web App** to the project.
3. In **Build → Authentication → Sign-in method**, enable:
   - **Email/Password**
4. In **Build → Firestore Database**, create a Firestore database in **Production mode**.
5. In Firestore rules editor, paste contents of `firestore.rules` and publish.
6. In Firestore indexes, create indexes from `firestore.indexes.json` (or deploy via Firebase CLI if you use it).

## 2) Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in values from Firebase project settings.

Required vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 3) Local Development

Install dependencies and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4) Validation / Quality Commands

```bash
npm run test
npm run lint
npm run build
```

## 5) Deploy to Vercel

1. Push project to GitHub.
2. Import repo into Vercel.
3. Set all `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel Project Settings.
4. Deploy.

If you update env vars later, redeploy for changes to take effect.

---

## Manual Steps Required After Clone

- Create/configure Firebase project and web app
- Enable Firebase Email/Password auth
- Create Firestore DB
- Publish `firestore.rules`
- Create required Firestore indexes
- Set local and Vercel environment variables
