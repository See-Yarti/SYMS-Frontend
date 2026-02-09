# YalaRide CRM - Next.js 16

Professional CRM built with Next.js 16, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

\`\`\`bash
npm install
npm run dev     # Development on port 5173
npm run build   # Production build
npm start       # Production server
\`\`\`

## 📁 Professional Structure

\`\`\`
src/
├── api/           # API Layer (organized by domain)
├── app/           # Next.js App Router
├── components/    # React components
├── hooks/         # Custom hooks
├── store/         # Redux state
├── types/         # TypeScript types
└── validations/   # Zod schemas
\`\`\`

## 🔧 Technology Stack

- Next.js 16.1.6 (Turbopack)
- React 19
- TypeScript
- Tailwind CSS + Shadcn/ui
- Redux Toolkit + Redux Persist
- TanStack Query (React Query)
- Zod validation

## 📚 Usage

### API Layer
\`\`\`typescript
import { companiesApi } from '@/api';
const companies = await companiesApi.getCompanies({ page: 1 });
\`\`\`

### Validations
\`\`\`typescript
import { loginSchema } from '@/validations';
\`\`\`

### Hooks
\`\`\`typescript
import { useNavigate, useApiQuery } from '@/hooks';
\`\`\`
