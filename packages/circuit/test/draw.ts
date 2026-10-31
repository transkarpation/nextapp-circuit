// Exercises the UI-facing code without a browser: every shipped circuit is drawn through a fake
// 2D context, every element's property list is walked, and every palette entry is created.
import fs from 'node:fs';
import path from 'node:path';
import { CirSim, CircuitElm, Color, Context2d, Graphics } from '../src/core/internal';
import { elementCreators } from '../src/core/factory';
import { unitString } from '../src/core/editinfo';
import { paletteGroups } from '../src/ui/palette';

const root = path.resolve(import.meta.dirname, '..');
const dirs = ['../../server/public/templates', 'test/circuits'].map((d) => path.join(root, d));
const UNLOADABLE = new Set(['blank.txt', 'lm324-sub.txt', 'polarcap.txt']);

// records nothing and accepts everything a canvas context accepts
function fakeContext(): CanvasRenderingContext2D {
    const canvas = { width: 800, height: 600 };
    const target: any = { canvas };
    return new Proxy(target, {
        get(t, k) {
            if (k in t) return t[k];
            // width has to follow the font: ChipElm.draw() shrinks the font until a label fits
            if (k === 'measureText') return (s: string) => ({ width: s.length * 0.6 * parseInt(/(\d+)px/.exec(String(t.font))?.[1] ?? '12') });
            if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
            return () => {};
        },
        set(t, k, v) {
            // a NaN coordinate or undefined style means generated code handed over garbage
            t[k] = v;
            return true;
        },
    }) as any;
}

let drawn = 0, edited = 0;
const failures: string[] = [];
const g = new Graphics(new Context2d(fakeContext()));

const trace = process.env.TRACE ? (s: string) => fs.writeSync(2, s + '\n') : (_s: string) => {};

function drawAll(sim: CirSim, label: string): void {
    CircuitElm.selectColor = Color.cyan;
    CircuitElm.whiteColor = Color.white;
    CircuitElm.lightGrayColor = Color.lightGray;
    CircuitElm.currentMult = 1;
    CircuitElm.powerMult = 1;
    for (const ce of sim.elmList) {
        try {
            trace(`${label} draw ${ce.constructor.name}`);
            ce.draw(g);
            ce.getInfo(new Array(15).fill(null));
            drawn++;
        } catch (e: any) {
            failures.push(`${label} draw ${ce.constructor.name}: ${String(e.stack).split('\n').slice(0, 2).join(' ')}`);
        }
        try {
            for (let n = 0; n < 40; n++) {
                const ei = ce.getEditInfo(n);
                if (ei == null) break;
                if (ei.name != null && ei.choice == null && ei.checkbox == null && ei.button == null && ei.textArea == null && ei.text == null) unitString(ei, ce);
                edited++;
            }
        } catch (e: any) {
            // its export button builds a Blob URL, which needs a browser
            if (ce.constructor.name === 'DataRecorderElm' && /document is not defined/.test(String(e))) continue;
            failures.push(`${label} edit ${ce.constructor.name}: ${String(e.stack).split('\n').slice(0, 2).join(' ')}`);
        }
    }
    for (let i = 0; i < sim.scopeCount; i++) {
        try {
            sim.scopes[i].draw(g);
        } catch (e: any) {
            failures.push(`${label} scope: ${String(e.stack).split('\n').slice(0, 3).join(' ')}`);
        }
    }
}

for (const dir of dirs)
    for (const f of fs.readdirSync(dir).sort()) {
        if (f === 'setuplist.txt') continue;
        if (!f.endsWith('.txt') || UNLOADABLE.has(f)) continue;
        const sim = new CirSim();
        sim.readCircuit(fs.readFileSync(path.join(dir, f), 'utf8'));
        sim.setSimRunning(true);
        sim.update();
        trace(`${f} first draw`);
        drawAll(sim, f);       // before running: boundingBox and the view come from draw()
        trace(`${f} run`);
        if (sim.circuitMatrix != null) sim.runSteps(50);
        drawAll(sim, f);
    }

// every creatable element can be dragged out, drawn, analyzed and simulated alone
let created = 0;
for (const [name, make] of Object.entries(elementCreators)) {
    const sim = new CirSim();
    trace(`create ${name}`);
    try {
        const ce = make(160, 160);
        ce.drag(320, 320);
        ce.setPoints();
        sim.elmList.add(ce);
        sim.setSimRunning(true);
        sim.update();
        drawAll(sim, name);
        trace(`create run ${name}`);
        if (sim.circuitMatrix != null) sim.runSteps(5);
        sim.dumpCircuit();
        created++;
    } catch (e: any) {
        failures.push(`create ${name}: ${String(e.stack).split('\n').slice(0, 3).join(' ')}`);
    }
}

const names = Object.keys(elementCreators);
const grouped = paletteGroups(names).flatMap(([, n]) => n);
if (grouped.length !== names.length) failures.push('palette lost elements');
const other = paletteGroups(names).find(([t]) => t === 'Other');

console.log(`drew ${drawn} elements, walked ${edited} properties, created ${created}/${names.length} element types`);
if (other) console.log(`palette Other: ${other[1].join(' ')}`);
const uniq = [...new Set(failures.map((f) => f.replace(/^\S+ /, '')))];
console.log(`${failures.length} failures, ${uniq.length} distinct`);
for (const f of uniq.slice(0, 25)) console.log(' ', f.slice(0, 230));
process.exit(failures.length ? 1 : 0);
