# Eviction Tracker

A comprehensive Maryland eviction management system for landlords, administrators, and contractors.

## 🎯 Overview

Eviction Tracker is a multi-tenant SaaS platform designed specifically for the Maryland rental market. It provides a complete workflow management system for handling eviction cases, from initial property and tenant setup through legal document generation and case resolution.

## ✨ Features

- 🏠 **Property & Tenant Management** - Track properties across all 24 Maryland counties
- ⚖️ **Legal Case Management** - Handle "Failure to Pay Rent" (FTPR) eviction cases
- 📄 **Document Generation** - Create Maryland-compliant legal documents and forms
- 💳 **Payment Processing** - Integrated Stripe payments with county-specific pricing
- 👥 **Multi-Role System** - Support for landlords, administrators, and contractors
- 📊 **Admin Dashboard** - Comprehensive oversight and reporting tools

## 🏗️ Technology Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS v4 and shadCN UI
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Payments**: Stripe integration
- **PDF Generation**: jsPDF for legal documents
- **Date Formatting**: Day.js

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (optional, for payments)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Configuration (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies are already included in the schema

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
eviction-tracker/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── dashboard/          # Protected dashboard pages
│   │   ├── admin/              # Admin-only pages
│   │   ├── login/              # Authentication pages
│   │   └── signup/
│   ├── components/             # Reusable UI components
│   │   ├── forms/              # Form components
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # Base UI components (shadCN)
│   ├── layouts/                # Layout components
│   ├── services/               # Business logic and API calls
│   ├── stores/                 # Zustand state management
│   ├── hooks/                  # Custom React hooks
│   ├── config/                 # Configuration files
│   ├── lib/                    # Utility libraries
│   └── types/                  # TypeScript type definitions
├── middleware.ts               # Next.js middleware for auth
└── supabase-schema.sql         # Database schema
```

## 👥 User Roles

### Landlord

- Manage properties and tenants
- Create and track eviction cases
- Generate legal documents
- Process payments

### Contractor

- View assigned cases
- Update case status
- Generate documents
- Limited property access

### Admin

- Full system access
- User management
- System reporting
- Override capabilities

## 🔐 Authentication & Security

- **Supabase Auth** with email/password authentication
- **Row Level Security (RLS)** ensures data isolation between users
- **Role-based access control** with middleware protection
- **Secure API routes** with proper authentication checks

## 💰 Payment Integration

- **County-specific pricing** for eviction cases
- **Stripe integration** for secure payment processing
- **Automatic pricing calculation** based on property county
- **Payment tracking** and receipt generation

## 📄 Document Generation

- **Maryland-compliant forms** for eviction notices
- **PDF generation** with jsPDF
- **Template system** for legal documents
- **Digital signatures** support (planned)

## 🗃️ Database Schema

### Core Tables

- **profiles** - User profiles with role-based access
- **properties** - Rental property information
- **tenants** - Tenant details and lease information
- **legal_cases** - Eviction case management
- **law_firms** - Law firm directory

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Property Management

- `GET /api/properties` - List user's properties
- `POST /api/properties` - Create new property
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property

### Tenant Management

- `GET /api/tenants` - List user's tenants
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/[id]` - Update tenant
- `DELETE /api/tenants/[id]` - Delete tenant

### Legal Cases

- `GET /api/cases` - List user's cases
- `POST /api/cases` - Create new case
- `PUT /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@evictiontracker.com
- 📚 Documentation: [Coming Soon]
- 🐛 Issues: GitHub Issues

## 🗺️ Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced reporting and analytics
- [ ] Integration with court systems
- [ ] Automated document delivery
- [ ] Multi-language support
- [ ] API rate limiting and throttling
- [ ] Advanced user permissions
- [ ] Bulk operations for properties/tenants
