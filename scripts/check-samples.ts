// scripts/check-samples.ts
// Terminal helper: prints the sample registry as a table.
// Run with:  pnpm check:samples  (or: tsx scripts/check-samples.ts)
import { samples } from '../samples/index.ts';

console.log('\n  TypeScript Presentation Playground — samples registry\n');
console.log('  # │ file                                              │ bugs (// BUG)');
console.log('  ──┼───────────────────────────────────────────────────┼──────────────');
for (const s of samples) {
  const f = s.file.padEnd(49);
  const b = `${s.section}`.padStart(2);
  console.log(`  ${b} │ ${f} │ ${s.title}`);
}
console.log(`\n  ${samples.length} sections registered.\n`);
