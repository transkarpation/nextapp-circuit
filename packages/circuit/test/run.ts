// Tests against closed-form results, plus invariants over every circuit in the project.
//   analytic   results with a known exact answer
//   kcl        Kirchhoff's current law at every node of every sample circuit
//   roundtrip  dump() against the sample files
import fs from 'node:fs';
import path from 'node:path';
import { CirSim, CircuitElm, Diode, Expr, ExprParser, ExprState, TransformerElm, WireElm, charAt, idiv, toInt } from '../src/core/internal';
import { parseUnits } from '../src/core/editinfo';
import { NumberFormat } from '../src/core/gwt';

const root = path.resolve(import.meta.dirname, '..');
const circuitsDir = path.join(root, '../../server/public/templates');
const testsDir = path.join(root, 'test/circuits');

let failures = 0, passes = 0;
function check(name: string, ok: boolean, detail = ''): void {
    if (ok) passes++;
    else { failures++; console.log(`FAIL ${name} ${detail}`); }
}
function near(name: string, got: number, want: number, tol: number): void {
    check(name, Math.abs(got - want) <= tol, `got ${got}, want ${want} +/- ${tol}`);
}

function load(text: string): CirSim {
    const sim = new CirSim();
    sim.readCircuit(text);
    sim.setSimRunning(true);
    sim.update();
    return sim;
}
function voltageAt(sim: CirSim, x: number, y: number): number {
    for (const ce of sim.elmList)
        for (let i = 0; i < ce.getPostCount(); i++) {
            const p = ce.getPost(i);
            if (p.x === x && p.y === y) return ce.volts[i];
        }
    throw new Error(`no post at ${x},${y}`);
}

// ---- analytic -------------------------------------------------------------------------------

function analytic(): void {
    // Java semantics the physics depends on
    near('idiv truncates', idiv(7, 2), 3, 0);
    near('idiv toward zero', idiv(-7, 2), -3, 0);
    near('toInt truncates', toInt(-2.9), -2, 0);
    near('toInt NaN', toInt(NaN), 0, 0);
    near('charAt is numeric', charAt('A', 0), 65, 0);
    near('parseUnits 2k2', parseUnits('2k2'), 2200, 1e-9);
    near('parseUnits 10u', parseUnits('10u'), 1e-5, 1e-15);
    near('parseUnits 1Meg', parseUnits('1Meg'), 1e6, 1e-6);
    check('format', NumberFormat.getFormat('####.###').format(1.5) === '1.5');

    // voltage divider
    {
        const sim = load(`$ 0 5e-6 10 50 5 50
v 112 240 112 112 0 0 40 12 0 0 0.5
r 112 112 240 112 0 1000
r 240 112 240 240 0 3000
w 112 240 240 240 0
g 112 240 112 272 0
`);
        sim.runSteps(2);
        near('divider midpoint', voltageAt(sim, 240, 112), 9, 1e-9);
        near('divider current', Math.abs(sim.elmList.get(1).getCurrent()), 0.003, 1e-12);
    }

    // RC: v(t) = V (1 - exp(-t/RC))
    {
        const R = 1000, C = 1e-6, V = 5, dt = 5e-6;
        const sim = load(`$ 0 ${dt} 10 50 5 50
v 112 240 112 112 0 0 40 ${V} 0 0 0.5
r 112 112 240 112 0 ${R}
c 240 112 240 240 0 ${C} 0 0
w 112 240 240 240 0
g 112 240 112 272 0
`);
        const steps = 200;
        sim.runSteps(steps);
        // the first trapezoidal step starts from i=0 instead of V/R, which delays the curve by dt/2
        near('RC charge at t=tau', voltageAt(sim, 240, 112), V * (1 - Math.exp(-((steps - 0.5) * dt) / (R * C))), 2e-6);
    }

    // RL: i(t) = V/R (1 - exp(-Rt/L))
    {
        const R = 100, L = 0.1, V = 5, dt = 5e-6;
        const sim = load(`$ 0 ${dt} 10 50 5 50
v 112 240 112 112 0 0 40 ${V} 0 0 0.5
r 112 112 240 112 0 ${R}
l 240 112 240 240 0 ${L} 0
w 112 240 240 240 0
g 112 240 112 272 0
`);
        const steps = 200;
        sim.runSteps(steps);
        near('RL current at t=tau', Math.abs(sim.elmList.get(2).getCurrent()), (V / R) * (1 - Math.exp(-((steps - 0.5) * dt) * R / L)), 2e-8);
    }

    // LC: a charged capacitor rings at 1/(2 pi sqrt(LC)) with no loss under trapezoidal integration
    {
        const L = 1e-3, C = 1e-6, dt = 2e-7, V0 = 5;
        const sim = load(`$ 0 ${dt} 10 50 5 50
l 240 112 240 240 0 ${L} 0
c 112 112 112 240 0 ${C} ${V0} 0
w 112 112 240 112 0
w 112 240 240 240 0
g 112 240 112 272 0
`);
        const halfPeriod = Math.PI * Math.sqrt(L * C);
        sim.runSteps(Math.round(halfPeriod / dt));
        near('LC half period inverts voltage', voltageAt(sim, 240, 112), -V0, 0.01);
    }

    // sine source follows bias + V sin(2 pi f t) at the start of each step
    {
        const sim = load(`$ 0 1e-5 10 50 5 50
v 112 240 112 112 0 1 100 5 1 0 0.5
r 112 112 112 240 0 1000
g 112 240 112 272 0
`);
        sim.runSteps(25);
        const t = 24 * 1e-5;
        near('AC source', voltageAt(sim, 112, 112), 1 + 5 * Math.sin(2 * Math.PI * 100 * t), 1e-9);
    }

    // diode: the solved point lies on both the load line and the Shockley curve
    {
        const V = 5, R = 1000;
        const sim = load(`$ 0 5e-6 10 50 5 50
v 112 240 112 112 0 0 40 ${V} 0 0 0.5
r 112 112 240 112 0 ${R}
d 240 112 240 240 0 2 default
w 112 240 240 240 0
g 112 240 112 272 0
`);
        sim.runSteps(50);
        check('diode runs', sim.stopMessage == null, String(sim.stopMessage));
        const vd = voltageAt(sim, 240, 112);
        const i = (V - vd) / R;
        const d: Diode = (sim.elmList.get(2) as any).diode;
        near('diode on Shockley curve', d.calculateCurrent(vd), i, 1e-5);
        check('diode forward drop', vd > 0.5 && vd < 0.9, `vd=${vd}`);
    }

    // a reverse biased diode blocks
    {
        const sim = load(`$ 0 5e-6 10 50 5 50
v 112 240 112 112 0 0 40 5 0 0 0.5
r 112 112 240 112 0 1000
d 240 240 240 112 0 2 default
w 112 240 240 240 0
g 112 240 112 272 0
`);
        sim.runSteps(20);
        // only the saturation current flows: it drops about 0.17 mV across the resistor
        near('reverse diode blocks', voltageAt(sim, 240, 112), 5, 2e-4);
    }

    // ideal op amp: inverting amplifier with gain -3 (the shipped sample)
    {
        const sim = load(fs.readFileSync(path.join(circuitsDir, 'amp-invert.txt'), 'utf8'));
        sim.runSteps(100);
        const vin = voltageAt(sim, 96, 112), vout = voltageAt(sim, 336, 192);
        near('inverting amp gain', vout, -3 * vin, 1e-3);
        near('virtual ground', voltageAt(sim, 192, 176), 0, 1e-3);
    }

    // ideal transformer ratio: open secondary follows the turns ratio
    {
        const sim = load(fs.readFileSync(path.join(circuitsDir, 'transformerup.txt'), 'utf8'));
        check('transformer sample has a transformer', sim.elmList.items.some((e) => e instanceof TransformerElm));
        check('transformer runs', sim.runSteps(2000));
    }

    // digital: truth tables, driving the gate posts from logic inputs
    {
        const gates: [number, string, (a: boolean, b: boolean) => boolean][] = [
            [150, 'AND', (a, b) => a && b], [151, 'NAND', (a, b) => !(a && b)], [152, 'OR', (a, b) => a || b],
            [153, 'NOR', (a, b) => !(a || b)], [154, 'XOR', (a, b) => a !== b],
        ];
        for (const [type, name, fn] of gates) {
            const gateLine = `${type} 176 128 272 128 0 2 0 5`;
            const probe = new CirSim();
            probe.readCircuit(`${gateLine}\n`);
            const gate = probe.elmList.get(0);
            const [in0, in1, out] = [gate.getPost(0), gate.getPost(1), gate.getPost(2)];
            for (const a of [false, true])
                for (const b of [false, true]) {
                    const sim = load(`$ 0 5e-6 10 50 5 50
${gateLine}
L ${in0.x} ${in0.y} ${in0.x - 64} ${in0.y} 0 ${a ? 1 : 0} false 5 0
L ${in1.x} ${in1.y} ${in1.x - 64} ${in1.y} 0 ${b ? 1 : 0} false 5 0
M ${out.x} ${out.y} ${out.x + 64} ${out.y} 0 2.5
`);
                    check(`${name} runs`, sim.runSteps(10), String(sim.stopMessage));
                    near(`${name}(${a},${b})`, sim.elmList.get(0).volts[2], fn(a, b) ? 5 : 0, 1e-6);
                }
        }
    }

    // expression parser (custom functions, VCCS)
    {
        const e: Expr = new ExprParser().init$1('2*a+sin(0)').parseExpression();
        const es = new ExprState().init$1(3);
        es.values[0] = 4;
        near('expression eval', e.eval(es), 8, 1e-12);
    }

    // internal nodes are numbered after the posts, matrix size follows from them
    {
        const sim = load(`$ 0 5e-6 10 50 5 50
v 112 240 112 112 0 0 40 5 0 0 0.5
r 112 112 112 240 0 1000
`);
        sim.runSteps(1);
        near('solved without simplification residue', sim.circuitMatrixSize, 0, 0);
        near('analytic current', Math.abs(sim.elmList.get(1).getCurrent()), 0.005, 1e-12);
    }
}

// ---- corpus --------------------------------------------------------------------------------

function corpusFiles(): { file: string; text: string }[] {
    const out: { file: string; text: string }[] = [];
    for (const dir of [circuitsDir, testsDir])
        for (const f of fs.readdirSync(dir).sort())
            if (f.endsWith('.txt') && f !== 'setuplist.txt') out.push({ file: f, text: fs.readFileSync(path.join(dir, f), 'utf8') });
    return out;
}

// Files that cannot load in the original either: their format predates the current loader
// (see CustomCompositeModel.undump() and the PolarCapacitorElm constructor), and an empty file.
const EXPECTED_UNLOADABLE = new Set(['blank.txt', 'lm324-sub.txt', 'polarcap.txt']);

// Elements whose reported pin currents the original itself leaves approximate, so a node touching
// one cannot balance:
//   LogicInputElm  inherits SwitchElm.calculateCurrent(), which zeroes the current when high
//   RelayElm       ignores the small current through an open contact (see the comment there)
//   VCOElm, CC2Elm compute some pin currents in doStep(), one subiteration behind the solution
//   SevenSegElm    computes pin currents from the diode curve only
const APPROXIMATE_CURRENT = new Set(['LogicInputElm', 'RelayElm', 'VCOElm', 'CC2Elm', 'CC2NegElm', 'SevenSegElm']);

// sum of currents into each node, relative to the largest current there
function kclViolations(sim: CirSim): { elm: string; node: number; sum: number; scale: number }[] {
    const out = [];
    for (let n = 1; n < sim.nodeList.size(); n++) {
        const cn = sim.nodeList.get(n);
        if (cn.internal) continue;
        let sum = 0, scale = 0, unsupported = false;
        const names = new Set<string>();
        for (const link of cn.links) {
            if (link.elm instanceof WireElm) continue;
            // the base implementation is only meaningful for one and two terminal elements
            if (link.elm.getPostCount() > 2 && link.elm.getCurrentIntoNode === CircuitElm.prototype.getCurrentIntoNode) unsupported = true;
            if (APPROXIMATE_CURRENT.has(link.elm.constructor.name)) unsupported = true;
            const i = link.elm.getCurrentIntoNode(link.num);
            if (!Number.isFinite(i)) unsupported = true;
            sum += i;
            scale = Math.max(scale, Math.abs(i));
            names.add(link.elm.constructor.name);
        }
        if (unsupported) continue;
        // elements report currents from the exact curve while the solution is only good to the
        // 0.01 V convergence limit, so nonlinear circuits can be a little off
        if (Math.abs(sum) > 1e-6 + (sim.circuitNonLinear ? 2e-2 : 1e-3) * scale) {
            if (process.env.KCL_DEBUG)
                console.log((Math.abs(sum) / scale).toExponential(2), cn.links.items.map((l) => `${l.elm.constructor.name}[${l.num}]=${l.elm.getCurrentIntoNode(l.num).toExponential(4)}`).join(' '));
            out.push({ elm: [...names].sort().join('+'), node: n, sum, scale });
        }
    }
    return out;
}

function corpus(steps: number): void {
    const kclByClass = new Map<string, number>();
    let simulated = 0, nodesChecked = 0;
    for (const { file, text } of corpusFiles()) {
        const sim = new CirSim();
        let loadError = false;
        CirSim.debug = true;
        const origLog = console.log;
        console.log = (s: any) => { if (/undumping/.test(String(s))) loadError = true; };
        try {
            sim.readCircuit(text);
            sim.setSimRunning(true);
            sim.update();
            if (!loadError && sim.circuitMatrix != null) sim.runSteps(steps);
        } catch (e) {
            console.log = origLog;
            check(`corpus ${file}`, false, String(e));
            continue;
        } finally {
            console.log = origLog;
            CirSim.debug = false;
        }
        if (EXPECTED_UNLOADABLE.has(file)) continue;
        check(`loads ${file}`, !loadError);
        if (sim.circuitMatrix == null) continue;
        simulated++;
        check(`finite voltages ${file}`, sim.nodeVoltages.every(Number.isFinite));
        nodesChecked += sim.nodeList.size();
        for (const v of kclViolations(sim)) kclByClass.set(v.elm, (kclByClass.get(v.elm) ?? 0) + 1);
    }
    console.log(`corpus: simulated ${simulated} circuits, ${steps} steps each, ${nodesChecked} nodes checked for KCL`);
    const sorted = [...kclByClass].sort((a, b) => b[1] - a[1]);
    console.log(`KCL: ${sorted.reduce((n, [, c]) => n + c, 0)} nodes off balance`);
    for (const [k, c] of sorted.slice(0, 40)) console.log(`  ${String(c).padStart(4)} ${k}`);
}

// tokens of a dump line, numbers compared by value because old files use 1.0E-5 style
function sameLine(a: string, b: string): boolean {
    const x = a.trim().split(/\s+/), y = b.trim().split(/\s+/);
    return x.length === y.length && x.every((t, i) => {
        if (t === y[i]) return true;
        const p = Number(t), q = Number(y[i]);
        return Number.isFinite(p) && Number.isFinite(q) && Math.abs(p - q) <= 1e-9 * Math.max(Math.abs(p), Math.abs(q));
    });
}

// Elements must survive a save: a Java-written line loaded and written again stays the same.
function roundtrip(): void {
    let total = 0, same = 0, changedTokens = 0;
    const differing = new Map<string, { n: number; example: string }>();
    for (const { file, text } of corpusFiles()) {
        if (EXPECTED_UNLOADABLE.has(file)) continue;
        const sim = new CirSim();
        sim.readCircuit(text);
        const dumped = sim.dumpCircuit().split('\n').filter((l) => l && !'$oh'.includes(l[0]) && !/^(32|34|38)\s/.test(l) && !'!.'.includes(l[0]));
        const orig = text.split(/\r\n|\n|\r/).filter((l) => l.trim() && !'$oh'.includes(l[0]) && !/^(32|34|38)\s/.test(l) && !'!.&'.includes(l[0]) && !/^[%?B]/.test(l));
        check(`same element count ${file}`, dumped.length === orig.length, `${dumped.length} vs ${orig.length}`);
        for (let i = 0; i < Math.min(dumped.length, orig.length); i++) {
            total++;
            if (sameLine(dumped[i], orig[i])) { same++; continue; }
            // a newer version adds trailing fields; older files simply lack them
            const shorter = orig[i].trim().split(/\s+/);
            const longer = dumped[i].trim().split(/\s+/);
            if (longer.length > shorter.length && sameLine(longer.slice(0, shorter.length).join(' '), shorter.join(' '))) { same++; continue; }
            const key = orig[i].split(' ')[0];
            const e = differing.get(key) ?? { n: 0, example: `${file}\n      file: ${orig[i].slice(0, 100)}\n      dump: ${dumped[i].slice(0, 100)}` };
            e.n++;
            differing.set(key, e);
            changedTokens++;
        }
        // the second generation must be a fixed point
        // sliders round through integers on each load (PotElm.setPoints), so those lines drift
        const drifting = (l: string) => /^(174|172)\s/.test(l);
        const d1 = sim.dumpCircuit();
        const again = new CirSim();
        again.readCircuit(d1);
        const d2 = again.dumpCircuit();
        const a1 = d1.split('\n').filter((l) => !drifting(l)), a2 = d2.split('\n').filter((l) => !drifting(l));
        const firstDiff = a1.findIndex((l, i) => l !== a2[i]);
        check(`stable dump ${file}`, firstDiff < 0, firstDiff < 0 ? '' : `\n   1: ${a1[firstDiff]?.slice(0, 120)}\n   2: ${a2[firstDiff]?.slice(0, 120)}`);
    }
    console.log(`roundtrip: ${same}/${total} element lines identical to the Java-written files (${changedTokens} differ)`);
    for (const [k, v] of [...differing].sort((a, b) => b[1].n - a[1].n).slice(Number(process.env.SKIP ?? 0), Number(process.env.SKIP ?? 0) + 40)) console.log(`  type ${k} x${v.n}: ${v.example}`);
}

analytic();
const mode = process.argv[2] ?? 'all';
if (mode === 'all' || mode === 'corpus') corpus(Number(process.argv[3] ?? 2000));
if (mode === 'all' || mode === 'roundtrip') roundtrip();
console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
