<template>
  <div class="app">
    <!-- ─────────────────────────────── HEADER ─────────────────────────────── -->
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">{ }</span>
        <div>
          <h1>TS Presentation Playground</h1>
          <p class="sub">Live-editable TypeScript snippets · Monaco diagnostics in the browser</p>
        </div>
      </div>
      <div class="topbar-stats">
        <span class="chip chip-blue">{{ sections.length }} sections</span>
        <span class="chip">{{ totalSnippets }} snippets</span>
        <span class="chip chip-green">strict: true</span>
      </div>
    </header>

    <div class="workspace">
      <!-- ─────────────────────────── SIDEBAR ─────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-head">Contents</div>
        <nav>
          <a
            v-for="s in sections"
            :key="s.id"
            class="nav-item"
            :class="{ active: s.id === activeId }"
            :href="`#${s.id}`"
            @click.prevent="scrollTo(s.id)"
          >
            <span class="nav-num">{{ String(s.section).padStart(2, '0') }}</span>
            <span class="nav-text">
              <span class="nav-title">{{ s.title }}</span>
              <span class="nav-sub">{{ s.snippets.length }} snippets</span>
            </span>
          </a>
        </nav>
        <div class="sidebar-foot">
          <span class="dim">Edit any code box · red squiggles update live, like VS Code.</span>
        </div>
      </aside>

      <!-- ─────────────────────────── CONTENT ─────────────────────────── -->
      <main ref="contentEl" class="content" @scroll="onScroll">
        <div class="content-inner">
          <section
            v-for="s in sections"
            :id="s.id"
            :key="s.id"
            :ref="(el) => setSectionRef(s.id, el)"
            class="doc-section"
          >
            <div class="sec-head">
              <span class="sec-num">{{ String(s.section).padStart(2, '0') }}</span>
              <div>
                <h2 class="sec-title">{{ s.title }}</h2>
                <p class="sec-sub">{{ s.subtitle }}</p>
              </div>
            </div>
            <div class="markdown sec-intro" v-html="introHtml(s.intro)"></div>

            <InlinePlayground
              v-for="sn in s.snippets"
              :key="sn.id"
              :snippet="sn"
            />
          </section>
          <div class="content-end">— end —</div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue';
import { sections } from '~/samples/index';
import { renderMarkdown } from '~/utils/markdown';

const totalSnippets = computed(() => sections.reduce((a, s) => a + s.snippets.length, 0));

const activeId = ref(sections[0]!.id);
const contentEl = ref<HTMLElement | null>(null);
const sectionRefs = new Map<string, HTMLElement>();

function setSectionRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) sectionRefs.set(id, el);
  else sectionRefs.delete(id);
}

function introHtml(md: string) {
  // strip the leading "# NN · Title" heading — it duplicates the section head.
  const stripped = md.replace(/^#\s+.*\n+/, '');
  return renderMarkdown(stripped);
}

function scrollTo(id: string) {
  const el = sectionRefs.get(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onScroll() {
  if (!contentEl.value) return;
  const containerTop = contentEl.value.getBoundingClientRect().top;
  let current = sections[0]!.id;
  for (const s of sections) {
    const el = sectionRefs.get(s.id);
    if (el && el.getBoundingClientRect().top - containerTop - 80 <= 0) current = s.id;
  }
  activeId.value = current;
}

onMounted(() => onScroll());
onBeforeUnmount(() => sectionRefs.clear());
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* header */
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

/* workspace */
.workspace {
  display: grid;
  grid-template-columns: 270px 1fr;
  flex: 1;
  min-height: 0;
}

/* sidebar */
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
  cursor: pointer;
  text-decoration: none;
  color: var(--text);
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
  font-size: 12.5px;
  font-weight: 600;
}
.nav-sub {
  font-size: 10.5px;
  color: var(--text-dim);
}
.sidebar-foot {
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-dim);
}
.sidebar-foot .dim {
  opacity: 0.8;
  line-height: 1.5;
}

/* content */
.content {
  overflow-y: auto;
  scroll-behavior: smooth;
}
.content-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 28px 36px 80px;
}
.doc-section {
  padding-top: 14px;
  scroll-margin-top: 16px;
}
.sec-head {
  display: flex;
  gap: 14px;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 14px;
}
.sec-num {
  font-family: var(--mono);
  font-size: 26px;
  font-weight: 700;
  color: var(--accent-dim);
  opacity: 0.6;
}
.sec-title {
  font-size: 19px;
  font-weight: 700;
}
.sec-sub {
  font-size: 12.5px;
  color: var(--text-dim);
}
.sec-intro {
  font-size: 13.5px;
  line-height: 1.65;
  margin-bottom: 8px;
}
.content-end {
  text-align: center;
  color: var(--text-dim);
  font-size: 12px;
  margin-top: 40px;
  opacity: 0.5;
}
</style>
