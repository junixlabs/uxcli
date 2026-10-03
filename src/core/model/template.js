// Project templates: where an agent starts when the product is a kind it has seen before — a B2B
// workspace, a shop, a marketing site. A template carries no claim about this product's users. It
// carries the screens such products usually have and the lens each is read against, the journeys
// worth walking first and what to watch on them, and the questions research has to answer before any
// of it is a fact. Applying one writes those questions into an actor's unknowns[], nothing else.
// Pure: parsers in, { value, problems } out.
import { isStr, isObj } from './common.js';
import { KINDS } from './lens.js';

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ACTOR = /^[a-z][a-z0-9_]*$/;
const strs = (v, min = 0) => Array.isArray(v) && v.length >= min && v.every(isStr);
const unknown = (o, keys, at, problems) => { for (const k of Object.keys(o)) if (!keys.includes(k)) problems.push(`${at}unknown key "${k}"`); };

export function parseTemplate(doc) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!isStr(doc.id) || !ID.test(doc.id)) problems.push('id: a kebab-case id');
  if (!isStr(doc.name)) problems.push('name: required');
  if (!isStr(doc.when)) problems.push('when: one sentence saying what kind of product this template is for');

  const actors = Array.isArray(doc.actors) ? doc.actors : [];
  if (!actors.length) problems.push('actors: a non-empty array of { actor, who, questions[] }');
  const actorIds = new Set();
  actors.forEach((a, i) => {
    const at = `actors[${i}]: `;
    if (!isObj(a)) return problems.push(`${at}not an object`);
    if (!isStr(a.actor) || !ACTOR.test(a.actor)) problems.push(`${at}actor: a snake_case id`);
    else if (actorIds.has(a.actor)) problems.push(`${at}actor "${a.actor}" appears twice`); else actorIds.add(a.actor);
    if (!isStr(a.who)) problems.push(`${at}who: one sentence`);
    if (!strs(a.questions, 3)) problems.push(`${at}questions: at least three — a template knows what to ask, not the answers`);
    else for (const q of a.questions) if (!q.trim().endsWith('?')) problems.push(`${at}question "${q}" is not a question — a template states no fact about the user`);
    unknown(a, ['actor', 'who', 'questions'], at, problems);
  });

  const screens = Array.isArray(doc.screens) ? doc.screens : [];
  if (!screens.length) problems.push('screens: a non-empty array of { id, name, lens, does }');
  const screenIds = new Set();
  screens.forEach((s, i) => {
    const at = `screens[${i}]: `;
    if (!isObj(s)) return problems.push(`${at}not an object`);
    if (!isStr(s.id) || !ID.test(s.id)) problems.push(`${at}id: a kebab-case id`);
    else if (screenIds.has(s.id)) problems.push(`${at}id "${s.id}" appears twice`); else screenIds.add(s.id);
    if (!isStr(s.name)) problems.push(`${at}name: required`);
    if (!KINDS.includes(s.lens)) problems.push(`${at}lens: one of ${KINDS.join(', ')}`);
    if (!isStr(s.does)) problems.push(`${at}does: what the person does on this screen`);
    unknown(s, ['id', 'name', 'lens', 'does'], at, problems);
  });

  const journeys = Array.isArray(doc.journeys) ? doc.journeys : [];
  if (!journeys.length) problems.push('journeys: a non-empty array of { id, goal, actor, through[], watch[] }');
  journeys.forEach((j, i) => {
    const at = `journeys[${i}]: `;
    if (!isObj(j)) return problems.push(`${at}not an object`);
    if (!isStr(j.id) || !ID.test(j.id)) problems.push(`${at}id: a kebab-case id`);
    if (!isStr(j.goal)) problems.push(`${at}goal: what the person came to do`);
    if (!actorIds.has(j.actor)) problems.push(`${at}actor "${j.actor}" is not one of this template's actors`);
    if (!strs(j.through, 2)) problems.push(`${at}through: the screens it passes, at least two`);
    else for (const s of j.through) if (!screenIds.has(s)) problems.push(`${at}through names "${s}", which is not one of this template's screens`);
    if (!strs(j.watch, 1)) problems.push(`${at}watch: what to check on this journey when it is walked, at least one`);
    unknown(j, ['id', 'goal', 'actor', 'through', 'watch'], at, problems);
  });

  if (!strs(doc.research, 3)) problems.push('research: at least three questions about the domain');
  else for (const q of doc.research) if (!q.trim().endsWith('?')) problems.push(`research: "${q}" is not a question`);

  const sources = Array.isArray(doc.sources) ? doc.sources : [];
  if (!sources.length) problems.push('sources: where research starts, a non-empty array of { name, url, why }');
  sources.forEach((s, i) => {
    const at = `sources[${i}]: `;
    if (!isObj(s) || !isStr(s.name) || !isStr(s.url) || !isStr(s.why)) return problems.push(`${at}{ name, url, why }`);
    if (!/^https?:\/\//.test(s.url)) problems.push(`${at}url: not a URL`);
    unknown(s, ['name', 'url', 'why'], at, problems);
  });

  unknown(doc, ['schema_version', 'id', 'name', 'when', 'actors', 'screens', 'journeys', 'research', 'sources'], '', problems);
  if (problems.length) return { value: null, problems };
  return { value: { id: doc.id, name: doc.name, when: doc.when, actors, screens, journeys, research: doc.research, sources }, problems };
}

// What `template apply` writes for one actor: the template's questions as the actor's unknowns, and a
// note that says where they came from. Nothing in it is a fact about this product's users.
export function actorSeed(template, actor, at) {
  return {
    schema_version: 1,
    actor: actor.actor,
    unknowns: [...actor.questions],
    note: `Seeded from the uxcli "${template.id}" template on ${at.slice(0, 10)} (${actor.who}). Every line is a question until research answers it with a source; an answer goes into insights/, never here as a fact.`,
  };
}
