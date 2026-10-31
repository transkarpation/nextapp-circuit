// One call from circuit text to a report, for code that runs on a server and has no canvas.
import { CirSim, type CircuitElm } from './core/internal';
import type { SimulateOptions, SimulatedElement, SimulationReport } from './headless-api';

const CHUNK_STEPS = 100;
const MAX_REPORTED_ELEMENTS = 200;
const WIRE_TYPE = 'w'.charCodeAt(0);
const FIRST_NUMERIC_TYPE = 127;

function typeName(ce: CircuitElm): string {
    const type = ce.getDumpType();
    return type < FIRST_NUMERIC_TYPE ? String.fromCharCode(type) : String(type);
}

function describe(ce: CircuitElm): SimulatedElement {
    const posts = [];
    for (let i = 0; i < ce.getPostCount(); i++) {
        const p = ce.getPost(i);
        posts.push({ x: p.x, y: p.y, voltage: ce.volts[i] });
    }
    // getCurrent() only means something for an element with one path through it
    return { type: typeName(ce), posts, current: ce.getPostCount() === 2 ? ce.getCurrent() : null };
}

export function simulateCircuit(text: string, { steps = 2000, budgetMs = 5000 }: SimulateOptions = {}): SimulationReport {
    const sim = new CirSim();
    let stepsRun = 0;
    let error: string | null = null;
    try {
        sim.readCircuit(text);
        sim.setSimRunning(true);
        sim.update();
        if (sim.circuitMatrix == null) {
            error = sim.stopMessage ?? 'circuit has nothing to simulate';
        } else {
            const deadline = Date.now() + budgetMs;
            while (stepsRun < steps && Date.now() < deadline) {
                const chunk = Math.min(CHUNK_STEPS, steps - stepsRun);
                if (!sim.runSteps(chunk)) {
                    error = sim.stopMessage;
                    break;
                }
                stepsRun += chunk;
            }
        }
    } catch (e) {
        error = `simulator failed: ${e}`;
    }

    const elements = [...sim.elmList].filter(ce => ce.getDumpType() !== WIRE_TYPE);
    return {
        ok: error == null && sim.readErrors.length === 0,
        error,
        unreadLines: sim.readErrors,
        elementCount: sim.elmList.size(),
        stepsRun,
        time: sim.t,
        elements: error == null ? elements.slice(0, MAX_REPORTED_ELEMENTS).map(describe) : [],
        elementsOmitted: error == null ? Math.max(0, elements.length - MAX_REPORTED_ELEMENTS) : 0,
    };
}
