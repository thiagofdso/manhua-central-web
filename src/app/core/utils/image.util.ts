/**
 * Utility functions for handling external image covers with proxy failover.
 * Addresses hotlinking restrictions (e.g. MangaK rx.resmk.org) according to ADR-0002.
 */
export function getProxiedCoverUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Domains that reject direct requests from browsers due to hotlinking policies
  if (trimmed.includes('resmk.org') || trimmed.includes('qvzr') || trimmed.includes('cache.manhuatop.org/')) {
    return `/api/reader/proxy-image?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

export function handleCoverError(event: Event, originalUrl?: string): void {
  const img = event.target as HTMLImageElement;
  if (!img) return;

  const target = originalUrl || img.src;
  if (target && target.startsWith('http') && !img.src.includes('/api/reader/proxy-image')) {
    img.src = `/api/reader/proxy-image?url=${encodeURIComponent(target)}`;
  } else {
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const fallback = parent.querySelector('.cover-fallback') as HTMLElement | null;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  }
}
