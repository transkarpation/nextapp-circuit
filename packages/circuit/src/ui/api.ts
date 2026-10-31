// The editor as the Next.js app sees it.  The app is compiled with strict type checks and the
// simulator is not, so package.json points TypeScript here and keeps it out of the simulator sources.

export interface EditorOptions {
    /** The circuit to open, in the text dump format. */
    text: string;
    /** Called after each user edit of the circuit. */
    onChange?: () => void;
    /** Name of the file written by the Export button, read on each export. */
    fileName?: () => string;
}

export interface EditorHandle {
    /** The current circuit in the text dump format. */
    getText(): string;
    /** Stops the simulation, removes every listener and empties the root element. */
    destroy(): void;
}

export type MountEditor = (root: HTMLElement, options: EditorOptions) => EditorHandle;

export declare const mountEditor: MountEditor;
