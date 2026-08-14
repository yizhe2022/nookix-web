# Nookix Web

An open-source web application for reading book summaries and listening to published audio content. Nookix combines a browsable library, an accessible player, and personal progress tracking into a focused learning experience.

## Highlights

- **Book summaries and chapter-based content**: Browse content by book, chapter, category, search result, and curated collection.
- **Immersive audio experience**: Play published segmented audio, resume listening, and track reading history.
- **Protected audio delivery**: Control access to published audio resources with Cloudflare R2 and presigned URLs.
- **Accounts and personal libraries**: Use Supabase for authentication, user data, saved items, and progress tracking.
- **Subscriptions and payments**: Integrate Stripe Checkout, the customer portal, and webhooks for subscription entitlement management.


## Screenshots

### Home

![Home](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/01-home.png)

### Featured books

![Featured books](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/02-featuredbooks.png)

### Categories

![Categories](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/03-categories.png)

### Collections

![Collections](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/04-collections.png)

### Book details

![Book details](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/05-book-details.png)

### Download

![Download](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/06-download.png)

### For you

![For you](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/07-foryou.png)

### Explore

![Explore](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/08-explore.png)

### Reading view

![Reading view](https://raw.githubusercontent.com/yizhe2022/nookix-web/main/docs/images/09-reading.png)


## Technology Stack

- **Application**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI
- **Data and authentication**: Supabase, PocketBase
- **Storage and audio delivery**: Cloudflare R2, AWS S3 SDK-compatible APIs
- **Payments and deployment**: Stripe, Vercel

## Run Locally

### Prerequisites

- Node.js 20 or later
- pnpm
- Configured accounts and credentials for the required external services

### Install and start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) after the development server starts.

## Configuration

Use `.env.example` as the single source of truth for configuration. Copy it to `.env.local`, then provide values from the relevant service dashboards. Never commit `.env.local`, access keys, or webhook secrets.

| Service | Primary configuration | Purpose |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Authentication and application data |
| Stripe | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, price IDs, `STRIPE_WEBHOOK_SECRET` | Subscriptions, payments, and webhooks |
| PocketBase | `NEXT_PUBLIC_POCKETBASE_URL` | Published content data |
| Cloudflare R2 | `R2_*`, `AUDIO_WORKER_DOMAIN`, `AUDIO_HMAC_SECRET` | Audio storage and protected delivery |
| Email | `RESEND_API_KEY` | Transactional email notifications |
| Site URL | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL` | Callback and site URL generation |

Depending on your deployment, you may also need to configure the database schema, PocketBase collections, Stripe products and prices, webhook endpoints, and an R2 bucket with its audio worker.

## Build and run in production

```bash
pnpm build
pnpm start
```

## Deployment

The application is suitable for deployment on Vercel. Configure the required environment variables in the hosting platform, then update Supabase callback URLs, Stripe webhooks, and the R2 audio worker for the deployed domain.

## Security

Do not disclose security issues through public Issues. See [SECURITY.md](./SECURITY.md) for reporting guidance and scope.

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE). If you modify this project and provide it to users as a network service, AGPL-3.0 requires that you make the corresponding complete source code available to those users.
