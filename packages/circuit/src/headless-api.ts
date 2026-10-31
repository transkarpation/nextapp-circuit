// The headless check as the Next.js app sees it.  As with ui/api.ts, package.json points TypeScript
// here and keeps the app's strict type check out of the simulator sources.

export interface SimulateOptions {
    /** Time steps to run. */
    steps?: number;
    /** Wall-clock limit in milliseconds; the run ends early when it is used up. */
    budgetMs?: number;
}

export interface SimulatedPost {
    x: number;
    y: number;
    /** Volts. */
    voltage: number;
}

export interface SimulatedElement {
    /** The type as it appears in the text format, such as "r" or "150". */
    type: string;
    posts: SimulatedPost[];
    /** Amps, for elements with two terminals. */
    current: number | null;
}

export interface SimulationReport {
    /** The circuit was read in full and ran without the simulator stopping it. */
    ok: boolean;
    /** Why the simulator stopped, or why there was nothing to run. */
    error: string | null;
    /** Lines the parser skipped.  A circuit with any of them is missing parts. */
    unreadLines: string[];
    elementCount: number;
    stepsRun: number;
    /** Simulated time in seconds. */
    time: number;
    /** Final state of every element but wires, up to a limit. */
    elements: SimulatedElement[];
    /** Elements left out of `elements` by the limit. */
    elementsOmitted: number;
}

export type SimulateCircuit = (text: string, options?: SimulateOptions) => SimulationReport;

export declare const simulateCircuit: SimulateCircuit;
