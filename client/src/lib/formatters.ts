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
