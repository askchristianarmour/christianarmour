<div align="center">

# 🛡️ Christian Armour

**A modern faith-based blogging platform — read, like, and comment with secure authentication.**

<br />

[![Live Demo](https://img.shields.io/badge/Live-christianarmour.vercel.app-0f172a?style=for-the-badge&logo=vercel&logoColor=white)](https://christianarmour.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br />

[View Live Site](https://christianarmour.vercel.app/) · [Report Bug](https://github.com/askchristianarmour/christianarmour/issues) · [Request Feature](https://github.com/askchristianarmour/christianarmour/issues)

</div>

---

## ✨ Features

| | Feature | Description |
|:---:|:---|:---|
| 📖 | **Public blog feed** | Anyone can browse all posts on the home page |
| ❤️ | **Likes** | Signed-in users can like and unlike posts |
| 💬 | **Comments** | Signed-in users can join the conversation |
| 🔐 | **Email & password auth** | Sign up, sign in, and sign out via Supabase |
| 🔗 | **Magic-link reset** | Forgot password flow with email reset link |
| 👁️ | **Password visibility** | Show/hide toggle on every password field |
| 🔒 | **Account lockout** | 5 wrong passwords → 24-hour lock (sign-in sends no email) |
| 🛡️ | **Row Level Security** | Bearer JWT tokens enforced at the database layer |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React + Vite (Frontend)               │
│   Home · Sign In · Sign Up · Forgot / Reset Password    │
└──────────────────────────┬──────────────────────────────┘
                           │  Supabase JS Client (JWT)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase (BaaS)                     │
│   Auth · PostgreSQL · RLS · Edge Functions (optional)   │
└─────────────────────────────────────────────────────────┘
```

**No Express/Node backend** — Supabase handles auth, database, and security to keep costs low.

---

## 🗺️ Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | All blog posts |
| `/signin` | Public | Email & password sign in |
| `/signup` | Public | Create a new account |
| `/forgot-password` | Public | Request a password reset email |
| `/reset-password` | Via email link | Set a new password |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project

### 1. Clone & install

```bash
git clone https://github.com/askchristianarmour/christianarmour.git
cd christianarmour
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Copy from `.env.example` as a starting point. Never commit `.env` to git.

### 3. Set up the database

In the Supabase **SQL Editor**, run the migration:

```
supabase/migrations/001_blog_auth.sql
```

This creates `posts`, `likes`, `comments`, login lockout tables, and RLS policies.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Supabase Configuration

### Authentication

| Setting | Value |
|---------|-------|
| **Email provider** | Enabled |
| **Confirm email** | **Disabled** (recommended — avoids signup rate limits; users sign in immediately) |
| **Site URL** | `https://christianarmour.vercel.app` |
| **Redirect URLs** | `https://christianarmour.vercel.app/reset-password` |
| | `http://localhost:5173/reset-password` |

### Password reset email

Use the default **Reset Password** template with `{{ .ConfirmationURL }}` so users receive a magic link to `/reset-password`.

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment (Vercel)

The app is deployed at **[christianarmour.vercel.app](https://christianarmour.vercel.app/)**.

1. Push to `main` on GitHub (Vercel auto-deploys)
2. Add environment variables in **Vercel → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy after adding env vars

`vercel.json` is included for React Router SPA routing.

---

## 📁 Project Structure

```
christianarmour/
├── src/
│   ├── components/       # UI components (PostCard, Layout, modals)
│   ├── contexts/       # Auth provider & context
│   ├── hooks/          # useAuth, usePosts
│   ├── lib/            # Supabase client, auth, password reset
│   ├── pages/          # Route pages
│   └── types/          # TypeScript types
├── supabase/
│   ├── migrations/     # Database schema & RLS
│   └── functions/      # Edge Functions (optional secure sign-in)
├── vercel.json         # SPA rewrites for production
└── .env.example        # Environment variable template
```

---

## 🔐 Security

- **JWT bearer tokens** — automatically attached to every Supabase API request
- **Row Level Security** — likes and comments require `auth.uid()`
- **Login lockout** — 5 wrong passwords lock the account for 24 hours (not triggered on sign-up or rate-limit errors)
- **No secrets in frontend** — only the Supabase anon key is exposed (safe with RLS)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Backend | Supabase (Auth + PostgreSQL) |
| Hosting | Vercel |

---

<div align="center">

<br />

**Christian Armour** — standing firm in faith, together.

<br />

Made with ❤️ by [askchristianarmour](https://github.com/askchristianarmour)

</div>
