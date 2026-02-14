import 'dotenv/config';
import { createStreakTables } from '../src/lib/streaks';

async function main() {
  console.log('Initializing streak tables...');
  await createStreakTables();
  console.log('Done.');
}

main().catch(console.error);
