# Deployment Guide

This guide covers how to deploy DebateAI to Vercel.

## Prerequisites

- Git repository (GitHub, GitLab, or Bitbucket)
- Vercel account (free tier works)
- All environment variables ready

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js configuration

2. **Configure Build Settings**
   - Framework Preset: `Next.js` (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install`

3. **Set Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add all required variables from `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   ANTHROPIC_API_KEY
   CLOUDFLARE_API_TOKEN (optional)
   CLOUDFLARE_ACCOUNT_ID (optional)
   CLOUDFLARE_D1_DATABASE_ID (optional)
   CLOUDFLARE_EMAIL (optional)
   AWS_ACCESS_KEY_ID (optional)
   AWS_SECRET_ACCESS_KEY (optional)
   AWS_REGION (optional)
   AWS_S3_BUCKET_NAME (optional)
   STRIPE_SECRET_KEY (optional)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (optional)
   STRIPE_WEBHOOK_SECRET (optional)
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Future pushes to main branch trigger auto-deployment

### Method 2: Vercel CLI Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Preview**
   ```bash
   vercel
   ```
   Follow prompts to link/create project

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Method 3: Manual Git Push

If Vercel is already connected to your repository:

```bash
# Commit your changes
git add .
git commit -m "Fix citation parsing for new Claude API format"

# Push to trigger deployment
git push origin main
```

## Build Commands Reference

```bash
# Local build test
npm run build

# Start production server locally
npm run start

# Run linting before deploy
npm run lint
```

## Environment Variables

### Required Variables
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key for authentication
- `CLERK_SECRET_KEY` - Clerk secret key for backend auth
- `ANTHROPIC_API_KEY` - Claude API key for AI debates

### Optional Variables
- Database: Cloudflare D1 credentials
- Storage: AWS S3 credentials for avatars
- Payments: Stripe keys for premium subscriptions

## Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Build runs successfully locally (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Latest changes committed to Git
- [ ] Pushed to main branch (for auto-deploy)

## Monitoring Deployment

1. **Vercel Dashboard**
   - View build logs in real-time
   - Check deployment status
   - Monitor function logs

2. **Build Logs**
   - Access via Vercel dashboard → Project → Deployments
   - Click on deployment to see detailed logs

3. **Runtime Logs**
   - Functions tab shows API route logs
   - Useful for debugging production issues

## Rollback

If deployment has issues:

1. **Via Dashboard**
   - Go to Deployments tab
   - Find previous working deployment
   - Click "..." menu → "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   ```

## Troubleshooting

### Build Failures
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Environment Variables
- Double-check all required variables are set
- Ensure no trailing spaces in values
- Verify API keys are valid and have correct permissions

### TypeScript Errors
- Run `npm run build` locally first
- Fix any type errors before deploying

### API Routes Not Working
- Check function logs in Vercel dashboard
- Verify environment variables are accessible
- Ensure API routes follow Next.js App Router conventions

## Performance Optimization

- Enable Vercel Analytics (optional)
- Use Vercel Speed Insights
- Configure caching headers for static assets
- Enable ISR (Incremental Static Regeneration) where applicable

## Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatic

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Project Issues: Create issue in GitHub repository