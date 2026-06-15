// scripts/check-samples.ts
// Terminal helper: prints the registry (sections + snippets) as a table.
// Run with:  npm run check:samples  (or: tsx scripts/check-samples.ts)
import { sections } from '../samples/index.ts';

console.log('\n  TypeScript Presentation Playground — registry\n');
console.log('  # │ snippet id                                  │ title');
console.log('  ──┼─────────────────────────────────────────────┼─────────────────────────────');
let total = 0;
for (const sec of sections) {
  for (const sn of sec.snippets) {
    const id = sn.id.padEnd(43);
    const num = `${sec.section}`.padStart(2);
    console.log(`  ${num} │ ${id} │ ${sn.title}`);
    total++;
  }
}
console.log(`\n  ${sections.length} sections · ${total} snippets registered.\n`);
