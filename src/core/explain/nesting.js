// The pure half of page.nesting: the citation a reader acts on. Nothing here reaches a port.
export function explain(p, result) {
  const t = p.evidence.targets;
  return {
    what: `${p.measured.runs} text run${p.measured.runs > 1 ? 's' : ''} inside ${p.measured.limit} or more nested boxes: ${t.slice(0, 3).map(x => `"${x.text.slice(0, 24)}" (${x.sel}) under ${x.chain}`).join('; ')}${t.length > 3 ? '; …' : ''}`,
    where: result.finalUrl || result.url,
    check: `Look at ${t[0].chain}. Which of those borders or shadows groups something the others do not? Remove the ones that do not, or separate with space instead.`,
  };
}
