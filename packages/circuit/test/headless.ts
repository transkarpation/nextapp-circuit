// The headless entry point: what it reports for good and broken circuits, and that it accepts every sample.
import fs from 'node:fs';
import path from 'node:path';
import { CirSim } from '../src/core/internal';
import { simulateCircuit } from '../src/headless';

const root = path.resolve(import.meta.dirname, '..');
const OPTIONS = '$ 1 5.0E-6 10 50 5.0\n';
const DIVIDER = `${OPTIONS}v 0 0 0 96 0 0 40 10 0 0 0.5\nr 0 96 96 96 0 1000\nr 96 96 96 0 0 1000\nw 96 0 0 0 0\ng 0 0 0 32 0\n`;

let failures = 0;
function check(name: string, ok: boolean, detail: unknown = ''): void {
    if (!ok) { failures++; console.log(`FAIL ${name}`, detail); }
}

const good = simulateCircuit(DIVIDER);
check('divider runs', good.ok && good.stepsRun === 2000, good);
const midpoint = good.elements.find(e => e.type === 'r')!.posts[1];
check('divider halves the voltage', Math.abs(midpoint.voltage - 5) < 1e-6, midpoint);
check('wires are left out', good.elements.every(e => e.type !== 'w') && good.elementCount === 5, good.elements);

const transistor = simulateCircuit(`${DIVIDER}t 96 96 128 96 0 1 0 0 100\n`).elements.find(e => e.type === 't');
check('a three-terminal element reports no single current', transistor?.current === null, transistor);

const names = (text: string) => simulateCircuit(OPTIONS + text).elements.map(e => e.designator);
check('resistors are numbered in file order', names('r 0 0 96 0 0 1\nr 96 0 96 96 0 2\nr 96 96 0 96 0 3\ng 0 96 0 128 0\n').join() === 'R1,R2,R3,', names('r 0 0 96 0 0 1\nr 96 0 96 96 0 2\nr 96 96 0 96 0 3\ng 0 96 0 128 0\n'));
const mixed = good.elements.map(e => e.designator);
check('each kind counts on its own and ground has none', mixed.join() === 'V1,R1,R2,', mixed);

const hidden = new CirSim();
hidden.readCircuit(DIVIDER);
hidden.designatorsCheckItem.setState(false);
const reread = new CirSim();
reread.readCircuit(hidden.dumpCircuit());
check('hiding designators survives a save', !reread.designatorsCheckItem.getState());
const shown = new CirSim();
shown.readCircuit(DIVIDER);
check('designators are on in a file that predates them', shown.designatorsCheckItem.getState() && /^\$ 1 /.test(shown.dumpCircuit()), shown.dumpCircuit());

const empty = simulateCircuit(OPTIONS);
check('empty circuit is an error', !empty.ok && empty.error != null, empty);

const garbage = simulateCircuit('hello world\n');
check('text that is not a circuit is an error', !garbage.ok && garbage.unreadLines.length === 1, garbage);

const partial = simulateCircuit(`${DIVIDER}Q 1 2 3 4 0\nr 1 2 x\n`);
check('skipped lines fail a circuit that still runs', !partial.ok && partial.error == null && partial.unreadLines.length === 2, partial);

const shorted = simulateCircuit(`${OPTIONS}v 0 0 0 96 0 0 40 5 0 0 0.5\nw 0 96 0 0 0\n`);
check('a short circuit reports the simulator message', !shorted.ok && shorted.error != null, shorted);

const limited = simulateCircuit(DIVIDER, { steps: 1e9, budgetMs: 20 });
check('the budget ends a long run', limited.ok && limited.stepsRun < 1e9, limited);

// Sample circuits written by people have to pass, or the check would reject valid work.
const dir = path.join(root, '../../server/public/templates');
const rejected = fs.readdirSync(dir)
    .filter(f => f.endsWith('.txt') && f !== 'setuplist.txt' && f !== 'blank.txt')
    .map(f => ({ f, report: simulateCircuit(fs.readFileSync(path.join(dir, f), 'utf8'), { steps: 200 }) }))
    .filter(({ report }) => !report.ok);
for (const { f, report } of rejected) console.log(`  ${f}: ${report.error ?? report.unreadLines[0]}`);
check('every sample passes', rejected.length === 0, `${rejected.length} rejected`);

console.log(failures ? `headless: ${failures} failed` : 'headless: ok');
process.exit(failures ? 1 : 0);
