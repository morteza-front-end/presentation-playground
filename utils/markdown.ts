// utils/markdown.ts
// A deliberately tiny, dependency-free Markdown -> HTML renderer.
// Covers headings, code (inline + fenced), tables, lists, hr, bold,
// and inline code highlighting. Sufficient for the cheat-sheet panel.
//
// SECURITY: every user-provided string is run through escapeHtml() BEFORE
// any tag is inserted (see inline() and the fenced-code path). This renderer
// only ever emits a fixed allow-list of tags it constructs itself, so it is
// safe to bind its output with v-html. Do NOT add a path that inserts raw,
// unescaped text — if you do, sanitize with DOMPurify before v-html.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s: string): string {
  let out = escapeHtml(s);
  // inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // links — block dangerous URL schemes (javascript:, data:, etc.) before
  // placing the href into an attribute, since escaping does not prevent them.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) => {
    const safe = /^(https?:|mailto:|\/|#|\.)/i.test(href) ? href : '#';
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;
  let inList: 'ul' | 'ol' | null = null;
  let inTable = false;

  const closeList = () => {
    if (inList) {
      html.push(`</${inList}>`);
      inList = null;
    }
  };
  const closeTable = () => {
    if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i]!;

    // fenced code block
    if (line.startsWith('```')) {
      closeList();
      closeTable();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        buf.push(lines[i]!);
        i++;
      }
      i++; // skip closing fence
      html.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      closeTable();
      const level = h[1]!.length;
      html.push(`<h${level}>${inline(h[2]!)}</h${level}>`);
      i++;
      continue;
    }

    // hr
    if (/^---+$/.test(line.trim())) {
      closeList();
      closeTable();
      html.push('<hr/>');
      i++;
      continue;
    }

    // table
    if (line.includes('|') && lines[i + 1] && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]!)) {
      closeList();
      if (!inTable) {
        html.push('<table><tbody>');
        inTable = true;
      }
      const row = (l: string) =>
        l
          .replace(/^\s*\|/, '')
          .replace(/\|\s*$/, '')
          .split('|')
          .map((c) => `<td>${inline(c.trim())}</td>`)
          .join('');
      html.push(`<tr>${row(line)}</tr>`);
      i += 2; // skip header + separator
      while (i < lines.length && lines[i]!.includes('|')) {
        html.push(`<tr>${row(lines[i]!)}</tr>`);
        i++;
      }
      closeTable();
      continue;
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      if (inList !== 'ul') {
        closeList();
        html.push('<ul>');
        inList = 'ul';
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      if (inList !== 'ol') {
        closeList();
        html.push('<ol>');
        inList = 'ol';
      }
      html.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // blank line
    if (line.trim() === '') {
      closeList();
      closeTable();
      i++;
      continue;
    }

    // paragraph
    closeList();
    closeTable();
    html.push(`<p>${inline(line)}</p>`);
    i++;
  }

  closeList();
  closeTable();
  return html.join('\n');
}
