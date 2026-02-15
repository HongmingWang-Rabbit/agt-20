import { runIndexer } from '../lib/indexer'

async function main() {
  console.log('Running agt-20 indexer...')
  
  try {
    const result = await runIndexer()
    console.log('Result:', result)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
