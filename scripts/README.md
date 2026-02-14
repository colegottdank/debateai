# Scripts

## analyze_dropoff.ts

Analyzes the debate logs of the 100 most recent debates to identify drop-off patterns.

### Usage

1. Ensure `.env.local` contains your Cloudflare D1 credentials:
   ```env
   CLOUDFLARE_ACCOUNT_ID=...
   CLOUDFLARE_D1_DATABASE_ID=...
   CLOUDFLARE_API_TOKEN=...
   CLOUDFLARE_EMAIL=...
   ```

2. Run the script:
   ```bash
   npx tsx scripts/analyze_dropoff.ts
   ```

3. View the report at `reports/dropoff_analysis.md`.
