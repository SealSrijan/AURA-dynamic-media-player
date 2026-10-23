import type { AccentColor } from '../types/media';

export const ACCENT_MAP: Record<Exclude<AccentColor, 'dynamic'>, { hex: string; glow: string; text: string }> = {
  amber: {
    hex: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
    text: '#000000',
  },
  cyan: {
    hex: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.45)',
    text: '#000000',
  },
  purple: {
    hex: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.45)',
    text: '#ffffff',
  },
  emerald: {
    hex: '#10B981',
    glow: 'rgba(16, 185, 129, 0.45)',
    text: '#000000',
  },
};

export async function extractDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          // Avoid near blacks and pure whites for vibrant accent
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness > 40 && brightness < 230) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          resolve(hex);
        } else {
          resolve(null);
        }
      } catch (_) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
