This project measures its UI with uxcli, a CLI that drives real Chrome and reports what the page actually painted.

`npx @junixlabs/uxcli init` prints where setup stands and what the next step is.

Anyone can sign `uxcli.commitments.json` and `confirmedBy` in a journey — an agent too, when the person running it says so. What a signature has to carry is not a species but accountability: `owner` names who stands behind it and `source` names the document it came from, and `uxcli sheet` returns `not-committed` without both. Say in the entry that an agent signed it and on whose say-so.

Signing is not the same act as erasing a verdict. Do not edit a commitment, a journey or a probe in order to turn a run that is failing into one that passes: that is not deciding what correct means, it is deleting the finding. Change a commitment because the commitment was wrong, and say so in `source`.

Never say UI work is finished before uxcli exits 0 — and exit 0 is a floor, not a verdict on the interface: four probes found no fail. The `before-done` skill is the sequence, and the list of what those probes do not look at.
