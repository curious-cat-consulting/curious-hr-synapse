# Catalyst HR - AI-Powered HR & Employee Admin Assistant

## Overview

Catalyst HR is an AI-powered HR & Employee Admin Assistant designed for small businesses (10-100 employees). Our MVP focuses on an intelligent Expense Reporting and Audit module that streamlines administrative tasks through AI automation.

## Core Features (MVP)

- AI-powered receipt processing and data extraction
- Automated expense categorization
- Anomaly detection for expense auditing
- Real-time expense tracking and reporting
- Manager approval workflows
- Export capabilities for accounting systems

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Supabase
- **AI/ML**: OpenAI GPT-4 for intelligent processing
- **Storage**: Supabase Storage for receipt storage
- **Authentication**: NextAuth.js with Supabase Adapter
- **UI Framework**: Tailwind CSS + Shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase Account
- OpenAI API Key

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-org/catalyst-hr.git
cd catalyst-hr
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

4. Run local database (requires docker)

```bash
npx supabase init
npx supabase start
```

5. Run the development server

```bash
npm run dev
```

## Project Structure

```
catalyst-hr/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Main application pages
│   └── layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # Utility functions
├── supabase/             # Supabase migrations and config
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Development Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Project setup and configuration
- [ ] Authentication system
- [ ] Basic UI components
- [ ] Database schema design

### Phase 2: Core Features (Week 3-4)

- [ ] Receipt upload and processing
- [ ] AI-powered data extraction
- [ ] Expense submission flow
- [ ] Basic expense listing

### Phase 3: Admin Features (Week 5-6)

- [ ] Manager approval workflow
- [ ] Anomaly detection
- [ ] Basic reporting
- [ ] Export functionality

### Phase 4: Polish & Launch (Week 7-8)

- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Testing and bug fixes
- [ ] Documentation
- [ ] Production deployment

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
