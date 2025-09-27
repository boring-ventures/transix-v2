# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern Next.js 15 transportation management system built with TypeScript, using Prisma ORM with PostgreSQL/Supabase, TanStack Query for data fetching, and shadcn/ui components. The application manages bus transport operations including fleet management, route planning, scheduling, and ticket booking.

## Development Commands

### Local Development
```bash
# Start development server with Turbopack
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

### Docker Development
```bash
# Start Docker development environment with hot reloading
npm run docker:start

# View Docker logs
npm run docker:logs

# Stop Docker containers
npm run docker:stop

# Clean up Docker volumes and containers
npm run docker:clean

# Open shell in Docker container
npm run docker:shell
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration-name>

# Push schema changes to database (development)
npx prisma db push

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Run database seed
npx prisma db seed
```

### Testing
There are currently no test commands configured. When implementing tests, add commands for:
- Unit tests
- Integration tests
- E2E tests

## Architecture

### Tech Stack
- **Framework**: Next.js 15.1.7 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 6.4.0 with connection pooling
- **State Management**: TanStack Query 5.66.7 for server state, Context API for client state
- **Authentication**: NextAuth.js 4.24.11 with Supabase integration
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17
- **Forms**: React Hook Form 7.54.2 with Zod validation
- **Date Handling**: date-fns 4.1.0

### Project Structure
```
src/
├── app/                   # Next.js App Router pages and API routes
│   ├── api/              # API route handlers
│   ├── (auth)/           # Authentication pages
│   └── (dashboard)/      # Protected dashboard routes
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   └── [feature]/       # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
│   ├── prisma.ts       # Prisma client instance
│   ├── supabase/       # Supabase client configurations
│   └── utils.ts        # Helper functions
├── providers/          # Context providers
├── types/              # TypeScript type definitions
└── middleware.ts       # Next.js middleware for auth
```

### Database Schema Core Entities
- **Company**: Multi-tenant company management
- **Profile**: User profiles with role-based access (superadmin, admin, manager, staff)
- **Bus**: Fleet vehicles with seat configurations and maintenance tracking
- **Route**: Transportation routes with origins, destinations, and stops
- **Schedule**: Trip schedules with assignments and status tracking
- **Ticket**: Booking system with seat assignments and payment tracking
- **Driver**: Personnel management with document tracking
- **Customer**: Passenger profiles and booking history

### API Routes Pattern
All API routes follow RESTful conventions:
- `/api/[entity]` - GET (list), POST (create)
- `/api/[entity]/[id]` - GET (detail), PUT (update), DELETE
- `/api/[entity]/search` - Search endpoints
- `/api/[entity]/[id]/[action]` - Custom actions

### Authentication Flow
- Uses NextAuth.js with Supabase adapter
- Session-based authentication with JWT
- Role-based access control implemented via Profile model
- Protected routes handled by middleware.ts

## Key Implementation Patterns

### Data Fetching
Use TanStack Query for all data fetching operations. Custom hooks should be created in `src/hooks/` for reusable queries and mutations.

### Form Handling
All forms use React Hook Form with Zod schemas for validation. Form schemas should be defined alongside their components.

### Error Handling
API routes should return appropriate HTTP status codes with descriptive error messages. Client-side errors should be handled with toast notifications.

### Type Safety
- Always define TypeScript interfaces for API responses
- Use Prisma-generated types for database entities
- Avoid using `any` type

## Environment Variables
Required environment variables (see .env.example):
- `DATABASE_URL` - PostgreSQL connection string with pooling
- `DIRECT_URL` - Direct database connection for migrations
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL

## Current Development Status
The project has implemented:
- Authentication system with profile management
- Company and branch management
- Basic fleet management structure
- Route and schedule foundations
- Ticket booking system framework

Major features in progress or planned:
- Complete fleet management with seat layout designer
- Advanced scheduling with conflict detection
- Real-time ticket booking with seat selection
- Driver assignment and tracking
- Customer management and communication
- Reports and analytics dashboard