// server/api/source/[...path].ts
// Serves the raw source of files under /samples so the browser-side Monaco
// editor can display them verbatim (with live red squiggles). Lives under
// /api so the request is handled by the Nitro router (requests to /samples/**
// at the project root are intercepted by the Vite/SSR dev middleware and never
// reach this handler).
import { statSync, readFileSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3';

const ROOT = resolve(process.cwd());
const SAMPLES_ROOT = resolve(ROOT, 'samples');

export default defineEventHandler((event) => {
  const rest = getRouterParam(event, 'path') ?? '';
  const target = resolve(join(ROOT, rest.split('/').join(sep)));

  // Confine access to files under the project's /samples directory.
  if (!target.startsWith(SAMPLES_ROOT + sep) && target !== SAMPLES_ROOT) {
    throw createError({ statusCode: 400, statusMessage: `Invalid path: ${target}` });
  }

  try {
    const stat = statSync(target);
    if (!stat.isFile()) {
      throw createError({ statusCode: 404, statusMessage: 'Not a file' });
    }
  } catch (err) {
    throw createError({
      statusCode: 404,
      statusMessage: `Sample not found: ${(err as Error).message}`,
    });
  }

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  setHeader(event, 'Cache-Control', 'no-store');
  return readFileSync(target, 'utf-8');
});
