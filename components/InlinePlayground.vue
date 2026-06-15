<template>
  <div class="snippet">
    <h3 class="snip-title">{{ snippet.title }}</h3>
    <div class="markdown snip-expl" v-html="explHtml"></div>

    <div class="playground">
      <div class="pg-head">
        <div class="pg-filetag">
          <span class="dot lang-ts">TS</span>
          <code class="pg-file">{{ snippet.id }}.ts</code>
        </div>
        <div class="pg-actions">
          <span class="diag-pill" :class="diagClass" :title="diagTitle">{{ errorCount }}</span>
          <span class="diag-label">{{ errorCount === 1 ? 'error' : 'errors' }}</span>
          <button class="play-btn" :class="{ on: showConsole }" @click="showConsole = !showConsole">
            <span class="tri">▶</span> {{ showConsole ? 'Hide' : 'Play' }}
          </button>
        </div>
      </div>

      <div ref="wrapEl" class="editor-wrap" :style="{ height: editorHeight }">
        <pre v-if="!ready" class="code-preview"><code>{{ snippet.code }}</code></pre>
        <div ref="editorEl" class="editor-host"></div>
      </div>

      <div v-if="showConsole" class="console-panel">
        <div class="console-bar">
          <span class="prompt">$</span>
          <code>run {{ snippet.id }}.ts</code>
        </div>
        <pre class="console-out">{{ snippet.consoleOutput }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type * as Monaco from 'monaco-editor';
import { setupMonaco } from '~/composables/useMonaco';
import { renderMarkdown } from '~/utils/markdown';
import type { Snippet } from '~/samples/index';

const props = defineProps<{ snippet: Snippet }>();

const explHtml = computed(() => renderMarkdown(props.snippet.explanation));

const wrapEl = ref<HTMLElement | null>(null);
const editorEl = ref<HTMLElement | null>(null);
const ready = ref(false);
const showConsole = ref(false);
const errorCount = ref(0);

let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
let monacoLib: typeof Monaco | null = null;
let model: Monaco.editor.ITextModel | null = null;
let diagSub: Monaco.IDisposable | null = null;
let observer: IntersectionObserver | null = null;
let mounted = false;

const editorHeight = computed(() => {
  const lines = props.snippet.code.split('\n').length;
  return Math.max(86, lines * 19 + 14) + 'px';
});

const hasErrors = computed(() => errorCount.value > 0);
const diagClass = computed(() => (ready.value ? (hasErrors.value ? 'pill-red' : 'pill-green') : 'pill-dim'));
const diagTitle = computed(() =>
  ready.value
    ? `${errorCount.value} TypeScript diagnostic(s) — edit the code to see them update live`
    : 'Editor is lazy-mounted on scroll',
);

async function mountEditor() {
  if (mounted || !editorEl.value) return;
  mounted = true;
  monacoLib = await setupMonaco();
  if (!editorEl.value) return;

  const uri = monacoLib.Uri.parse(`file:///snippet-${props.snippet.id}.ts`);
  model =
    monacoLib.editor.getModel(uri) ??
    monacoLib.editor.createModel(props.snippet.code, 'typescript', uri);

  if (model.getValue() !== props.snippet.code) model.setValue(props.snippet.code);

  editor = monacoLib.editor.create(editorEl.value, {
    model,
    theme: 'vs-dark',
    language: 'typescript',
    automaticLayout: true,
    fontSize: 12.5,
    fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    tabSize: 2,
    lineNumbersMinChars: 3,
    fixedOverflowWidgets: true,
    scrollbar: { vertical: 'hidden', horizontal: 'auto' },
    overviewRulerLanes: 0,
  });

  diagSub = monacoLib.editor.onDidChangeMarkers(countDiags);
  countDiags();
  ready.value = true;
}

function countDiags() {
  if (!monacoLib || !model) {
    errorCount.value = 0;
    return;
  }
  const markers = monacoLib.editor.getModelMarkers({ resource: model.uri });
  errorCount.value = markers.filter((m) => m.severity >= monacoLib!.MarkerSeverity.Error).length;
}

onMounted(() => {
  if (!wrapEl.value || !('IntersectionObserver' in window)) {
    mountEditor();
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        mountEditor();
        observer?.disconnect();
        observer = null;
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(wrapEl.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  diagSub?.dispose();
  editor?.dispose();
});
</script>

<style scoped>
.snippet {
  margin: 22px 0;
}
.snip-title {
  font-size: 14px;
  font-weight: 650;
  color: var(--accent);
  margin: 0 0 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.snip-title::before {
  content: '';
  width: 3px;
  height: 15px;
  background: var(--accent);
  border-radius: 2px;
}
.snip-expl {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
}
.snip-expl :deep(h1),
.snip-expl :deep(h2) {
  display: none;
}

/* playground box */
.playground {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: #1e1e1e;
}
.pg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
}
.pg-filetag {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pg-file {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--text-dim);
}
.dot {
  width: 22px;
  height: 16px;
  border-radius: 4px;
  display: inline-grid;
  place-items: center;
  font-size: 9px;
  font-weight: 700;
}
.lang-ts {
  background: #3178c6;
  color: #fff;
}
.pg-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.diag-pill {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 11.5px;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  display: inline-grid;
  place-items: center;
  border-radius: 4px;
}
.pill-red {
  background: #6e2e2e;
  color: var(--danger);
}
.pill-green {
  background: #1e5b2c;
  color: var(--success);
}
.pill-dim {
  background: var(--bg-elev2);
  color: var(--text-dim);
}
.diag-label {
  font-size: 11px;
  color: var(--text-dim);
  margin-right: 4px;
}
.play-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--accent-dim);
  color: #fff;
  transition: filter 0.12s;
}
.play-btn:hover {
  filter: brightness(1.15);
}
.play-btn.on {
  background: var(--bg-elev2);
  color: var(--text);
  border: 1px solid var(--border);
}
.play-btn .tri {
  font-size: 9px;
}

.editor-wrap {
  position: relative;
  width: 100%;
}
.editor-host {
  position: absolute;
  inset: 0;
}
.code-preview {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 10px 12px;
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 19px;
  color: #d4d4d4;
  background: #1e1e1e;
  overflow: auto;
  white-space: pre;
}

/* console */
.console-panel {
  border-top: 1px solid var(--border);
}
.console-bar {
  display: flex;
  gap: 8px;
  padding: 7px 12px;
  background: var(--bg-elev);
  align-items: center;
  font-family: var(--mono);
  font-size: 11.5px;
}
.console-bar .prompt {
  color: var(--success);
  font-weight: 700;
}
.console-bar code {
  color: var(--accent);
}
.console-out {
  margin: 0;
  background: #05080c;
  padding: 12px 14px;
  color: #b9e3ff;
  white-space: pre-wrap;
  line-height: 1.6;
  font-family: var(--mono);
  font-size: 12px;
}
</style>
