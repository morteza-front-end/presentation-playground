<template>
  <div class="app">
    <!-- ─────────────────────────────── HEADER ─────────────────────────────── -->
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">{ }</span>
        <div>
          <h1>TS Presentation Playground</h1>
          <p class="sub">Live-debugging TypeScript · Monaco diagnostics in the browser</p>
        </div>
      </div>
      <div class="topbar-stats">
        <span class="chip chip-blue">{{ list.length }} sections</span>
        <span class="chip" :class="diagClass">{{ errorCount }} errors</span>
        <span class="chip chip-green">strict: true</span>
      </div>
    </header>

    <div class="workspace">
      <!-- ─────────────────────────── SIDEBAR ─────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-head">Sections</div>
        <nav>
          <button
            v-for="s in list"
            :key="s.id"
            class="nav-item"
            :class="{ active: s.id === active?.id }"
            @click="select(s)"
          >
            <span class="nav-num">{{ String(s.section).padStart(2, '0') }}</span>
            <span class="nav-text">
              <span class="nav-title">{{ s.title }}</span>
              <span class="nav-sub">{{ s.subtitle }}</span>
            </span>
          </button>
        </nav>
        <div class="sidebar-foot">
          <code>npm run demo:tools</code>
          <span class="dim">runs the sample via tsx in your terminal</span>
        </div>
      </aside>

      <!-- ─────────────────────────── RIGHT COLUMN ─────────────────────────── -->
      <section class="right">
        <!-- TOP RIGHT: Monaco editor -->
        <div class="editor-pane">
          <div class="pane-head">
            <div class="tabs">
              <span class="file-tab">
                <span class="dot lang-ts">TS</span>
                {{ active?.file ?? '' }}
              </span>
            </div>
            <div class="diag-strip" v-if="active">
              <span class="diag-pill" :class="diagClass">{{ errorCount }}</span>
              <span class="diag-label">{{ errorCount === 1 ? 'diagnostic' : 'diagnostics' }}</span>
            </div>
          </div>

          <ClientOnly>
            <div ref="editorEl" class="editor-host"></div>
            <template #fallback>
              <div class="editor-fallback">Loading Monaco editor…</div>
            </template>
          </ClientOnly>
        </div>

        <!-- BOTTOM RIGHT: tabbed panel -->
        <div class="bottom-pane">
          <div class="pane-head pane-head-tabs">
            <div class="tabs">
              <button
                class="tab"
                :class="{ on: bottomTab === 'cheat' }"
                @click="bottomTab = 'cheat'"
              >
                Cheat Sheet &amp; Deep Explanations
              </button>
              <button
                class="tab"
                :class="{ on: bottomTab === 'console' }"
                @click="bottomTab = 'console'"
              >
                Mock Console / Runtime
              </button>
            </div>
          </div>

          <div class="bottom-body">
            <!-- TAB 1: cheat sheet -->
            <div v-if="bottomTab === 'cheat' && active" class="markdown" v-html="cheatHtml"></div>

            <!-- TAB 2: console -->
            <div v-if="bottomTab === 'console' && active" class="console">
              <div class="console-bar">
                <span class="prompt">$</span>
                <code>tsx {{ active.file }}</code>
              </div>
              <pre class="console-out">{{ active.consoleOutput }}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type * as Monaco from 'monaco-editor';
import { useSamples } from '~/composables/useSamples';
import { setupMonaco } from '~/composables/useMonaco';
import { renderMarkdown } from '~/utils/markdown';
import type { SampleEntry } from '~/samples/index';

const { list, loadCode } = useSamples();

const active = ref<SampleEntry>(list[0]!);
const bottomTab = ref<'cheat' | 'console'>('cheat');
const errorCount = ref(0);

const editorEl = ref<HTMLElement | null>(null);
let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
let monacoLib: typeof Monaco | null = null;
let model: Monaco.editor.ITextModel | null = null;
let diagSub: Monaco.IDisposable | null = null;

const cheatHtml = computed(() => renderMarkdown(active.value.cheatSheet));

const diagClass = computed(() => (errorCount.value === 0 ? 'chip-green' : 'chip-red'));

async function select(s: SampleEntry) {
  if (s.id === active.value.id) return;
  active.value = s;
  bottomTab.value = 'cheat';
  await hydrateModel();
}

async function hydrateModel() {
  if (!monacoLib || !editor) return;
  let code = '';
  try {
    code = await loadCode(active.value);
  } catch {
    code = `// Could not fetch ${active.value.file} from the dev server.\n// Make sure the samples/ folder is served statically.`;
  }

  const uri = monacoLib.Uri.parse(`file:///${active.value.file}`);
  model =
    monacoLib.editor.getModel(uri) ??
    monacoLib.editor.createModel(code, 'typescript', uri);

  if (model.getValue() !== code) model.setValue(code);
  editor.setModel(model);

  // recompute diagnostics immediately
  countDiagnostics();
}

function countDiagnostics() {
  if (!monacoLib || !model) {
    errorCount.value = 0;
    return;
  }
  const markers = monacoLib.editor.getModelMarkers({
    resource: model.uri,
  });
  errorCount.value = markers.filter((m) => m.severity >= monacoLib!.MarkerSeverity.Warning).length;
}

onMounted(async () => {
  monacoLib = await setupMonaco();
  if (!editorEl.value) return;

  editor = monacoLib.editor.create(editorEl.value, {
    theme: 'vs-dark',
    language: 'typescript',
    automaticLayout: true,
    fontSize: 13.5,
    fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    smoothScrolling: true,
    tabSize: 2,
    lineNumbersMinChars: 3,
    fixedOverflowWidgets: true,
  });

  // React to live diagnostics as the TS worker recomputes them.
  diagSub = monacoLib.editor.onDidChangeMarkers(() => countDiagnostics());

  await hydrateModel();
});

onBeforeUnmount(() => {
  diagSub?.dispose();
  model?.dispose();
  editor?.dispose();
});
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── header ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  font-family: var(--mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
}
.brand h1 {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.2px;
}
.brand .sub {
  font-size: 11.5px;
  color: var(--text-dim);
}
.topbar-stats {
  display: flex;
  gap: 8px;
}
.chip {
  font-size: 11.5px;
  font-family: var(--mono);
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--bg-elev2);
  border: 1px solid var(--border);
  color: var(--text-dim);
}
.chip-blue {
  color: var(--accent);
  border-color: var(--accent-dim);
}
.chip-green {
  color: var(--success);
  border-color: #1e5b2c;
}
.chip-red {
  color: var(--danger);
  border-color: #6e2e2e;
  background: #2a1414;
}

/* ── workspace ── */
.workspace {
  display: grid;
  grid-template-columns: 290px 1fr;
  flex: 1;
  min-height: 0;
}

/* ── sidebar ── */
.sidebar {
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.sidebar-head {
  padding: 12px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border);
}
.sidebar nav {
  overflow-y: auto;
  flex: 1;
  padding: 6px;
}
.nav-item {
  display: flex;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 9px 10px;
  border-radius: 8px;
  align-items: flex-start;
  transition: background 0.12s;
  margin-bottom: 2px;
}
.nav-item:hover {
  background: var(--bg-elev2);
}
.nav-item.active {
  background: var(--bg-elev2);
  box-shadow: inset 2px 0 0 var(--accent);
}
.nav-num {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
  padding-top: 1px;
}
.nav-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.nav-title {
  font-size: 13px;
  font-weight: 600;
}
.nav-sub {
  font-size: 11px;
  color: var(--text-dim);
  line-height: 1.3;
}
.sidebar-foot {
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-dim);
}
.sidebar-foot code {
  font-family: var(--mono);
  color: var(--accent);
  display: block;
  margin-bottom: 4px;
}
.sidebar-foot .dim {
  opacity: 0.7;
}

/* ── right column ── */
.right {
  display: grid;
  grid-template-rows: minmax(0, 1.35fr) minmax(0, 1fr);
  min-height: 0;
}

/* ── editor pane ── */
.editor-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: 1px solid var(--border);
}
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  min-height: 36px;
}
.pane-head-tabs {
  padding: 0;
}
.tabs {
  display: flex;
  gap: 2px;
  align-items: center;
}
.file-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 12px;
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
.diag-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
}
.diag-pill {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 12px;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  display: inline-grid;
  place-items: center;
  border-radius: 5px;
}
.chip-red .diag-pill,
.diag-pill.chip-red {
  background: #6e2e2e;
  color: var(--danger);
}
.diag-pill.chip-green {
  background: #1e5b2c;
  color: var(--success);
}
.diag-label {
  color: var(--text-dim);
}
.editor-host {
  flex: 1;
  min-height: 0;
}
.editor-fallback {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--text-dim);
  font-family: var(--mono);
}

/* ── bottom pane ── */
.bottom-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tab {
  padding: 8px 14px;
  font-size: 12.5px;
  color: var(--text-dim);
  border-bottom: 2px solid transparent;
  height: 36px;
}
.tab:hover {
  color: var(--text);
}
.tab.on {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.bottom-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: var(--bg);
}
.console {
  font-family: var(--mono);
  font-size: 12.5px;
}
.console-bar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 6px 6px 0 0;
  border-bottom: none;
  align-items: center;
}
.console-bar .prompt {
  color: var(--success);
  font-weight: 700;
}
.console-bar code {
  color: var(--accent);
}
.console-out {
  background: #05080c;
  border: 1px solid var(--border);
  border-radius: 0 0 6px 6px;
  padding: 12px 14px;
  color: #b9e3ff;
  white-space: pre-wrap;
  line-height: 1.6;
  font-family: var(--mono);
}
</style>
