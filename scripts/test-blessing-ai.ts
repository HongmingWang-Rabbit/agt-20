/**
 * Test script for AI blessing verification
 * Run: NVIDIA_API_KEY=your_key npx tsx scripts/test-blessing-ai.ts
 */

import { verifyNewYearBlessing, requiresBlessing } from '../src/lib/nvidia-ai';

const testCases = [
  // Valid blessings
  { text: "恭喜发财！Happy New Year!", expected: true },
  { text: "Wishing you prosperity, health, and happiness in the Year of the Snake! 🐍", expected: true },
  { text: "May the new year bring you joy and success!", expected: true },
  { text: "新年快乐，万事如意！", expected: true },
  { text: "Happy Chinese New Year! 红包拿来!", expected: true },
  
  // Invalid (should fail)
  { text: "hello world", expected: false },
  { text: "random text here", expected: false },
  { text: "buy crypto now!", expected: false },
  { text: "asdfghjkl", expected: false },
  { text: "", expected: false },
];

async function main() {
  console.log('=== AI Blessing Verification Test ===\n');
  
  if (!process.env.NVIDIA_API_KEY) {
    console.log('❌ NVIDIA_API_KEY not set!');
    console.log('Get one from: https://build.nvidia.com/settings/api-keys');
    console.log('\nRun with: NVIDIA_API_KEY=your_key npx tsx scripts/test-blessing-ai.ts');
    process.exit(1);
  }
  
  console.log('✓ NVIDIA_API_KEY found\n');
  
  // Test requiresBlessing
  console.log('--- Testing requiresBlessing() ---');
  console.log('CNY:', requiresBlessing('CNY')); // true
  console.log('RED-POCKET:', requiresBlessing('RED-POCKET')); // true
  console.log('RANDOM:', requiresBlessing('RANDOM')); // false
  console.log('');
  
  // Test AI verification
  console.log('--- Testing AI Verification ---\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = await verifyNewYearBlessing(test.text);
    const status = result === test.expected ? '✅' : '❌';
    
    if (result === test.expected) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(`${status} "${test.text.slice(0, 40)}${test.text.length > 40 ? '...' : ''}"`);
    console.log(`   Expected: ${test.expected}, Got: ${result}\n`);
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('--- Results ---');
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);
}

main().catch(console.error);
