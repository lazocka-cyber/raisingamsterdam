# RaisingAmsterdam

Expat parent community app — Amsterdam.

Built with **React + Vite**, **Supabase**, **React Router** and **Tailwind CSS**.

## Setup

```bash
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_ANON_KEY
npm run dev
```

## Environment variables

Create a `.env` file (gitignored) based on `.env.example`:

```
VITE_SUPABASE_URL=https://biisjnorqwifyrfemjyt.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — preview the production build

## Structure

- `src/lib/supabase.js` — Supabase client initialized from env vars
- `src/App.jsx` — React Router with routes `/`, `/register`, `/listings`
- `src/pages/` — page components

Navy color scheme: `#042C53`.
