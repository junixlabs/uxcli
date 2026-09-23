// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/contrast/probe.js — a file move, not a rewrite.
export function explain(p, result) {
    const g = p.evidence.groups, col = (hex, tok) => tok ? `${hex} (${tok})` : hex;
    return {
      what: `${g.reduce((n, x) => n + x.count, 0)} text nodes in ${g.length} colour pair${g.length > 1 ? 's' : ''}: ${g.slice(0, 4).map(x => `${col(x.fg, x.fgToken)} on ${col(x.bg, x.bgToken)} ${x.ratio}:1 ×${x.count} (e.g. ${x.example})`).join('; ')}${g.length > 4 ? '; …' : ''}`,
      where: result.finalUrl || result.url,
      check: g[0].fgToken || g[0].bgToken
        ? `${[g[0].fgToken, g[0].bgToken].filter(Boolean).join(' and ')} declared in ${result.src}; one change there fixes ${g[0].count} node${g[0].count > 1 ? 's' : ''}.`
        : `Is ${g[0].fg} on ${g[0].bg} a design token? One change there fixes ${g[0].count} node${g[0].count > 1 ? 's' : ''}. Pass --src=DIR to name it.`,
    };
  }
