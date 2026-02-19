/** Highlight dollar amounts and acreage in AI text */
export function highlightMetrics(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(\$[\d,.]+M?)/g, '<span class="hl">$1</span>')
    .replace(/(\d{1,3}(,\d{3})* acres?)/g, '<span class="hl">$1</span>');
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

/** Format currency in millions */
export function formatMillions(n: number): string {
  return '$' + n.toFixed(1) + 'M';
}

/** Render markdown tables to HTML tables */
function renderTable(tableBlock: string): string {
  const lines = tableBlock.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return tableBlock;

  // Find header and separator
  const headerLine = lines[0];
  const sepIndex = lines.findIndex((l) => /^\|[\s-:|]+\|$/.test(l.trim()));
  if (sepIndex < 0) return tableBlock;

  const parseLine = (line: string) =>
    line.split('|').map((c) => c.trim()).filter(Boolean);

  const headers = parseLine(headerLine);
  const bodyLines = lines.slice(sepIndex + 1);

  let html = '<table class="ai-table"><thead><tr>';
  headers.forEach((h) => { html += `<th>${highlightMetrics(h)}</th>`; });
  html += '</tr></thead><tbody>';

  bodyLines.forEach((line) => {
    const cells = parseLine(line);
    if (cells.length === 0) return;
    html += '<tr>';
    cells.forEach((c) => { html += `<td>${highlightMetrics(c)}</td>`; });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

/** Render markdown headers */
function renderHeaders(text: string): string {
  return text
    .replace(/^#### (.+)$/gm, '<h4 class="ai-h4">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="ai-h2">$1</h2>');
}

/** Full markdown rendering for AI output */
export function renderAIMarkdown(text: string): string {
  // Split by table blocks
  const parts = text.split(/((?:^\|.+\|$\n?)+)/m);

  return parts.map((part) => {
    // Check if this part is a table
    if (/^\|.+\|$/m.test(part) && /\|[\s-:|]+\|/.test(part)) {
      return renderTable(part);
    }
    // Apply headers and metric highlighting
    return renderHeaders(highlightMetrics(part));
  }).join('');
}
