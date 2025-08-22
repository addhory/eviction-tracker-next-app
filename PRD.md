# Eviction Tracker

<div align="center">

**A comprehensive Maryland eviction management system for landlords, administrators, and contractors**

_Streamlining the legal eviction process from property management to document generation and case tracking_

</div>

## 🎯 Overview

Eviction Tracker is a multi-tenant SaaS platform designed specifically for the Maryland rental market. It provides a complete workflow management system for handling eviction cases, from initial property and tenant setup through legal document generation and case resolution.

### Key Features

- 🏠 **Property & Tenant Management** - Track properties across all 24 Maryland counties
- ⚖️ **Legal Case Management** - Handle "Failure to Pay Rent" (FTPR) eviction cases
- 📄 **Document Generation** - Create Maryland-compliant legal documents and forms
- 💳 **Payment Processing** - Integrated Stripe payments with county-specific pricing
- 👥 **Multi-Role System** - Support for landlords, administrators, and contractors
- 📊 **Admin Dashboard** - Comprehensive oversight and reporting tools

## 🏗️ Architecture

### Technology Stack

- **Styling**: Tailwind CSS v4 and shadCN UI.
- **Forms**: React Hook Form + Zod validation.
- **state management**: zustand.
- **Backend**: Supabase (PostgreSQL) with prisma.
- **Authentication**: Supabase Auth with custom user management or next auth.
- **Payments**: Stripe integration
- **PDF Generation**: jsPDF for legal documents.
- date formatter: dayjs.

### Project Structure

create a proper structure to prevent reusable code accross app (DRY Code). that might look like this.

eviction-tracker/
├── components/ # Reusable UI components
│ ├── forms/ # Form components and modals
│ └── ui/ # Base UI components
├── pages/ # Route-based page components
│ ├── admin/ # Administrator pages
│ └── contractor/ # Contractor pages
├── layouts/ # Role-specific layout wrappers
├── services/ # Business logic and API integrations
├── hooks/ # Custom React hooks
├── config/ # Configuration files
├── lib/ # Utility libraries and validations
└── types.ts # TypeScript type definitions

create the app use context7 to enrich the documentations and shadCN UI.

## ENV Supabase that i have created.

NEXT_PUBLIC_SUPABASE_URL=https://eezhqipjobxkhsbrbvex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlemhxaXBqb2J4a2hzYnJidmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3Mzk3OTMsImV4cCI6MjA3MTMxNTc5M30.bhj4GjbUaasWxv5-oEhJoRZYI3bP65Avvmb_FWrtvww

NEXT_PUBLIC_SUPABASE_PASSWORD=DRaFT1NvZWeCGlJs
