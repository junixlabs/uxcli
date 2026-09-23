// The commitment kinds, as a registry rather than a chain of `if`.
//
// This was the second of the two extension axes the business definition names, and it was one line:
// `if (e.kind !== 'contrast')` — every kind but one measured as `unmeasurable`, and adding a second
// kind meant editing the middle of an evaluation loop. Here a kind is an entry: what it needs from a
// commitment, and how it decides. Adding a capability is adding an entry; nothing in the loop moves.
//
// Explicit, not discovered. ESLint went the other way once and came back: flat config requires a rule
// to be registered by name, because a thing that registers itself by existing is a thing nobody
// decided to ship.

// Relative luminance and the WCAG contrast ratio. Arithmetic over two colours: no file, no browser,
// no token index — those are the caller's to resolve before it gets here.
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100; };

// `against` says what evidence a kind needs, so the caller knows whether it can be measured at all
// from what it has. A commitment about tokens is decided by a stylesheet; one about a flow is decided
// by a run that happened, and asking a stylesheet about a flow is how `unmeasurable` gets misread as
// a defect in the commitment rather than a missing input.
export const KINDS = {
  contrast: {
    against: 'tokens',
    needs: ['fg', 'bg', 'min'],
    measure(e, { values }, where) {
      const fg = values[e.fg], bg = values[e.bg];
      if (!fg || !bg) return { verdict: 'unmeasurable', reason: `${!fg ? e.fg : e.bg} is not declared as a colour under ${where}` };
      if (fg.size > 1 || bg.size > 1) { const many = fg.size > 1 ? fg : bg; return { verdict: 'unmeasurable', reason: `${fg.size > 1 ? e.fg : e.bg} is declared with more than one colour (${[...many].join(', ')}; a theme block or an alias re-pointed it; commit the base token instead)` }; }
      const [f] = fg, [b] = bg; const min = Number(e.min);
      if (!(min > 0)) return { verdict: 'not-committed', reason: 'no minimum ratio' };
      const r = ratio(f, b);
      return { verdict: r >= min ? 'pass' : 'fail', fg: e.fg, bg: e.bg, fgHex: f, bgHex: b, ratio: r, min,
        reason: `${e.fg} ${f} on ${e.bg} ${b} is ${r}:1, committed minimum ${min}:1` };
    },
  },

  // The narrowest flow claim that is still a flow claim: if the run reached `when`, it had to reach
  // `mustObserve` too. It asserts nothing about the DOM — that needs a probe, which is a different
  // lifecycle and somebody else's to write — but it is decided entirely by places the browser
  // demonstrably visited, so it cannot be satisfied by redrawing the map.
  'flow-reachability': {
    against: 'run',
    needs: ['failureSurface'],
    measure(e, { flow }) {
      if (!flow) return { verdict: 'unmeasurable', reason: 'a flow commitment is decided by a run; none was supplied (pass --run=DIR)' };
      const when = [].concat(e.failureSurface?.when || []);
      const must = [].concat(e.failureSurface?.mustObserve || []);
      if (!when.length || !must.length) return { verdict: 'unmeasurable', reason: 'failureSurface needs both `when` and `mustObserve`' };
      const seen = new Set(flow.places.map(p => p.path));
      const hit = when.filter(w => seen.has(w));
      if (!hit.length) return { verdict: 'not-applicable', reason: `this run never reached ${when.join(' or ')}, so the condition never arose`, when, observed: [...seen] };
      const missing = must.filter(m => !seen.has(m));
      return { verdict: missing.length ? 'fail' : 'pass',
        when: hit, mustObserve: must, missing,
        reason: missing.length
          ? `the run reached ${hit.join(', ')} but never ${missing.join(' or ')}`
          : `the run reached ${hit.join(', ')} and ${must.join(', ')}` };
    },
  },
};

export const kindNames = () => Object.keys(KINDS);
export const kindsAgainst = what => Object.entries(KINDS).filter(([, k]) => k.against === what).map(([n]) => n);
