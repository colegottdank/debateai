# MasterDebater.ai - South Park Debate Arena

A South Park-themed debate platform where users can debate AI characters inspired by the "Got a Nut" episode (S27E02).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key
- Clerk account (for authentication)
- Cloudflare account (optional, for D1 database)

### Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**

Edit `.env.local` and add your real keys:

```env
# Clerk Authentication (get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Claude AI (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Cloudflare D1 (for future database features)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_D1_DATABASE_ID=...
```

3. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🎮 Features

- **5 South Park Characters**: Cartman, Kyle, Stan, Butters, Randy
- **AI-Powered Debates**: Each character has unique personality and debate style
- **Custom Topics**: Debate preset topics or create your own
- **Real-time Responses**: Streaming AI responses for natural conversation
- **Authentication**: Secure sign-in with Clerk

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI**: Claude 3.5 Sonnet via Anthropic SDK
- **Auth**: Clerk
- **Hosting**: Vercel
- **Database**: Cloudflare D1 (optional)

## 📝 Character Personalities

- **Cartman**: Overconfident, uses logical fallacies, claims to be the "master debater"
- **Kyle**: Logical and moral, gets frustrated with bad arguments
- **Stan**: Reasonable middle ground, often gives up when things get ridiculous
- **Butters**: Naive but surprisingly insightful, always polite
- **Randy**: Chaotic, goes off-topic, extreme reactions

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 📄 License

MIT

---

*"I&apos;m not just debating - I&apos;m MASTER debating!" - Eric Cartman*
