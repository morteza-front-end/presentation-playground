// composables/useMonaco.ts
// Bootstraps Monaco with the TypeScript language service worker so the
// editor shows LIVE compilation diagnostics (red squiggles) in the browser.
// Client-only: must run in `onMounted` / inside <ClientOnly>.
import type * as Monaco from 'monaco-editor';

let configured = false;

export async function setupMonaco(): Promise<typeof Monaco> {
  const monaco = await import('monaco-editor');

  if (!configured && import.meta.client) {
    const editorWorker = (await import('monaco-editor/esm/vs/editor/editor.worker?worker')).default;
    const tsWorker = (
      await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker')
    ).default;

    (self as unknown as { MonacoEnvironment: Monaco.Environment }).MonacoEnvironment = {
      getWorker(_workerId, label) {
        if (label === 'typescript' || label === 'javascript') {
          return new tsWorker();
        }
        return new editorWorker();
      },
    };

    // Mirror the project's strictness into the in-browser compiler so the
    // squiggles match what `tsc --strict` would report.
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2022,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      strict: true,
      noImplicitReturns: true,
      noUncheckedIndexedAccess: true,
      noFallthroughCasesInSwitch: true,
      noImplicitOverride: true,
      exactOptionalPropertyTypes: true,
      esModuleInterop: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    configured = true;
  }

  return monaco;
}
