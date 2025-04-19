// Utility to match products by shade
export function findBestProductMatches(products, targetShade) {
  // Assumes products have a metafield or tag 'shade' with a hex color string
  // Returns sorted array of { product, shade, confidence }
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const num = parseInt(hex, 16);
    return [num >> 16, (num >> 8) & 255, num & 255];
  }
  function colorDistance(a, b) {
    return Math.sqrt(a.reduce((acc, v, i) => acc + Math.pow(v - b[i], 2), 0));
  }
  const targetRgb = hexToRgb(targetShade);
  return products.map(product => {
    let shade = product.shade || (product.metafields?.shade) || (product.tags?.find(t => t.startsWith('#')));
    if (!shade) return null;
    const rgb = hexToRgb(shade);
    const dist = colorDistance(targetRgb, rgb);
    const confidence = Math.max(0, 100 - dist); // crude confidence
    return { product, shade, confidence };
  }).filter(Boolean).sort((a, b) => b.confidence - a.confidence);
}
