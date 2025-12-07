# AI-Powered RFP Management System

An intelligent **Request for Proposal (RFP) management system** that leverages AI to streamline the entire RFP workflow—from creation to vendor selection.

## 🚀 Features

- **AI-Powered RFP Creation**: Convert natural language descriptions into structured RFPs using Groq LLMs
- **Automated Proposal Parsing**: Automatically parse vendor email responses into structured proposals
- **Intelligent Ranking**: AI-powered comparison and ranking of vendor proposals
- **Email Integration**: Seamless inbound/outbound email handling via Resend
- **File Management**: Secure document storage with Cloudinary
- **Google Authentication**: Enterprise-ready auth with NextAuth

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **AI/LLM**: Groq API (Llama models)
- **Email**: Resend (outbound + inbound webhooks)
- **File Storage**: Cloudinary
- **Authentication**: NextAuth with Google OAuth

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js ≥ 18
- PostgreSQL instance (local or hosted)
- Package manager: `pnpm` (recommended), `npm`, or `yarn`

You'll also need accounts for:
- [Groq](https://console.groq.com/) - AI/LLM API
- [Resend](https://resend.com/) - Email service
- [Cloudinary](https://cloudinary.com/) - File storage
- [Google Cloud](https://console.cloud.google.com/) - OAuth credentials

## 🚦 Getting Started

### 1. Clone the Repository

```bash
git clone <REPO_URL> xaltypasta-rfp-app
cd xaltypasta-rfp-app
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the project root:

```env
#######################################
# Core App Config
#######################################
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-hex-32>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

#######################################
# Database (PostgreSQL)
#######################################
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"

#######################################
# NextAuth - Google Provider
#######################################
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

#######################################
# Groq - AI Provider
#######################################
GROQ_API_KEY="gsk_..."

#######################################
# Cloudinary
#######################################
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_UPLOAD_PRESET="rfp_app_unsigned_preset"

#######################################
# Resend (Email)
#######################################
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="rfp-bot@yourdomain.com"
RESEND_INBOUND_SECRET="<some-long-random-secret>"

#######################################
# Optional
#######################################
NODE_ENV="development"
```

**Generate secrets:**
```bash
openssl rand -hex 32  # For NEXTAUTH_SECRET
openssl rand -hex 32  # For RESEND_INBOUND_SECRET
```

### 4. Database Setup

#### Option A: Local PostgreSQL (Docker)

```bash
docker run --name rfp-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=rfp_db \
  -p 5432:5432 \
  -d postgres:16
```

Then set:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rfp_db?schema=public"
```

#### Option B: Hosted Database

Use [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or [Railway](https://railway.app/) and copy the connection string.

#### Run Migrations

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 5. External Services Setup

#### Groq (AI)

1. Visit [console.groq.com](https://console.groq.com/)
2. Create an API key
3. Add to `.env`: `GROQ_API_KEY="gsk_..."`

#### Cloudinary (File Storage)

1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Get credentials from Dashboard
3. Create an upload preset:
   - Go to Settings → Upload → Upload presets
   - Create preset: `rfp_app_unsigned_preset`
   - Set as **Unsigned**
   - Configure folder: `rfp-app/proposals`
4. Add credentials to `.env`

#### Resend (Email)

1. Sign up at [resend.com](https://resend.com/)
2. Generate API key
3. Verify your domain (Settings → Domains)
4. Add to `.env`:
   ```env
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="rfp-bot@yourdomain.com"
   ```

**Inbound Webhook Setup:**
- For local development, use [ngrok](https://ngrok.com/):
  ```bash
  ngrok http 3000
  ```
- In Resend dashboard, add webhook URL:
  ```
  https://<ngrok-id>.ngrok.io/api/inbound/resend
  ```

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Navigate to: APIs & Services → Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Configure:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
6. Add credentials to `.env`

### 6. Run the Application

```bash
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
xaltypasta-rfp-app/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth configuration
│   │   └── inbound/resend/        # Email webhook handler
│   ├── auth/signin/               # Sign-in page
│   └── dashboard/
│       ├── rfps/                  # RFP management
│       ├── vendors/               # Vendor management
│       └── proposals/             # Proposal management
├── prisma/
│   └── schema.prisma              # Database schema
├── src/
│   ├── components/                # React components
│   ├── lib/                       # Utilities (Prisma client)
│   └── services/
│       ├── aiService.ts           # Groq integration
│       ├── emailService.ts        # Resend helpers
│       ├── cloudinaryService.ts   # File upload
│       ├── rfpService.ts          # RFP logic
│       ├── proposalService.ts     # Proposal logic
│       └── proposalRankingService.ts
└── types/                         # TypeScript definitions
```

## 🔄 Typical Workflow

1. **Sign In**: Navigate to `/auth/signin` and authenticate with Google
2. **Add Vendors**: Go to `/dashboard/vendors/new` to add vendor contacts
3. **Create RFP**: 
   - Visit `/dashboard/rfps/new`
   - Enter natural language description
   - AI converts to structured RFP
   - Review and save
4. **Send to Vendors**: Select vendors and send via email
5. **Receive Proposals**: 
   - Vendors reply to the email
   - System auto-parses responses via AI
   - View at `/dashboard/proposals`
6. **AI Ranking**: Compare and rank proposals automatically

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Add environment variables
4. Update production URLs:
   - `NEXTAUTH_URL="https://your-domain.com"`
   - Google OAuth redirect: `https://your-domain.com/api/auth/callback/google`
   - Resend webhook: `https://your-domain.com/api/inbound/resend`

### Other Platforms

Compatible with any Node.js hosting platform (Railway, Render, AWS, etc.)

## 📜 Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Prisma
pnpm prisma migrate dev      # Run migrations (dev)
pnpm prisma migrate deploy   # Deploy migrations (prod)
pnpm prisma generate         # Generate Prisma client
pnpm prisma studio           # Open Prisma Studio
```

## 🔒 Security Notes

- Never commit `.env` file to version control
- Rotate API keys regularly
- Use environment-specific secrets for production
- Validate all inbound webhook requests
- Implement rate limiting for API routes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Groq](https://groq.com/)
- Email by [Resend](https://resend.com/)
- File storage by [Cloudinary](https://cloudinary.com/)