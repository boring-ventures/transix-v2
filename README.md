# Modern Next.js Template

A modern, full-stack Next.js template with Prisma, Supabase, React Query, and more. Built with TypeScript and featuring a complete development setup.

## 🚀 Features

- ⚡️ Next.js 15 with App Router
- 🔋 Prisma ORM with PostgreSQL
- 🔑 Authentication with NextAuth.js
- 🎨 Tailwind CSS for styling
- 📊 React Query for data fetching
- 🏢 Type-safe database queries
- 🔄 React Hook Form with Zod validation
- 📅 Date handling with date-fns
- 🎭 Dark mode support with next-themes
- 📊 Recharts for data visualization
- 🛠 Complete TypeScript support

## 📦 Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)
- pnpm (recommended) or npm

## 🛠 Setup

1. Clone the repository:

```bash
git clone [your-repo-url]
cd [your-project-name]
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up your environment variables:

```bash
cp .env.example .env
```

4. Configure your `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth.js
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

5. Initialize Prisma:

```bash
pnpm prisma generate
pnpm prisma db push
```

## 🚀 Development

Start the development server:

```bash
pnpm dev
```

Your app will be available at `http://localhost:3000`

## 📝 Database Management

### Initialize Prisma

```bash
pnpm prisma init
```

### Create a migration

```bash
pnpm prisma migrate dev --name init
```

### Reset database

```bash
pnpm prisma migrate reset
```

### Open Prisma Studio

```bash
pnpm prisma studio
```

## 🏗 Project Structure

```
├── app/                   # Next.js App Router
│   ├── api/              # API routes
│   ├── (auth)/          # Authentication routes
│   └── (dashboard)/     # Protected dashboard routes
├── components/           # React components
├── lib/                  # Utility functions
├── prisma/              # Prisma schema and migrations
└── public/              # Static assets
```

## 🧪 Testing

```bash
pnpm test        # Run tests
pnpm test:watch  # Run tests in watch mode
```

## 🚀 Deployment

1. Build the application:

```bash
pnpm build
```

2. Start the production server:

```bash
pnpm start
```

### Deploying to Railway

1. Push your code to GitHub.

2. Connect your GitHub repository to Railway:

   - Create a new project in Railway
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. Configure environment variables in Railway:

   - Go to your project's "Variables" tab
   - Add all required environment variables from `.env.example`
   - For Supabase, make sure to add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
   - For database, set the Supabase connection strings:
     - `DATABASE_URL` (Supabase connection pooling URL)
     - `DIRECT_URL` (Direct Supabase connection URL)

4. Deploy your application:

   - Railway will automatically build and deploy your application
   - Environment variables will be available during both build and runtime

5. Custom domain (optional):
   - Go to the "Settings" tab
   - Click "Generate Domain" or "Custom Domain"
   - Follow the instructions to set up DNS

Note: This application uses Supabase for the database and storage, not a local database container.

## 📚 Key Dependencies

- Next.js 15.1.7
- React 19.0.0
- Prisma 6.4.0
- TanStack Query 5.66.7
- NextAuth.js 4.24.11
- React Hook Form 7.54.2
- Zod 3.24.2
- Tailwind CSS 3.4.17

## 🔧 Common Issues & Solutions

### Prisma Client Issues

If you encounter Prisma Client issues, try:

```bash
pnpm prisma generate
```

### Database Connection Issues

- Verify your DATABASE_URL in .env
- Ensure PostgreSQL is running
- Check network access and firewall settings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.com/)
- [TanStack Query](https://tanstack.com/query)

## Credentials

### Supabase

- Project name: POSITIVE-Next-Template
- DB Password: e9zKY_Km5HbkiiF
- Anon Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Zmd2ZmhwbWljd3B0dXBqeWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNjY4NDksImV4cCI6MjA1NTY0Mjg0OX0.OiccFqJXdAM6tPIvULA3EaZxtCOsuwhiMugjyGzXNFk
- Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Zmd2ZmhwbWljd3B0dXBqeWtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDA2Njg0OSwiZXhwIjoyMDU1NjQyODQ5fQ.jOx413xoAvBdez9ofCGU8DEIunRI2SU9SXWJsm_IY2Q
- Project URL: https://swfgvfhpmicwptupjyko.supabase.co

- PRISMA URLs:

  # Connect to Supabase via connection pooling with Supavisor.

  DATABASE_URL="postgresql://postgres.swfgvfhpmicwptupjyko:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

  # Direct connection to the database. Used for migrations.

  DIRECT_URL="postgresql://postgres.swfgvfhpmicwptupjyko:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

## 🏗 Architecture & Implementation Plan

### Core Modules To Implement

#### 1. Authentication & Authorization [TODO]

- [ ] User management system
- [ ] Role-based access control (Admin, Company Manager, Staff)
- [ ] Session management

#### 2. Company Management [TODO]

- [ ] Company profile CRUD operations
- [ ] Company settings management
- [ ] Multi-tenant architecture implementation
- [ ] Company branding customization

#### 3. Fleet Management [TODO]

- [ ] Bus registration system
- [ ] Bus template configuration
  - [ ] Seat layout designer
  - [ ] Bus type management
- [ ] Bus availability tracking
- [ ] Bus assignment system
- [ ] Maintenance scheduling

#### 4. Route Management [TODO]

- [ ] Route CRUD operations
- [ ] Location management
- [ ] Schedule template system
- [ ] Operating days configuration
- [ ] Route optimization tools

#### 5. Schedule Management [TODO]

- [ ] Schedule generation system
- [ ] Real-time schedule updates
- [ ] Schedule status tracking
- [ ] Driver assignment system
- [ ] Conflict detection

#### 6. Ticket Management [TODO]

- [ ] Ticket booking system
- [ ] Seat selection interface
- [ ] Dynamic pricing management
- [ ] Ticket status tracking
- [ ] Cancellation handling

#### 7. Personnel Management [TODO]

- [ ] Driver profile management
- [ ] Driver scheduling system
- [ ] Document management
  - [ ] License tracking
  - [ ] Certification management
- [ ] Performance monitoring

#### 8. Customer Management [TODO]

- [ ] Customer profile system
- [ ] Booking history tracking
- [ ] Passenger manifest generation
- [ ] Customer communication system

### API Endpoints To Implement

#### Fleet Management API

- [ ] `/api/buses`
  - [ ] GET, POST, PUT, DELETE operations
  - [ ] Availability checking
  - [ ] Assignment management
- [ ] `/api/bus-templates`
- [ ] `/api/bus-seats`
- [ ] `/api/bus-assignments`

#### Route Management API

- [ ] `/api/routes`
- [ ] `/api/locations`
- [ ] `/api/route-schedules`

#### Schedule Management API

- [ ] `/api/schedules`
- [ ] `/api/assignments`

#### Ticket Management API

- [ ] `/api/tickets`
- [ ] `/api/seat-tiers`
- [ ] `/api/bookings`

### Database Schema To Implement

#### Core Entities

- [ ] Company
  - [ ] Basic information
  - [ ] Operating parameters
  - [ ] Business rules
- [ ] Bus
  - [ ] Vehicle information
  - [ ] Seat configuration
  - [ ] Maintenance records
- [ ] Route
  - [ ] Origin/destination
  - [ ] Stops
  - [ ] Schedule templates
- [ ] Schedule
  - [ ] Timing information
  - [ ] Assignments
  - [ ] Status tracking
- [ ] Ticket
  - [ ] Passenger details
  - [ ] Seat assignments
  - [ ] Payment tracking

### Frontend Components To Implement

#### Dashboard Views

- [ ] Company Dashboard
- [ ] Fleet Management Interface
- [ ] Route Planning Tools
- [ ] Scheduling Interface
- [ ] Booking Management
- [ ] Reports and Analytics

#### Customer-Facing Views

- [ ] Route Search
- [ ] Booking Interface
- [ ] Seat Selection
- [ ] Payment Processing
- [ ] Ticket Management

### Security Features To Implement

- [ ] JWT Authentication
- [ ] Role-Based Access Control
- [ ] Row-Level Security Policies
- [ ] API Rate Limiting
- [ ] Input Validation
- [ ] XSS Protection
- [ ] CSRF Protection

### Testing Strategy To Implement

- [ ] Unit Tests
  - [ ] Business Logic
  - [ ] Utility Functions
- [ ] Integration Tests
  - [ ] API Endpoints
  - [ ] Database Operations
- [ ] E2E Tests
  - [ ] Critical User Flows
  - [ ] Payment Processing
  - [ ] Booking Flow
