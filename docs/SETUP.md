# Database Setup Guide

## 🎯 Overview

Complete setup guide for the YouTube Community Portal database foundation, including Supabase configuration, Drizzle ORM integration, and Stripe payment system setup.

## ✅ Prerequisites

- **Node.js** (v18 or higher)
- **Bun** package manager
- **Supabase** account and project
- **Stripe** account (for payments)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

### 3. Configure Environment Variables
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://postgres.your-ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase Project ID
SUPABASE_PROJECT_ID=your-project-id
```

### 4. Apply Database Schema
```bash
bun run db:migrate
```

### 5. Start Development
```bash
bun run dev
```

---

## 🗄️ Database Schema

### Overview
The database consists of **18 tables** organized into 6 main categories:

#### Authentication & Users (2 tables)
- `users` - Extended profiles with Supabase Auth integration
- `user_activity` - Engagement tracking and analytics

#### Content Management (8 tables)
- `videos` - YouTube catalog with playlist support
- `video_playlists` - YouTube-like playlist organization
- `playlist_videos` - Many-to-many relationship with ordering
- `video_categories` - Topic-based video organization
- `blog_posts` - Technical articles with access control
- `blog_categories` - Blog content organization
- `snippets` - Code snippets with categorization
- `snippet_categories` - Technology-based snippet organization

#### Community Features (3 tables)
- `forum_categories` - Discussion organization with access control
- `forum_posts` - Thread management with moderation features
- `forum_replies` - Nested replies with best answer marking

#### Monetization (3 tables)
- `subscription_plans` - Configurable pricing tiers
- `subscriptions` - Stripe integration for recurring payments
- `payments` - One-time payment tracking

#### Additional Features (2 tables)
- `newsletter_subscriptions` - Email marketing integration
- `lab_tools` - Interactive utilities with access control

### Key Relationships
- **Users** ↔ All content (author relationships)
- **Videos** ↔ Playlists (many-to-many)
- **Forum Posts** ↔ Replies (threading)
- **Users** ↔ Subscriptions (payment relationships)

---

## 🔐 Authentication Integration

### Supabase Auth Setup

#### Features Implemented
- **Email/Password** authentication
- **OAuth providers** (Google, GitHub) ready
- **JWT tokens** for API authentication
- **Session management** with automatic refresh
- **User profile linking** via `supabase_user_id`

#### Files Created
```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
```

#### Auth Helper Functions
```typescript
// Available in src/lib/supabase.ts
auth.signUp(email, password, metadata)
auth.signIn(email, password)
auth.signInWithOAuth(provider)
auth.signOut()
auth.getCurrentUser()
auth.getCurrentSession()
```

---

## 💳 Payment System

### Stripe Integration

#### Features Implemented
- **Subscription management** - Create, update, cancel subscriptions
- **Payment intents** - One-time payment processing
- **Checkout sessions** - Seamless payment flow
- **Webhook handling** - Payment event processing
- **Customer management** - Stripe customer integration

#### Files Created
```typescript
// src/lib/stripe.ts
export const stripe = new Stripe(stripeSecretKey);

// Available helpers
subscriptions.create(customerId, priceId)
payments.create(amount, currency)
checkout.createSubscriptionSession(priceId)
customers.create(email, name)
```

#### Payment Types Supported
- **Subscriptions** - Monthly/yearly recurring payments
- **One-time payments** - Lifetime access, special content
- **Payment methods** - Credit cards, digital wallets
- **Webhooks** - Payment event handling

---

## 🛠️ Development Tools

### Drizzle ORM Setup

#### Database Connection
```typescript
// src/db/index.ts
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle({ client, schema });
```

#### Schema Definition
```typescript
// src/db/schema.ts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  supabaseUserId: uuid('supabase_user_id').unique(),
  // ... other fields
});
```

### Migration System

#### Available Commands
```bash
bun run db:generate    # Generate migrations from schema
bun run db:migrate     # Apply migrations to database
bun run db:types       # Generate TypeScript types
bun run db:reset       # Reset local database
```

#### Migration Files
- **Location**: `drizzle/0000_nice_komodo.sql`
- **Status**: Applied successfully
- **Tables**: 18 tables created

---

## 📁 File Structure

```
src/
├── db/
│   ├── schema.ts              # Complete database schema (18 tables)
│   └── index.ts               # Database connection utilities
├── lib/
│   ├── supabase.ts            # Supabase client and auth helpers
│   ├── stripe.ts              # Stripe payment integration
│   └── database.types.ts      # Generated TypeScript types
└── ...

drizzle/
├── 0000_nice_komodo.sql       # Database migration file
└── meta/                      # Migration metadata

scripts/
└── generate-types.sh          # Secure type generation script
```

---

## 🔧 Environment Variables

### Required Variables
```env
# Supabase (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string

# Stripe (Required for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Optional
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
NODE_ENV=development
```

### Getting Credentials

#### Supabase
1. **Project URL**: Dashboard → Settings → API → Project URL
2. **Anon Key**: Dashboard → Settings → API → anon/public key
3. **Database URL**: Dashboard → Settings → Database → Connection String
4. **Project ID**: Dashboard → Settings → General → Project ID

#### Stripe
1. **Secret Key**: Developers → API Keys → Secret key
2. **Publishable Key**: Developers → API Keys → Publishable key
3. **Webhook Secret**: Developers → Webhooks → Endpoint secret

---

## 🧪 Testing the Setup

### Database Connection Test
```bash
# Test database connection
node -e "
import { testConnection } from './src/db/index.js';
testConnection();
"
```

### Supabase Connection Test
```bash
# Test Supabase client
node -e "
import { supabase } from './src/lib/supabase.js';
supabase.from('users').select('*').then(console.log);
"
```

### Stripe Connection Test
```bash
# Test Stripe client
node -e "
import { stripe } from './src/lib/stripe.js';
stripe.accounts.retrieve().then(console.log);
"
```

---

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
- **Check**: DATABASE_URL format and credentials
- **Solution**: Verify connection string and network access

#### Supabase Auth Errors
- **Check**: SUPABASE_URL and SUPABASE_ANON_KEY
- **Solution**: Ensure keys are correct and project is active

#### Stripe Integration Issues
- **Check**: STRIPE_SECRET_KEY and webhook configuration
- **Solution**: Verify API keys and webhook endpoint setup

#### Migration Errors
- **Check**: Database permissions and connection
- **Solution**: Ensure database user has CREATE TABLE permissions

### Debug Commands
```bash
# Check environment variables
env | grep SUPABASE
env | grep STRIPE

# Test database connection
bun run db:migrate --dry-run

# Check migration status
ls -la drizzle/
```

---

## 📊 Next Steps

### After Database Setup
1. **Start development server**: `bun run dev`
2. **Test authentication flows**
3. **Implement user interfaces**
4. **Set up payment processing**
5. **Build application features**

### Phase 2: Authentication System
- User registration/login pages
- OAuth provider integration
- Profile management interface
- Protected routes middleware

### Phase 3: Content Management
- Video catalog display
- Blog system implementation
- Code snippets library
- Search functionality

---

## 📞 Support

### Documentation
- **[Project Progress](./PROGRESS.md)** - Current development status
- **[Phase Documentation](./phase-*/README.md)** - Phase-specific guides

### External Resources
- **[Supabase Docs](https://supabase.com/docs)** - Database and auth
- **[Drizzle Docs](https://orm.drizzle.team)** - ORM documentation
- **[Stripe Docs](https://stripe.com/docs)** - Payment processing
- **[Astro Docs](https://docs.astro.build)** - Framework documentation

---

## 🎉 Setup Complete!

Your database foundation is now fully configured with:
- ✅ **18 database tables** with relationships and indexes
- ✅ **Supabase Auth** integration ready
- ✅ **Stripe payments** configured
- ✅ **Development tools** set up
- ✅ **TypeScript types** generated

**Ready to start building your YouTube community portal!** 🚀
