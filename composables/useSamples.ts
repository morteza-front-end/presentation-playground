// composables/useSamples.ts
// Loads the raw .ts source for a sample so Monaco can display it
// with live diagnostics. Falls back to an embedded snippet on failure.
import { samples } from '~/samples/index';
import type { SampleEntry } from '~/samples/index';

export function useSamples() {
  const list = samples;

  async function loadCode(entry: SampleEntry): Promise<string> {
    // Fetch the literal file text from the Nitro `/api/source` endpoint.
    // (We cannot fetch /samples/<file> directly because the Vite/SSR dev
    // middleware intercepts that path and returns the app HTML.)
    const res = await fetch(`/api/source/${entry.file}`);
    if (!res.ok) throw new Error(`Failed to load ${entry.file}: ${res.status}`);
    return res.text();
  }

  return { list, loadCode };
}
