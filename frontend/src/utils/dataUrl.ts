export function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

export function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? 'image/png';
}
