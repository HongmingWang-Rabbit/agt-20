import { runSnapshot } from '../lib/snapshot';

async function main() {
  console.log(`[${new Date().toISOString()}] Running token snapshot...`);
  
  try {
    const result = await runSnapshot();
    console.log(`[${new Date().toISOString()}] Done:`, result);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
    process.exit(1);
  }
}

main();
