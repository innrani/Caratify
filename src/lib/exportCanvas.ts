// Lightweight canvas-based poster export to avoid DOM screenshot issues
// Generates a 1080x1350 PNG with key stats only (no remote album covers to avoid CORS)

export interface ExportUserData {
  caratLevel?: string;
  totalMinutes: number;
  topTracks: Array<{
    id?: string;
    name?: string;
    artists?: Array<{ name: string }>;
    album?: { name?: string; images?: Array<{ url: string }> };
  }>;
  topAlbums?: Array<{ name?: string; image?: string; tracks?: string[]; count?: number; totalMinutes?: number }>;
  unitsList?: Array<{ name?: string; count?: number; tracks?: string[] }>;
}

type ImageSource = string; // URL or imported asset path

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const t = text.slice(0, mid) + '…';
    if (ctx.measureText(t).width <= maxWidth) lo = mid; else hi = mid - 1;
  }
  return text.slice(0, lo) + '…';
}

export async function exportStatsImage(
  user: ExportUserData,
  logos: { seventeen: ImageSource; spotify: ImageSource },
  options: { filename?: string } = {}
) {
  const width = 900;
  // Pre-compute dynamic height based on content (songs + albums in two columns)
  const headerH = 280;
  const pad = 30;
  const cardY = 260, cardH = 86;
  const yTopPre = cardY + cardH + 64; // gap under summary cards
  const rowHeightPre = Math.max(30 + 20, 60 + 12); // mirrors values used later
  const titleOffset = 18;
  const countSongs = Math.min((user.topTracks || []).length, 5);
  const countAlbums = Math.min((user.topAlbums || []).length, 5);
  const rows = Math.max(countSongs, countAlbums);
  const yEndEstimate = yTopPre + titleOffset + rows * rowHeightPre;
  const footerGap = 120; // more space above credits
  const dynamicHeight = Math.max(headerH + 240, yEndEstimate + footerGap);

  const height = Math.ceil(dynamicHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Background & header gradient
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  // headerH is defined above for dynamic height calc
  const grad = ctx.createLinearGradient(0, 0, 0, headerH);
  grad.addColorStop(0, '#16a34a'); // darker green
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, headerH);

  // Logos (local assets)
  const loadImg = (src: ImageSource) => new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
  try {
    const [logo17] = await Promise.all([loadImg(logos.seventeen)]);
    // SEVENTEEN icon next to CARATIFY title
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(48, 78, 26, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(logo17, 28, 58, 40, 40);
  } catch {
    // ignore if logos fail
  }

  // Title & subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px Montserrat, Arial, sans-serif';
  ctx.fillText('CARATIFY', 88, 92);
  ctx.font = '800 42px Montserrat, Arial, sans-serif';
  ctx.fillText('Your Seventeen Stats', 30, 170);
  ctx.font = '500 24px Montserrat, Arial, sans-serif';
  ctx.globalAlpha = 0.85; ctx.fillText("Here's how much you love SEVENTEEN", 30, 206); ctx.globalAlpha = 1;

  // Summary cards
  const cardW = (width - pad * 3) / 2; // 30px paddings
  const leftX = pad, rightX = leftX + cardW + pad;
  // Card 1
  ctx.fillStyle = '#181818';
  drawRoundedRect(ctx, leftX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.fillStyle = '#bdbdbd'; ctx.font = '600 20px Montserrat, Arial, sans-serif'; ctx.fillText('Carat Level', leftX + 16, cardY + 30);
  ctx.fillStyle = '#ffffff'; ctx.font = '800 28px Montserrat, Arial, sans-serif';
  ctx.fillText(user.caratLevel || '-', leftX + 16, cardY + 65);
  // Card 2
  ctx.fillStyle = '#181818';
  drawRoundedRect(ctx, rightX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.fillStyle = '#bdbdbd'; ctx.font = '600 20px Montserrat, Arial, sans-serif'; ctx.fillText('Estimated minutes', rightX + 16, cardY + 30);
  ctx.fillStyle = '#ffffff'; ctx.font = '800 28px Montserrat, Arial, sans-serif';
  ctx.fillText((user.totalMinutes || 0).toLocaleString(), rightX + 16, cardY + 65);

  // Sections
  // After summary: start sections with extra spacing
  let yTop = cardY + cardH + 64; // more space between cards and sections
  const lineGap = 30;
  const numberW = 30;
  const colGap = 24;
  const colW = (width - pad * 2 - colGap) / 2;

  // Two-column layout for Songs (left) and Albums (right)
  const xSongs = pad;
  const xAlbums = pad + colW + colGap;

  // Titles
  ctx.fillStyle = '#1db954'; ctx.font = '800 30px Montserrat, Arial, sans-serif';
  ctx.fillText('Top 5 Songs', xSongs, yTop);
  ctx.fillText('Top 5 Albums', xAlbums, yTop);

  // Prepare Songs
  const coverSize = 60;
  const coverGap = 16;
  const rowHeight = Math.max(lineGap + 20, coverSize + 12);
  const items = (user.topTracks || []).slice(0, 5);
  const covers: (HTMLImageElement | null)[] = await Promise.all(
    items.map(t => {
      const url = t?.album?.images?.[0]?.url || t?.album?.images?.slice(-1)[0]?.url;
      if (!url) return Promise.resolve(null);
      return new Promise<HTMLImageElement | null>((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = url;
      });
    })
  );

  // Prepare Albums
  const albumItems = (user.topAlbums || []).slice(0, 5);
  const albumCovers: (HTMLImageElement | null)[] = await Promise.all(
    albumItems.map(al => {
      const url = al?.image;
      if (!url) return Promise.resolve(null);
      return new Promise<HTMLImageElement | null>((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = url;
      });
    })
  );

  // Helper to get last quoted part of album name
  const shortAlbumName = (full?: string) => {
    if (!full) return 'Unknown';
    const matches = full.match(/'([^']+)'/g);
    if (matches && matches.length) {
      const last = matches[matches.length - 1];
      return last.replace(/'/g, '');
    }
    return full;
  };

  // Render Songs (left column)
  let ySong = yTop + 18;
  ctx.fillStyle = '#ffffff';
  items.forEach((t, i) => {
    ySong += rowHeight;
    // number
    ctx.globalAlpha = 0.6; ctx.font = '800 20px Montserrat, Arial, sans-serif'; ctx.fillText(String(i + 1), xSongs, ySong);
    ctx.globalAlpha = 1;
    // cover
    const cover = covers[i];
    let textStartX = xSongs + numberW;
    if (cover) {
      const cx = xSongs + numberW;
      const cy = ySong - coverSize + 4;
      ctx.save();
      drawRoundedRect(ctx, cx, cy, coverSize, coverSize, 8);
      ctx.clip();
      ctx.drawImage(cover, cx, cy, coverSize, coverSize);
      ctx.restore();
      textStartX = cx + coverSize + coverGap;
    }
    const maxW = colW - (textStartX - (xSongs + numberW)) - 4;
    ctx.font = '600 22px Montserrat, Arial, sans-serif';
    const name = fitText(ctx, t?.name || 'Unknown', maxW);
    ctx.fillText(name, textStartX, ySong);
    ctx.globalAlpha = 0.6; ctx.font = '500 18px Montserrat, Arial, sans-serif';
    const artists = (t?.artists || []).map(a => a.name).join(', ');
    const line2 = fitText(ctx, artists, maxW);
    ctx.fillText(line2, textStartX, ySong + 20);
    ctx.globalAlpha = 1;
  });

  // Render Albums (right column)
  let yAlbum = yTop + 18;
  albumItems.forEach((al, i) => {
    yAlbum += rowHeight;
    // number
    ctx.globalAlpha = 0.6; ctx.font = '800 20px Montserrat, Arial, sans-serif'; ctx.fillText(String(i + 1), xAlbums, yAlbum);
    ctx.globalAlpha = 1;
    const cover = albumCovers[i];
    let textStartX = xAlbums + numberW;
    if (cover) {
      const cx = xAlbums + numberW;
      const cy = yAlbum - coverSize + 4;
      ctx.save();
      drawRoundedRect(ctx, cx, cy, coverSize, coverSize, 8);
      ctx.clip();
      ctx.drawImage(cover, cx, cy, coverSize, coverSize);
      ctx.restore();
      textStartX = cx + coverSize + coverGap;
    }
  const maxW = colW - (textStartX - (xAlbums + numberW)) - 4;
  ctx.font = '600 22px Montserrat, Arial, sans-serif';
  const name = fitText(ctx, shortAlbumName(al?.name), maxW);
  ctx.fillText(name, textStartX, yAlbum);
  // removed the "X tracks in your top 50" subtitle as requested
  });

  // Continue below the tallest column (footer uses canvas height, so no-op here)

  // Footer
  ctx.globalAlpha = 0.4; ctx.font = '500 18px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Made with Caratify • innrani.github.io/Caratify', width / 2, height - 24);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.download = options.filename || 'caratify-top5.png';
  a.href = dataUrl;
  a.click();
}

export function exportStatsSvg(
  user: ExportUserData,
  options: { filename?: string } = {}
) {
  const width = 1080;
  const height = 1350;
  const pad = 30;
  const headerH = 360;

  const esc = (s?: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const tracks = (user.topTracks || []).slice(0, 5)
    .map((t, i) => {
      const name = esc(t?.name || 'Unknown');
      const artists = esc((t?.artists || []).map(a => a.name).join(', '));
      return `<g transform="translate(${pad}, ${headerH + 100 + i * 60})">
        <text fill="#9ca3af" font-weight="800" font-size="20">${i + 1}</text>
        <text x="30" y="0" fill="#ffffff" font-weight="600" font-size="24">${name}</text>
        <text x="30" y="24" fill="#9ca3af" font-weight="500" font-size="18">${artists}</text>
      </g>`;
    })
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#16a34a" />
        <stop offset="100%" stop-color="#000000" />
      </linearGradient>
      <style>
        text { font-family: Montserrat, Arial, sans-serif; }
      </style>
    </defs>
    <rect width="100%" height="100%" fill="#000" />
    <rect width="100%" height="${headerH}" fill="url(#grad)" />
    <text x="${pad}" y="90" fill="#fff" font-weight="800" font-size="64">Caratify</text>
    <text x="${pad}" y="190" fill="#fff" font-weight="800" font-size="48">Your Seventeen Stats</text>
    <text x="${pad}" y="230" fill="#ffffff" opacity="0.85" font-weight="500" font-size="28">Here's how much you love SEVENTEEN</text>

    <!-- summary cards -->
    <g>
      <rect x="${pad}" y="255" rx="12" ry="12" width="${(width - pad * 3) / 2}" height="90" fill="#181818" />
      <text x="${pad + 16}" y="285" fill="#bdbdbd" font-weight="600" font-size="20">Carat Level</text>
      <text x="${pad + 16}" y="320" fill="#fff" font-weight="800" font-size="28">${esc(user.caratLevel || '-')}</text>
    </g>
    <g>
      <rect x="${pad + (width - pad * 3) / 2 + pad}" y="255" rx="12" ry="12" width="${(width - pad * 3) / 2}" height="90" fill="#181818" />
      <text x="${pad + (width - pad * 3) / 2 + pad + 16}" y="285" fill="#bdbdbd" font-weight="600" font-size="20">Estimated minutes</text>
      <text x="${pad + (width - pad * 3) / 2 + pad + 16}" y="320" fill="#fff" font-weight="800" font-size="28">${(user.totalMinutes || 0).toLocaleString()}</text>
    </g>

    <text x="${pad}" y="${headerH + 60}" fill="#1db954" font-weight="800" font-size="30">Top 5 Songs</text>
    ${tracks}
    <text x="${width / 2}" y="${height - 24}" text-anchor="middle" fill="#ffffff" opacity="0.4" font-weight="500" font-size="18">Made with Caratify • innrani.github.io/Caratify</text>
  </svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename?.replace(/\.png$/i, '.svg') || 'caratify-top5.svg';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
