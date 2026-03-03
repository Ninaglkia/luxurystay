# Technology Stack

**Analysis Date:** 2026-03-03

## Languages

**Primary:**
- TypeScript 5.x - All source code, configuration files, and types
- JavaScript/JSX - React components and configuration

**Secondary:**
- CSS/Tailwind - Styling (Tailwind CSS 4)

## Runtime

**Environment:**
- Node.js (version not explicitly specified in package.json, typical Next.js 16 requirement)

**Package Manager:**
- npm (implied by package-lock or package.json)
- Lockfile: Not detected in project root (check node_modules)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router, API routes, middleware
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework via `@tailwindcss/postcss`
- PostCSS 4 - CSS processing (configured in `postcss.config.mjs`)

**Animation:**
- Framer Motion 12.34.3 - Animation and motion library for interactive UI

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.98.0 - PostgreSQL database and auth SDK
- @supabase/ssr 0.8.0 - Server-side rendering utilities for Supabase auth/cookies
- stripe 20.4.0 - Server-side Stripe payment processing
- @stripe/stripe-js 8.8.0 - Client-side Stripe JS library
- @stripe/react-stripe-js 5.6.0 - React wrapper for Stripe.js

**Maps & Location:**
- @vis.gl/react-google-maps 1.7.1 - Google Maps integration for property display and location search

## Configuration

**Environment:**
- NEXT_PUBLIC_SUPABASE_URL - Supabase project URL (public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous/public key
- SUPABASE_SERVICE_ROLE_KEY - Supabase admin key (server-only)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe publishable key for client-side
- STRIPE_SECRET_KEY - Stripe secret key for server-side
- STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY - Google Maps API key (public)
- CRON_SECRET - Authorization token for cron jobs
- NODE_ENV - Set to "development" for local builds, "production" for deployed

**Build:**
- `next.config.ts` - Next.js configuration (minimal, no special overrides)
- `tsconfig.json` - TypeScript compiler options with path alias `@/*` → `./src/*`
- `eslint.config.mjs` - ESLint configuration using ESLint flat config with Next.js presets
- `postcss.config.mjs` - PostCSS configuration for Tailwind
- `.env.local` - Local environment variables (exists but contents not included)

## Development Tools

**Linting & Type Checking:**
- ESLint 9.x - Code linting with Next.js core web vitals and TypeScript rules
- TypeScript 5.x - Static type checking
- eslint-config-next 16.1.6 - Official Next.js ESLint configuration

## Deployment

**Hosting Target:**
- Vercel (indicated by `.vercel/` directory, Next.js 16 default target)
- Supports both development (localhost:3000) and production environments

**Build Process:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Platform Requirements

**Development:**
- Node.js with npm
- Environment variables configured in `.env.local`
- Modern browser with JavaScript enabled

**Production:**
- Vercel platform or any Node.js 18+ host
- HTTPS required for secure Stripe/Supabase connections
- Environment variables configured in deployment platform

---

*Stack analysis: 2026-03-03*
