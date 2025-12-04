This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
xaltypasta-rpf-app/
├─ .github/
│  └─ workflows/
│     └─ ci.yml
├─ .vscode/
│  └─ settings.json
├─ .env.example
├─ .gitignore
├─ README.md
├─ eslint.config.mjs
├─ next.config.ts
├─ package.json
├─ postcss.config.mjs
├─ tailwind.config.cjs
├─ tsconfig.json
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  │  └─ (prisma migration folders)
│  └─ seed.ts
├─ scripts/
│  ├─ dev.sh
│  ├─ seed.sh
│  └─ gen-types.sh
├─ public/
│  ├─ favicon.ico
│  └─ robots.txt
├─ app/
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ middleware.ts
│  ├─ auth/
│  │  ├─ signin/
│  │  │  └─ page.tsx
│  │  └─ callback/
│  │     └─ page.tsx
│  ├─ api/
│  │  ├─ auth/
│  │  │  └─ [...nextauth]/
│  │  │     └─ route.ts
│  │  ├─ rfps/
│  │  │  ├─ route.ts                # GET / POST (NL->structured)
│  │  │  └─ [id]/
│  │  │     └─ route.ts             # GET, PUT, DELETE /api/rfps/:id
│  │  ├─ rfps-send/
│  │  │  └─ [id]/
│  │  │     └─ route.ts             # POST /api/rfps/:id/send
│  │  ├─ vendors/
│  │  │  └─ route.ts                # GET,POST,PUT,DELETE /api/vendors
│  │  ├─ proposals/
│  │  │  └─ route.ts
│  │  ├─ upload/
│  │  │  └─ route.ts                # signed upload / proxy to Cloudinary
│  │  └─ email/
│  │     ├─ inbound/
│  │     │  └─ route.ts             # Resend inbound webhook handler
│  │     └─ process/
│  │        └─ route.ts             # trigger parsing job / utilities
│  ├─ dashboard/
│  │  ├─ page.tsx                   # /dashboard - protected
│  │  ├─ rfp/
│  │  │  ├─ page.tsx                # /dashboard/rfp (list)
│  │  │  └─ [id]/
│  │  │     └─ page.tsx             # /dashboard/rfp/:id (details, compare)
│  │  ├─ vendors/
│  │  │  └─ page.tsx
│  │  └─ proposals/
│  │     └─ page.tsx
│  └─ admin/
│     ├─ page.tsx
│     └─ reviews/
│        └─ page.tsx                # needs-review queue
├─ src/
│  ├─ lib/
│  │  ├─ prisma.ts                  # singleton Prisma client
│  │  ├─ auth.ts                    # getServerSession wrapper + role helpers
│  │  ├─ resend.ts                  # Resend wrapper: sendEmail(), verifyWebhook()
│  │  ├─ cloudinary.ts              # upload helpers
│  │  ├─ openai.ts                  # LLM wrapper + rate-limit / retry helpers
│  │  ├─ prompts/
│  │  │  ├─ parse-rfp.prompt.txt
│  │  │  └─ compare-proposals.prompt.txt
│  │  └─ email-templates.ts
│  ├─ services/
│  │  ├─ rfp-service.ts
│  │  ├─ vendor-service.ts
│  │  ├─ proposal-service.ts
│  │  └─ parsing-service.ts         # orchestrates OCR + LLM + validation
│  ├─ validation/
│  │  ├─ rfp.schema.ts              # Zod schema for RFP structured JSON
│  │  └─ proposal.schema.ts         # Zod schema for parsed proposal
│  ├─ jobs/
│  │  ├─ parse-job.ts               # triggered by inbound webhook or scheduled
│  │  └─ retry-queue.ts
│  ├─ workers/
│  │  └─ llm-worker.ts
│  ├─ utils/
│  │  ├─ date.ts
│  │  └─ parser.ts
│  ├─ types/
│  │  └─ index.d.ts
│  └─ hooks/
│     └─ useAuth.ts
├─ components/
│  ├─ ui/
│  │  ├─ Button.tsx
│  │  ├─ Modal.tsx
│  │  ├─ Table.tsx
│  │  └─ Spinner.tsx
│  ├─ rfp/
│  │  ├─ RfpForm.tsx
│  │  ├─ RfpEditor.tsx
│  │  └─ RfpCompareModal.tsx
│  ├─ vendor/
│  │  ├─ VendorForm.tsx
│  │  └─ VendorSelect.tsx
│  ├─ email/
│  │  └─ EmailEditor.tsx
│  └─ layout/
│     ├─ Header.tsx
│     └─ Footer.tsx
├─ styles/
│  ├─ tokens.css
│  └─ components.css
├─ tests/
│  ├─ api/
│  │  ├─ rfps.test.ts
│  │  └─ email-inbound.test.ts
│  └─ integration/
│     └─ e2e.test.ts
└─ docs/
   ├─ demo-playbook.md
   ├─ prompts.md
   └─ architecture.md



Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
