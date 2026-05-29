# Kayaba Recruitment Portal

A modern recruitment portal built with TanStack Start, React, and Supabase.

## Tech Stack

- **Framework**: TanStack Start (React SSR)
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS v4
- **Database**: Supabase
- **Form Handling**: React Hook Form + Zod
- **State Management**: TanStack Query
- **Routing**: TanStack Router
- **Deployment**: Cloudflare Workers

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, bun, or yarn

### Installation

1. Install dependencies:
```bash
npm install
# or
bun install
# or
yarn install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Development

```bash
npm run dev
# or
bun run dev
# or
yarn dev
```

### Build

```bash
npm run build
# or
bun run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
bun run preview
# or
yarn preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── integrations/    # Third-party integrations (Supabase)
├── lib/             # Utility functions
├── routes/          # Route components
├── router.tsx       # Router configuration
├── server.ts        # Server entry point
├── start.ts         # App initialization
└── styles.css       # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Features

- User authentication (login/register)
- Job listings and applications
- Recruitment process tracking
- FAQ section
- About page
- Responsive design
- Server-side rendering

## License

Private - All rights reserved
