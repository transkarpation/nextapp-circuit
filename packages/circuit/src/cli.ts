#!/usr/bin/env node
// Headless simulation: tsx src/cli.ts circuit.txt [--steps N] [--every N] [--json]
// Prints simulated time and the voltage of every node, as CSV or as JSON lines.
import fs from 'node:fs';
import { CirSim } from './index';

const args = process.argv.slice(2);
const opt = (name: string, dflt: number) => {
    const i = args.indexOf(name);
    return i >= 0 ? Number(args.splice(i, 2)[1]) : dflt;
};
const steps = opt('--steps', 1000);
const every = opt('--every', steps);
const jsonAt = args.indexOf('--json');
const json = jsonAt >= 0;
if (json) args.splice(jsonAt, 1);
if (args.length !== 1) {
    console.error('usage: cli.ts circuit.txt [--steps N] [--every N] [--json]');
    process.exit(2);
}

const sim = new CirSim();
sim.readCircuit(fs.readFileSync(args[0], 'utf8'));
sim.setSimRunning(true);
sim.update();
if (sim.circuitMatrix == null) {
    console.error(sim.stopMessage ?? 'circuit has nothing to simulate');
    process.exit(1);
}
if (!json) console.log(['t', ...sim.nodeVoltages.map((_, i) => `n${i + 1}`)].join(','));
for (let done = 0; done < steps; done += every) {
    if (!sim.runSteps(Math.min(every, steps - done))) {
        console.error(sim.stopMessage);
        process.exit(1);
    }
    if (json) console.log(JSON.stringify({ t: sim.t, nodes: sim.nodeVoltages }));
    else console.log([sim.t, ...sim.nodeVoltages].join(','));
}
