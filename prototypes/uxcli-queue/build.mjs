import fs from 'node:fs';
const HERE = new URL('.', import.meta.url).pathname;
const data = JSON.parse(fs.readFileSync(HERE + 'data.json', 'utf8'));
const tpl = fs.readFileSync(HERE + 'template.html', 'utf8');
fs.writeFileSync(HERE + 'index.html', tpl.replace('/*__DATA__*/null', JSON.stringify(data)));
console.log('wrote index.html', fs.statSync(HERE + 'index.html').size, 'bytes');
