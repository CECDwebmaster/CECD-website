import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const results = JSON.parse(readFileSync(new URL('../tournament-results.json', import.meta.url), 'utf8'));

function fail(message) {
  console.error('Tournament data check failed: ' + message);
  process.exit(1);
}

if (!Array.isArray(results)) fail('tournament-results.json must contain an array.');
const selector = html.match(/<select\b[^>]*\bid=["']event["'][^>]*>([\s\S]*?)<\/select>/i);
if (!selector) fail('Tournament selector was not found in index.html.');

const optionPattern = /<option\b[^>]*value=["']([^"']*)["'][^>]*>/gi;
const options = [];
for (const match of selector[1].matchAll(optionPattern)) {
  if (match[1]) options.push(match[1]);
}
if (new Set(options).size !== options.length) fail('Tournament selector contains duplicate values.');

const ids = results.map((event) => {
  if (!Array.isArray(event) || event.length !== 6) fail('Each event must have six fields.');
  if (typeof event[0] !== 'string' && typeof event[0] !== 'number') fail('Every event needs a string or numeric ID.');
  if (typeof event[1] !== 'string' || typeof event[2] !== 'string' || typeof event[3] !== 'string') fail('Event title, location, and date must be text.');
  if (event[5] !== null && !Array.isArray(event[5])) fail('Event results must be null or a bracket list.');
  for (const bracket of event[5] ?? []) {
    if (!Array.isArray(bracket) || bracket.length !== 3 || !Array.isArray(bracket[2])) fail('Each bracket must contain a name, team count, and placements.');
    if (bracket[2].some((placement) => typeof placement !== 'string' || !placement.includes('|'))) fail('Each placement must contain player/team and club separated by |.');
  }
  return String(event[0]);
});
if (new Set(ids).size !== ids.length) fail('Results contain duplicate event IDs.');
const missingResults = options.filter((value) => !ids.includes(value));
const missingOptions = ids.filter((value) => !options.includes(value));
if (missingResults.length) fail('No result data for selector value(s): ' + missingResults.join(', '));
if (missingOptions.length) fail('Result data has no selector option for: ' + missingOptions.join(', '));

console.log('Tournament data check passed: ' + ids.length + ' events match all selector options.');
