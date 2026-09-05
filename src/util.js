export const THIRD = 'iframe, ins.adsbygoogle, .google-auto-placed, [id^="aswift"], [id^="google_ads"], [class^="google-anno"], [class*=" google-anno"]';
export const CHROME = 'header, nav, footer, [role="search"], form[role="search"], [role="navigation"], [role="banner"], [role="contentinfo"]';
export const BOT = /just a moment|attention required|access denied|verify you are human|application error/i;
export const norm = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
export const alnum = s => norm(s).replace(/[^a-z0-9]/g, '');
export const normUrl = u => { try { const x = new URL(u); return x.origin + x.pathname.replace(/\/$/, '') + x.search + (x.hash.startsWith('#/') ? x.hash : ''); } catch { return u; } };
