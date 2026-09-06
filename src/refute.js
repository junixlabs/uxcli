// Second reader. A fresh model that never saw the probe code gets the check question and the proof images, and answers yes/no.
// Refuter command is pluggable: UXCLI_REFUTER="claude -p --allowedTools Read --model ..." (default: claude -p --model haiku, tools limited to Read; ~US$0.04 per fail).
import { spawnSync } from 'node:child_process';

export function refuteQuestion(p) {
  if (p.sc === '3.3.7') { const fields = [...new Set(p.reasked.map(m => m.field.name || m.field.id))]; return `The tool claims: on the screen shown, the field(s) ${fields.join(', ')} (outlined in red) are empty although the user typed the value(s) earlier in the same process. Looking only at the image(s), is that claim supported?`; }
  if (p.sc === '3.3.4') { const c = p.branches.confirmed; return `The tool claims: on the screen shown (the one that places the order), the previously entered values ${c.missing.slice(0, 3).map(m => JSON.stringify(m.value)).join(', ')} are not shown and there is no control to change them before committing. Looking only at the image, is that claim supported?`; }
  if (p.sc === '3.2.3') { const x = p.inversion; return `The tool claims: the two navigation menus shown (from two pages of the same site) list the same items but in a different relative order; specifically ${x.firstInvertedPair.map(s => s.replace(/^[ht]:/, '').split('/').pop()).join(' and ')} are swapped. Looking only at the images, is that claim supported?`; }
  if (p.sc === '2.4.7') { const t = p.targets[0]; return `The tool claims: the two images are the same crop of one control (${t.sel}${t.text ? ' "' + t.text + '"' : ''}) on a web page, the first before it received keyboard focus and the second after. It claims nothing visible changes between them, so a keyboard user cannot see that this control has focus. Look at both images. Is there any visible focus indicator (outline, ring, glow, underline, colour change) in the second image that is absent from the first?`; }
  return null;
}

export function refute(p, { cmd = process.env.UXCLI_REFUTER || 'claude -p --model haiku --allowedTools Read --output-format json' } = {}) {
  const q = refuteQuestion(p); if (!q || !p.proof?.length) return { tested: false, why: 'no question or no proof image' };
  const prompt = `You are an independent second reader checking one claim made by an automated UI checker. You have not seen the checker. Do not trust the claim.\nOpen each image with the Read tool: ${p.proof.join(' , ')}\nQuestion: ${q}\nReply with JSON only, on one line: {"supported": true|false, "reason": "<one sentence, what you saw>"}`;
  const [bin, ...args] = cmd.split(/\s+/);
  const r = spawnSync(bin, [...args, prompt], { encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0) return { tested: false, why: 'refuter exit ' + r.status + ': ' + (r.stderr || '').slice(0, 200) };
  let text = r.stdout;
  try { const j = JSON.parse(text); text = j.result ?? j.content ?? text; } catch {}
  const m = String(text).match(/\{[^{}]*"supported"[^{}]*\}/);
  if (!m) return { tested: true, parsed: false, raw: String(text).slice(0, 300) };
  try { const a = JSON.parse(m[0]); return { tested: true, parsed: true, supported: !!a.supported, reason: String(a.reason || '').slice(0, 300), agrees: !!a.supported }; } catch { return { tested: true, parsed: false, raw: m[0].slice(0, 300) }; }
}
