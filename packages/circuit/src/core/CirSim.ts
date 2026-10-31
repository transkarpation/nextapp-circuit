/*
    Copyright (C) Paul Falstad and Iain Sharp

    This file is part of CircuitJS1.

    CircuitJS1 is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    CircuitJS1 is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with CircuitJS1.  If not, see <http://www.gnu.org/licenses/>.
*/

// Changed 2026-10-31: ported from CirSim.java to TypeScript by hand.
// Simulation engine: port of the non-UI part of CirSim.java.  See INTERNALS.md in the project root.
import {
    Adjustable, CapacitorElm, CheckboxMenuItem, CircuitElm, CircuitNode, CircuitNodeLink, CurrentElm, CustomCompositeModel,
    CustomLogicModel, DiodeModel, GraphicElm, GroundElm, HashMap, InductorElm, LabeledNodeElm, LogicInputElm, Point, RailElm, Random,
    Rectangle, RowInfo, Scope, ScopeElm, StringTokenizer, Switch2Elm, TransistorModel, VCCSElm, Vector, VoltageElm, WireElm,
} from './internal';
import { createCe, elementCreators } from './factory';

class NodeMapEntry {
    node: number;
    constructor(n = -1) { this.node = n; }
}

class WireInfo {
    neighbors: Vector<CircuitElm> | null = null;
    post = 0;
    constructor(public wire: WireElm) {}
}

// a numeric UI control the engine reads; the canvas UI binds sliders to these
class ValueBar {
    constructor(public value: number) {}
    getValue(): number { return this.value; }
    setValue(v: number): void { this.value = v; }
}

const enum PathType { INDUCT = 1, VOLTAGE = 2, SHORT = 3, CAP_V = 4 }

export interface RunOptions {
    // stop after this many completed time steps
    steps: number;
}

export class CirSim {
    static muString = 'μ';
    static ohmString = 'Ω';
    static MODE_ADD_ELM = 0;
    static MODE_DRAG_ALL = 1;
    static MODE_DRAG_ROW = 2;
    static MODE_DRAG_COLUMN = 3;
    static MODE_DRAG_SELECTED = 4;
    static MODE_DRAG_POST = 5;
    static MODE_SELECT = 6;
    static MODE_DRAG_SPLITTER = 7;
    static RC_RETAIN = 1;
    static RC_NO_CENTER = 2;
    static RC_SUBCIRCUITS = 4;
    static debug = false;
    static theSim: CirSim;
    static dialogShowing: any = null;
    static diodeModelEditDialog: any = null;
    static transistorModelEditDialog: any = null;
    static customLogicEditDialog: any = null;
    static createCe = createCe;
    static constructElement(n: string, x1: number, y1: number): CircuitElm | null { return elementCreators[n]?.(x1, y1) ?? null; }
    static translations: Record<string, string> = {};

    static LS(s: string): string { return s == null ? s : CirSim.translations[s] ?? s; }
    static console(text: string): void { if (CirSim.debug) console.log(text); }

    // simulation state
    elmList = new Vector<CircuitElm>();
    nodeList = new Vector<CircuitNode>();
    voltageSources: CircuitElm[] = [];
    voltageSourceCount = 0;
    circuitMatrix: number[][] | null = null;
    origMatrix: number[][] = [];
    circuitRightSide: number[] = [];
    origRightSide: number[] = [];
    nodeVoltages: number[] = [];
    lastNodeVoltages: number[] | null = null;
    circuitRowInfo: RowInfo[] = [];
    circuitPermute: number[] = [];
    circuitNonLinear = false;
    circuitNeedsMap = false;
    circuitMatrixSize = 0;
    circuitMatrixFullSize = 0;
    wireInfoList = new Vector<WireInfo>();
    nodeMap: HashMap<Point, NodeMapEntry> | null = null;
    postCountMap: HashMap<Point, number> | null = null;
    unconnectedNodes = new Vector<number>();
    postDrawList = new Vector<Point>();
    badConnectionList = new Vector<Point>();

    t = 0;
    timeStep = 5e-6;
    maxTimeStep = 5e-6;
    minTimeStep = 50e-12;
    timeStepAccum = 0;
    timeStepCount = 0;
    adjustTimeStep = false;
    converged = false;
    subIterations = 0;
    steps = 0;
    analyzeFlag = false;
    dcAnalysisFlag = false;
    simRunning = true;
    stopMessage: string | null = null;
    // Lines the last readCircuit() had to skip, which would otherwise vanish without a trace
    readErrors: string[] = [];
    stopElm: CircuitElm | null = null;
    showResistanceInVoltageSources = true;
    random = new Random();

    // wall-clock pacing
    lastTime = 0;
    lastFrameTime = 0;
    lastIterTime = 0;
    simTime = 0;

    // scopes and sliders
    scopes: Scope[] = [];
    scopeColCount: number[] = [];
    scopeCount = 0;
    scopeSelected = -1;
    adjustables = new Vector<Adjustable>();
    widgets: any[] = [];
    onWidgetsChanged: (() => void) | null = null;

    // file-level state
    hintType = -1;
    hintItem1 = 0;
    hintItem2 = 0;

    // view state read by the elements
    gridSize = 16;
    gridMask = ~15;
    gridRound = 8;
    mouseMode = CirSim.MODE_SELECT;
    mouseCursorX = -1;
    mouseCursorY = -1;
    dragElm: CircuitElm | null = null;
    plotXElm: CircuitElm | null = null;
    plotYElm: CircuitElm | null = null;
    transform = [1, 0, 0, 1, 0, 0];
    circuitArea = new Rectangle().init$4(0, 0, 800, 600);
    canvasWidth = 800;
    canvasHeight = 600;
    infoWidth = 120;
    needsRepaint: (() => void) | null = null;

    dotsCheckItem = new CheckboxMenuItem('Show Current', true);
    voltsCheckItem = new CheckboxMenuItem('Show Voltage', true);
    powerCheckItem = new CheckboxMenuItem('Show Power', false);
    showValuesCheckItem = new CheckboxMenuItem('Show Values', true);
    smallGridCheckItem = new CheckboxMenuItem('Small Grid', false);
    crossHairCheckItem = new CheckboxMenuItem('Crosshair', false);
    euroResistorCheckItem = new CheckboxMenuItem('European Resistors', false);
    euroGatesCheckItem = new CheckboxMenuItem('IEC Gates', false);
    printableCheckItem = new CheckboxMenuItem('White Background', false);
    conventionCheckItem = new CheckboxMenuItem('Conventional Current Motion', true);
    noEditCheckItem = new CheckboxMenuItem('Disable Editing', false);
    speedBar = new ValueBar(117);
    currentBar = new ValueBar(50);
    powerBar = new ValueBar(50);

    constructor() {
        CirSim.theSim = this;
        CircuitElm.initClass(this);
        CircuitElm.setColorScale();
        this.setGrid();
    }

    getElm(n: number): CircuitElm | null { return n >= this.elmList.size() ? null : this.elmList.get(n); }
    getCircuitNode(n: number): CircuitNode | null { return n >= this.nodeList.size() ? null : this.nodeList.get(n); }
    locateElm(elm: CircuitElm): number { return this.elmList.indexOf(elm); }
    updateModels(): void { for (const ce of this.elmList) ce.updateModels$0(); }
    needAnalyze(): void { this.analyzeFlag = true; this.repaint(); }
    repaint(): void { this.needsRepaint?.(); }
    setSimRunning(s: boolean): void { this.simRunning = s; }
    simIsRunning(): boolean { return this.simRunning; }
    getrand(x: number): number {
        const q = this.random.nextInt();
        return (q < 0 ? -q : q) % x;
    }
    snapGrid(x: number): number { return (x + this.gridRound) & this.gridMask; }
    setGrid(): void {
        this.gridSize = this.smallGridCheckItem.getState() ? 8 : 16;
        this.gridMask = ~(this.gridSize - 1);
        this.gridRound = this.gridSize / 2 - 1;
    }
    transformX(x: number): number { return x * this.transform[0] + this.transform[4]; }
    transformY(y: number): number { return y * this.transform[3] + this.transform[5]; }
    setMouseElm(ce: CircuitElm | null): void { ce?.setMouseElm(true); }
    dialogIsShowing(): boolean { return false; }
    setiFrameHeight(): void {}
    addWidgetToVerticalPanel(w: any): void { this.widgets.push(w); this.onWidgetsChanged?.(); }
    removeWidgetFromVerticalPanel(w: any): void {
        const i = this.widgets.indexOf(w);
        if (i >= 0) this.widgets.splice(i, 1);
        this.onWidgetsChanged?.();
    }
    deleteSliders(elm: CircuitElm): void {
        for (let i = this.adjustables.size() - 1; i >= 0; i--) {
            const adj = this.adjustables.get(i);
            if (adj.elm === elm) {
                adj.deleteSlider(this);
                this.adjustables.removeAt(i);
            }
        }
    }

    getIterCount(): number {
        if (this.speedBar.getValue() === 0) return 0;
        return 0.1 * Math.exp((this.speedBar.getValue() - 61) / 24);
    }

    // ---- circuit analysis ----------------------------------------------------------------

    // find groups of nodes connected by wires and map them to the same node.  this speeds things
    // up considerably by reducing the size of the matrix
    private calculateWireClosure(): void {
        const nodeMap = this.nodeMap = new HashMap<Point, NodeMapEntry>();
        this.wireInfoList = new Vector<WireInfo>();
        for (const ce of this.elmList) {
            if (!(ce instanceof WireElm)) continue;
            ce.hasWireInfo = false;
            this.wireInfoList.add(new WireInfo(ce));
            let cn = nodeMap.get(ce.getPost(0));
            const cn2 = nodeMap.get(ce.getPost(1));
            if (cn != null && cn2 != null) {
                // merge nodes; change all keys pointing to cn2 to point to cn
                for (const entry of nodeMap.entrySet())
                    if (entry.getValue() === cn2) entry.setValue(cn);
                continue;
            }
            if (cn != null) { nodeMap.put(ce.getPost(1), cn); continue; }
            if (cn2 != null) { nodeMap.put(ce.getPost(0), cn2); continue; }
            cn = new NodeMapEntry();
            nodeMap.put(ce.getPost(0), cn);
            nodeMap.put(ce.getPost(1), cn);
        }
    }

    // generate info we need to calculate wire currents.  wires have the same voltage at both ends,
    // so we use the neighbors' currents instead.
    private calcWireInfo(): boolean {
        let moved = 0;
        const list = this.wireInfoList;
        for (let i = 0; i !== list.size(); i++) {
            const wi = list.get(i);
            const wire = wi.wire;
            const cn1 = this.nodeList.get(wire.getNode(0));
            const neighbors0 = new Vector<CircuitElm>();
            const neighbors1 = new Vector<CircuitElm>();
            let isReady0 = true, isReady1 = true;
            // go through elements sharing a node with this wire
            for (const cnl of cn1.links) {
                const ce = cnl.elm;
                if (ce === wire) continue;
                const pt = ce.getPost(cnl.num);
                // a wire without wire info yet would create a circular dependency
                const notReady = ce instanceof WireElm && !ce.hasWireInfo;
                if (pt.x === wire.x && pt.y === wire.y) {
                    neighbors0.add(ce);
                    if (notReady) isReady0 = false;
                } else if (pt.x === wire.x2 && pt.y === wire.y2) {
                    neighbors1.add(ce);
                    if (notReady) isReady1 = false;
                }
            }
            if (isReady0) {
                wi.neighbors = neighbors0;
                wi.post = 0;
                wire.hasWireInfo = true;
                moved = 0;
            } else if (isReady1) {
                wi.neighbors = neighbors1;
                wi.post = 1;
                wire.hasWireInfo = true;
                moved = 0;
            } else {
                // move to the end of the list and try again later
                list.add(list.removeAt(i--));
                moved++;
                if (moved > list.size() * 2) {
                    this.stop('wire loop detected', wire);
                    return false;
                }
            }
        }
        return true;
    }

    // find or allocate ground node
    private setGroundNode(): void {
        let gotGround = false, gotRail = false;
        let volt: CircuitElm | null = null;
        for (const ce of this.elmList) {
            if (ce instanceof GroundElm) { gotGround = true; break; }
            if (ce instanceof RailElm) gotRail = true;
            if (volt == null && ce instanceof VoltageElm) volt = ce;
        }
        // if no ground, and no rails, then the voltage elm's first terminal is ground
        if (!gotGround && volt != null && !gotRail) {
            this.nodeList.add(new CircuitNode().init$0());
            const pt = volt.getPost(0);
            const cln = this.nodeMap!.get(pt);
            if (cln != null) cln.node = 0;
            else this.nodeMap!.put(pt, new NodeMapEntry(0));
        } else {
            // otherwise allocate extra node for ground
            this.nodeList.add(new CircuitNode().init$0());
        }
    }

    private makeNodeList(): void {
        let vscount = 0;
        const nodeMap = this.nodeMap!, postCountMap = this.postCountMap!;
        for (const ce of this.elmList) {
            const inodes = ce.getInternalNodeCount();
            const ivs = ce.getVoltageSourceCount();
            const posts = ce.getPostCount();
            // allocate a node for each post and match posts to nodes
            for (let j = 0; j !== posts; j++) {
                const pt = ce.getPost(j);
                const g = postCountMap.get(pt);
                postCountMap.put(pt, g == null ? 1 : g + 1);
                const cln = nodeMap.get(pt);
                // allocation order matters: it decides which node gets connected to ground below
                if (cln == null || cln.node === -1) {
                    const cn = new CircuitNode().init$0();
                    const cnl = new CircuitNodeLink().init$0();
                    cnl.num = j;
                    cnl.elm = ce;
                    cn.links.add(cnl);
                    ce.setNode(j, this.nodeList.size());
                    if (cln != null) cln.node = this.nodeList.size();
                    else nodeMap.put(pt, new NodeMapEntry(this.nodeList.size()));
                    this.nodeList.add(cn);
                } else {
                    const n = cln.node;
                    const cnl = new CircuitNodeLink().init$0();
                    cnl.num = j;
                    cnl.elm = ce;
                    this.getCircuitNode(n)!.links.add(cnl);
                    ce.setNode(j, n);
                    // the ground node's voltage may not get set later
                    if (n === 0) ce.setNodeVoltage(j, 0);
                }
            }
            for (let j = 0; j !== inodes; j++) {
                const cn = new CircuitNode().init$0();
                cn.internal = true;
                const cnl = new CircuitNodeLink().init$0();
                cnl.num = j + posts;
                cnl.elm = ce;
                cn.links.add(cnl);
                ce.setNode(cnl.num, this.nodeList.size());
                this.nodeList.add(cn);
            }
            vscount += ivs;
        }
        this.voltageSources = new Array(vscount).fill(null);
    }

    // all nodes must be connected to ground somehow, or else we will get a matrix error
    private findUnconnectedNodes(): void {
        const closure: boolean[] = new Array(this.nodeList.size()).fill(false);
        let changed = true;
        this.unconnectedNodes = new Vector<number>();
        closure[0] = true;
        while (changed) {
            changed = false;
            for (const ce of this.elmList) {
                if (ce instanceof WireElm) continue;
                const count = ce.getConnectionNodeCount();
                for (let j = 0; j < count; j++) {
                    if (!closure[ce.getConnectionNode(j)]) {
                        if (ce.hasGroundConnection(j)) closure[ce.getConnectionNode(j)] = changed = true;
                        continue;
                    }
                    for (let k = 0; k !== count; k++) {
                        if (j === k) continue;
                        const kn = ce.getConnectionNode(k);
                        if (ce.getConnection(j, k) && !closure[kn]) {
                            closure[kn] = true;
                            changed = true;
                        }
                    }
                }
            }
            if (changed) continue;
            // connect one of the unconnected nodes to ground with a big resistor, then try again
            for (let i = 0; i !== this.nodeList.size(); i++)
                if (!closure[i] && !this.getCircuitNode(i)!.internal) {
                    this.unconnectedNodes.add(i);
                    closure[i] = true;
                    changed = true;
                    break;
                }
        }
    }

    private connectUnconnectedNodes(): void {
        for (const n of this.unconnectedNodes) this.stampResistor(0, n, 1e8);
    }

    // look for loops in the circuit, from node n1 of firstElm back to node dest of firstElm
    private findPath(type: PathType, firstElm: CircuitElm, dest: number, start: number): boolean {
        const visited: boolean[] = new Array(this.nodeList.size()).fill(false);
        const elms = this.elmList.items;
        const search = (n1: number): boolean => {
            if (n1 === dest) return true;
            // depth first search, don't need to revisit already visited nodes!
            if (visited[n1]) return false;
            visited[n1] = true;
            for (const ce of elms) {
                if (ce === firstElm) continue;
                // inductors need a path free of current sources
                if (type === PathType.INDUCT && ce instanceof CurrentElm) continue;
                // when checking for voltage loops, we only care about voltage sources/wires/ground
                if (type === PathType.VOLTAGE && !(ce.isWire() || ce instanceof VoltageElm || ce instanceof GroundElm)) continue;
                // when checking for shorts, just check wires
                if (type === PathType.SHORT && !ce.isWire()) continue;
                // checking for capacitor/voltage source loops
                if (type === PathType.CAP_V && !(ce.isWire() || ce instanceof CapacitorElm || ce instanceof VoltageElm)) continue;
                const count = ce.getConnectionNodeCount();
                if (n1 === 0) {
                    // look for posts which have a ground connection; our path can go through ground
                    for (let j = 0; j !== count; j++)
                        if (ce.hasGroundConnection(j) && search(ce.getConnectionNode(j))) return true;
                }
                let j: number;
                for (j = 0; j !== count; j++)
                    if (ce.getConnectionNode(j) === n1) break;
                if (j === count) continue;
                if (ce.hasGroundConnection(j) && search(0)) return true;
                if (type === PathType.INDUCT && ce instanceof InductorElm) {
                    // inductors can use paths with other inductors of matching current
                    let c = ce.getCurrent();
                    if (j === 0) c = -c;
                    if (Math.abs(c - firstElm.getCurrent()) > 1e-10) continue;
                }
                for (let k = 0; k !== count; k++) {
                    if (j === k) continue;
                    if (ce.getConnection(j, k) && search(ce.getConnectionNode(k))) return true;
                }
            }
            return false;
        };
        return search(start);
    }

    private validateCircuit(): boolean {
        for (const ce of this.elmList) {
            // look for inductors with no current path
            if (ce instanceof InductorElm) {
                if (!this.findPath(PathType.INDUCT, ce, ce.getNode(1), ce.getNode(0))) ce.reset();
            }
            // look for current sources with no current path
            if (ce instanceof CurrentElm) {
                ce.setBroken(!this.findPath(PathType.INDUCT, ce, ce.getNode(1), ce.getNode(0)));
            }
            if (ce instanceof VCCSElm) {
                ce.broken = ce.hasCurrentOutput() && !this.findPath(PathType.INDUCT, ce, ce.getOutputNode(0), ce.getOutputNode(1));
            }
            // look for voltage source or wire loops.  we do this for voltage sources or wire-like
            // elements (not actual wires because those are optimized out)
            if (ce.getPostCount() === 2) {
                if (ce instanceof VoltageElm || (ce.isWire() && !(ce instanceof WireElm))) {
                    if (this.findPath(PathType.VOLTAGE, ce, ce.getNode(1), ce.getNode(0))) {
                        this.stop('Voltage source/wire loop with no resistance!', ce);
                        return false;
                    }
                }
            } else if (ce instanceof Switch2Elm) {
                // for Switch2Elms we need to do extra work to look for wire loops.  The visited
                // set is shared between the posts, as in the original.
                const dest = ce.getNode(0);
                for (let j = 1; j < ce.getPostCount(); j++)
                    if (ce.getConnection(0, j) && this.findPath(PathType.VOLTAGE, ce, dest, ce.getNode(j))) {
                        this.stop('Voltage source/wire loop with no resistance!', ce);
                        return false;
                    }
            }
            // look for path from rail to ground
            if (ce instanceof RailElm || ce instanceof LogicInputElm) {
                if (this.findPath(PathType.VOLTAGE, ce, ce.getNode(0), 0)) {
                    this.stop('Path to ground with no resistance!', ce);
                    return false;
                }
            }
            // look for shorted caps, or caps w/ voltage but no R
            if (ce instanceof CapacitorElm) {
                if (this.findPath(PathType.SHORT, ce, ce.getNode(1), ce.getNode(0))) {
                    ce.shorted();
                } else if (this.findPath(PathType.CAP_V, ce, ce.getNode(1), ce.getNode(0))) {
                    // a capacitor added in parallel with another one holding a nonzero voltage
                    // would oscillate, so give an error
                    this.stop('Capacitor loop with no resistance!', ce);
                    return false;
                }
            }
        }
        return true;
    }

    private makePostDrawList(): void {
        this.postDrawList = new Vector<Point>();
        this.badConnectionList = new Vector<Point>();
        for (const entry of this.postCountMap!.entrySet()) {
            if (entry.getValue() !== 2) this.postDrawList.add(entry.getKey());
            // look for bad connections, posts not connected to other elements which intersect
            // other elements' bounding boxes
            if (entry.getValue() === 1) {
                let bad = false;
                const cn = entry.getKey();
                for (const ce of this.elmList) {
                    if (bad) break;
                    if (ce instanceof GraphicElm) continue;
                    // does this post intersect elm's bounding box?
                    if (!ce.boundingBox.contains(cn.x, cn.y)) continue;
                    // does this post belong to the elm?
                    const pc = ce.getPostCount();
                    let k: number;
                    for (k = 0; k !== pc; k++) {
                        const p = ce.getPost(k);
                        if (p.x === cn.x && p.y === cn.y) break;
                    }
                    if (k === pc) bad = true;
                }
                if (bad) this.badConnectionList.add(cn);
            }
        }
        this.postCountMap = null;
    }

    // analyze the circuit when something changes, so it can be simulated
    analyzeCircuit(): void {
        if (this.elmList.isEmpty()) {
            this.postDrawList = new Vector<Point>();
            this.badConnectionList = new Vector<Point>();
            return;
        }
        this.stopMessage = null;
        this.stopElm = null;
        this.nodeList = new Vector<CircuitNode>();
        this.postCountMap = new HashMap<Point, number>();

        this.calculateWireClosure();
        this.setGroundNode();

        // allocate nodes and voltage sources
        LabeledNodeElm.resetNodeList();
        this.makeNodeList();

        this.makePostDrawList();
        if (!this.calcWireInfo()) return;
        this.nodeMap = null;

        let vscount = 0;
        this.circuitNonLinear = false;

        // determine if circuit is nonlinear.  also set voltage sources
        for (const ce of this.elmList) {
            if (ce.nonLinear()) this.circuitNonLinear = true;
            const ivs = ce.getVoltageSourceCount();
            for (let j = 0; j !== ivs; j++) {
                this.voltageSources[vscount] = ce;
                ce.setVoltageSource(j, vscount++);
            }
        }
        this.voltageSourceCount = vscount;

        // show resistance in voltage sources if there's only one
        let gotVoltageSource = false;
        this.showResistanceInVoltageSources = true;
        for (const ce of this.elmList) {
            if (ce instanceof VoltageElm) {
                if (gotVoltageSource) this.showResistanceInVoltageSources = false;
                else gotVoltageSource = true;
            }
        }

        this.findUnconnectedNodes();
        if (!this.validateCircuit()) return;

        this.timeStep = this.maxTimeStep;
        try {
            this.stampCircuit();
        } catch (e) {
            CirSim.console(`stampCircuit: ${e}`);
            this.stop('Exception in stampCircuit()', null);
        }
    }

    // populate the matrix as required to simulate the circuit (for all linear elements, at least)
    stampCircuit(): void {
        const matrixSize = this.nodeList.size() - 1 + this.voltageSourceCount;
        const zeros = (n: number) => new Array(n).fill(0);
        this.circuitMatrix = zeros(matrixSize).map(() => zeros(matrixSize));
        this.circuitRightSide = zeros(matrixSize);
        this.nodeVoltages = zeros(this.nodeList.size() - 1);
        if (this.lastNodeVoltages == null || this.lastNodeVoltages.length !== this.nodeVoltages.length)
            this.lastNodeVoltages = zeros(this.nodeList.size() - 1);
        this.origMatrix = zeros(matrixSize).map(() => zeros(matrixSize));
        this.origRightSide = zeros(matrixSize);
        this.circuitMatrixSize = this.circuitMatrixFullSize = matrixSize;
        this.circuitRowInfo = [];
        for (let i = 0; i !== matrixSize; i++) this.circuitRowInfo.push(new RowInfo().init$0());
        this.circuitPermute = zeros(matrixSize);
        this.circuitNeedsMap = false;

        this.connectUnconnectedNodes();

        // stamp linear circuit elements
        for (const ce of this.elmList) {
            ce.setParentList(this.elmList);
            ce.stamp();
        }

        if (!this.simplifyMatrix(matrixSize)) return;

        // check if we called stop()
        if (this.circuitMatrix == null) return;

        // if a matrix is linear, we can do the lu_factor here instead of needing to do it every frame
        if (!this.circuitNonLinear) {
            if (!CirSim.lu_factor(this.circuitMatrix, this.circuitMatrixSize, this.circuitPermute))
                this.stop('Singular matrix!', null);
        }
    }

    // remove rows which only determine a constant
    private simplifyMatrix(matrixSize: number): boolean {
        const matrix = this.circuitMatrix!;
        const info = this.circuitRowInfo;
        for (let i = 0; i !== matrixSize; i++) {
            let qp = -1;
            let qv = 0;
            const re = info[i];
            if (re.lsChanges || re.dropRow || re.rsChanges) continue;
            let rsadd = 0;

            // look for rows that can be removed
            let j: number;
            for (j = 0; j !== matrixSize; j++) {
                const q = matrix[i][j];
                if (info[j].type === RowInfo.ROW_CONST) {
                    // keep a running total of const values that have been removed already
                    rsadd -= info[j].value * q;
                    continue;
                }
                if (q === 0) continue;
                // keep track of first nonzero element that is not ROW_CONST
                if (qp === -1) {
                    qp = j;
                    qv = q;
                    continue;
                }
                // more than one nonzero element?  give up
                break;
            }
            if (j === matrixSize) {
                if (qp === -1) {
                    // probably a singular matrix
                    this.stop('Matrix error', null);
                    return false;
                }
                const elt = info[qp];
                // a row with only one nonzero nonconst entry; that value is a constant
                if (elt.type !== RowInfo.ROW_NORMAL) continue;
                elt.type = RowInfo.ROW_CONST;
                elt.value = (this.circuitRightSide[i] + rsadd) / qv;
                info[i].dropRow = true;
                i = -1; // start over from scratch
            }
        }

        // find size of new matrix
        let nn = 0;
        for (let i = 0; i !== matrixSize; i++) {
            const elt = info[i];
            if (elt.type === RowInfo.ROW_NORMAL) elt.mapCol = nn++;
            else if (elt.type === RowInfo.ROW_CONST) elt.mapCol = -1;
        }

        // make the new, simplified matrix
        const newsize = nn;
        const newmatx: number[][] = [];
        for (let i = 0; i < newsize; i++) newmatx.push(new Array(newsize).fill(0));
        const newrs: number[] = new Array(newsize).fill(0);
        let ii = 0;
        for (let i = 0; i !== matrixSize; i++) {
            const rri = info[i];
            if (rri.dropRow) {
                rri.mapRow = -1;
                continue;
            }
            newrs[ii] = this.circuitRightSide[i];
            rri.mapRow = ii;
            for (let j = 0; j !== matrixSize; j++) {
                const ri = info[j];
                if (ri.type === RowInfo.ROW_CONST) newrs[ii] -= ri.value * matrix[i][j];
                else newmatx[ii][ri.mapCol] += matrix[i][j];
            }
            ii++;
        }

        this.circuitMatrix = newmatx;
        this.circuitRightSide = newrs;
        this.circuitMatrixSize = newsize;
        for (let i = 0; i !== newsize; i++) {
            this.origRightSide[i] = newrs[i];
            for (let j = 0; j !== newsize; j++) this.origMatrix[i][j] = newmatx[i][j];
        }
        this.circuitNeedsMap = true;
        return true;
    }

    stop(s: string, ce: CircuitElm | null): void {
        this.stopMessage = CirSim.LS(s);
        this.circuitMatrix = null;
        this.stopElm = ce;
        this.setSimRunning(false);
        this.analyzeFlag = false;
    }

    // ---- stamping --------------------------------------------------------------------------

    // control voltage source vs with voltage from n1 to n2 (must also call stampVoltageSource())
    stampVCVS(n1: number, n2: number, coef: number, vs: number): void {
        const vn = this.nodeList.size() + vs;
        this.stampMatrix(vn, n1, coef);
        this.stampMatrix(vn, n2, -coef);
    }
    // stamp voltage source vs from n1 to n2; omit v if it is updated in doStep()
    stampVoltageSource(n1: number, n2: number, vs: number, v?: number): void {
        const vn = this.nodeList.size() + vs;
        this.stampMatrix(vn, n1, -1);
        this.stampMatrix(vn, n2, 1);
        if (v === undefined) this.stampRightSide(vn);
        else this.stampRightSide(vn, v);
        this.stampMatrix(n1, vn, 1);
        this.stampMatrix(n2, vn, -1);
    }
    // update voltage source in doStep()
    updateVoltageSource(_n1: number, _n2: number, vs: number, v: number): void {
        this.stampRightSide(this.nodeList.size() + vs, v);
    }
    stampResistor(n1: number, n2: number, r: number): void {
        const r0 = 1 / r;
        if (Number.isNaN(r0) || !Number.isFinite(r0)) throw new Error(`bad resistance ${r}`);
        this.stampConductance(n1, n2, r0);
    }
    stampConductance(n1: number, n2: number, r0: number): void {
        this.stampMatrix(n1, n1, r0);
        this.stampMatrix(n2, n2, r0);
        this.stampMatrix(n1, n2, -r0);
        this.stampMatrix(n2, n1, -r0);
    }
    // current from cn1 to cn2 is equal to voltage from vn1 to vn2, multiplied by g
    stampVCCurrentSource(cn1: number, cn2: number, vn1: number, vn2: number, g: number): void {
        this.stampMatrix(cn1, vn1, g);
        this.stampMatrix(cn2, vn2, g);
        this.stampMatrix(cn1, vn2, -g);
        this.stampMatrix(cn2, vn1, -g);
    }
    stampCurrentSource(n1: number, n2: number, i: number): void {
        this.stampRightSide(n1, -i);
        this.stampRightSide(n2, i);
    }
    // stamp a current source from n1 to n2 depending on current through vs
    stampCCCS(n1: number, n2: number, vs: number, gain: number): void {
        const vn = this.nodeList.size() + vs;
        this.stampMatrix(n1, vn, gain);
        this.stampMatrix(n2, vn, -gain);
    }
    // stamp value x in row i, column j, meaning that a voltage change of dv in node j will
    // increase the current into node i by x dv.  (Unless i or j is a voltage source node.)
    stampMatrix(i: number, j: number, x: number): void {
        if (i > 0 && j > 0) {
            if (this.circuitNeedsMap) {
                i = this.circuitRowInfo[i - 1].mapRow;
                const ri = this.circuitRowInfo[j - 1];
                if (ri.type === RowInfo.ROW_CONST) {
                    this.circuitRightSide[i] -= x * ri.value;
                    return;
                }
                j = ri.mapCol;
            } else {
                i--;
                j--;
            }
            this.circuitMatrix![i][j] += x;
        }
    }
    // with x: stamp x on the right side of row i, an independent current source flowing into
    // node i.  Without x: indicate that the right side of row i changes in doStep().
    stampRightSide(i: number, x?: number): void {
        if (i <= 0) return;
        if (x === undefined) {
            this.circuitRowInfo[i - 1].rsChanges = true;
            return;
        }
        i = this.circuitNeedsMap ? this.circuitRowInfo[i - 1].mapRow : i - 1;
        this.circuitRightSide[i] += x;
    }
    // indicate that the values on the left side of row i change in doStep()
    stampNonLinear(i: number): void {
        if (i > 0) this.circuitRowInfo[i - 1].lsChanges = true;
    }

    // ---- time stepping -------------------------------------------------------------------------

    // we need to calculate wire currents for every iteration if someone is viewing a wire in the
    // scope.  Otherwise we can do it only once per frame.
    private canDelayWireProcessing(): boolean {
        for (let i = 0; i !== this.scopeCount; i++)
            if (this.scopes[i].viewingWire()) return false;
        for (const ce of this.elmList)
            if (ce instanceof ScopeElm && ce.elmScope.viewingWire()) return false;
        return true;
    }

    // Run time steps until shouldStop() says so; it is checked after each completed step.
    private iterate(shouldStop: () => boolean): void {
        const delayWireProcessing = this.canDelayWireProcessing();
        // keep track of iterations completed without convergence issues
        let goodIterations = 100;
        const elms = this.elmList.items;

        for (;;) {
            if (goodIterations >= 3 && this.timeStep < this.maxTimeStep) {
                // things are going well, double the time step
                this.timeStep = Math.min(this.timeStep * 2, this.maxTimeStep);
                this.stampCircuit();
                goodIterations = 0;
            }
            for (const ce of elms) ce.startIteration();
            this.steps++;
            const subiterCount = this.adjustTimeStep && this.timeStep / 2 > this.minTimeStep ? 100 : 5000;
            let subiter: number;
            for (subiter = 0; subiter !== subiterCount; subiter++) {
                this.converged = true;
                this.subIterations = subiter;
                const size = this.circuitMatrixSize;
                const rs = this.circuitRightSide;
                for (let i = 0; i !== size; i++) rs[i] = this.origRightSide[i];
                if (this.circuitNonLinear) {
                    for (let i = 0; i !== size; i++) {
                        const row = this.circuitMatrix![i], orig = this.origMatrix[i];
                        for (let j = 0; j !== size; j++) row[j] = orig[j];
                    }
                }
                for (const ce of elms) ce.doStep();
                if (this.stopMessage != null) return;
                const matrix = this.circuitMatrix;
                if (matrix == null) return;
                for (let j = 0; j !== size; j++) {
                    const row = matrix[j];
                    for (let i = 0; i !== size; i++) {
                        if (!Number.isFinite(row[i])) {
                            this.stop('nan/infinite matrix!', null);
                            return;
                        }
                    }
                }
                if (this.circuitNonLinear) {
                    // stop if converged (elements check for convergence in doStep())
                    if (this.converged && subiter > 0) break;
                    if (!CirSim.lu_factor(matrix, size, this.circuitPermute)) {
                        this.stop('Singular matrix!', null);
                        return;
                    }
                }
                CirSim.lu_solve(matrix, size, this.circuitPermute, rs);
                this.applySolvedRightSide(rs);
                if (!this.circuitNonLinear) break;
            }
            if (subiter === subiterCount) {
                // convergence failed
                goodIterations = 0;
                if (this.adjustTimeStep) this.timeStep /= 2;
                if (this.timeStep < this.minTimeStep || !this.adjustTimeStep) {
                    this.stop('Convergence failed!', null);
                    break;
                }
                // we reduced the timestep.  reset circuit state to the way it was at start of iteration
                this.setNodeVoltages(this.lastNodeVoltages!);
                this.stampCircuit();
                continue;
            }
            if (subiter < 3) goodIterations++;
            else goodIterations = 0;
            this.t += this.timeStep;
            this.timeStepAccum += this.timeStep;
            if (this.timeStepAccum >= this.maxTimeStep) {
                this.timeStepAccum -= this.maxTimeStep;
                this.timeStepCount++;
            }
            for (const ce of elms) ce.stepFinished();
            if (!delayWireProcessing) this.calcWireCurrents();
            for (let i = 0; i !== this.scopeCount; i++) this.scopes[i].timeStep();
            for (const ce of elms)
                if (ce instanceof ScopeElm) ce.stepScope();
            // save last node voltages so we can restart the next iteration if necessary
            const last = this.lastNodeVoltages!;
            for (let i = 0; i !== last.length; i++) last[i] = this.nodeVoltages[i];

            if (shouldStop() || !this.simRunning) break;
        }
        if (delayWireProcessing) this.calcWireCurrents();
    }

    // Advance a fixed number of simulated time steps (headless use).  Returns false if stopped.
    runSteps(count: number): boolean {
        if (this.analyzeFlag || this.dcAnalysisFlag) this.update();
        if (this.circuitMatrix == null || this.elmList.size() === 0) return false;
        this.setupScopes();
        let done = 0;
        this.iterate(() => ++done >= count);
        return this.stopMessage == null;
    }

    // Analyze if needed; the DC operating point needs a second analysis with the flag cleared.
    update(): void {
        if (this.analyzeFlag || this.dcAnalysisFlag) {
            this.analyzeCircuit();
            this.analyzeFlag = false;
        }
        if (this.dcAnalysisFlag) {
            if (this.simRunning && this.circuitMatrix != null) this.runSteps(1);
            this.dcAnalysisFlag = false;
            this.analyzeFlag = true;
        }
    }

    // Wall-clock paced run, as CirSim.runCircuit(): called once per animation frame.
    runFrame(didAnalyze: boolean): void {
        if (this.circuitMatrix == null || this.elmList.size() === 0) {
            this.circuitMatrix = null;
            return;
        }
        const steprate = 160 * this.getIterCount();
        let tm = Date.now();
        let lit = this.lastIterTime;
        if (lit === 0) {
            this.lastIterTime = tm;
            return;
        }
        // Check if we don't need to run simulation (for very slow simulation speeds).
        // If the circuit changed, do at least one iteration to make sure everything is consistent.
        if (1000 >= steprate * (tm - this.lastIterTime) && !didAnalyze) return;
        const timeStepCountAtFrameStart = this.timeStepCount;
        this.iterate(() => {
            tm = Date.now();
            lit = tm;
            // Check whether enough time has elapsed to perform an *additional* iteration
            return (this.timeStepCount - timeStepCountAtFrameStart) * 1000 >= steprate * (tm - this.lastIterTime) ||
                tm - this.lastFrameTime > 500;
        });
        this.lastIterTime = lit;
    }

    // set node voltages given right side found by solving matrix
    private applySolvedRightSide(rs: number[]): void {
        const nodeCount = this.nodeList.size() - 1;
        for (let j = 0; j !== this.circuitMatrixFullSize; j++) {
            const ri = this.circuitRowInfo[j];
            const res = ri.type === RowInfo.ROW_CONST ? ri.value : rs[ri.mapCol];
            if (Number.isNaN(res)) {
                this.converged = false;
                break;
            }
            if (j < nodeCount) {
                this.nodeVoltages[j] = res;
            } else {
                const ji = j - nodeCount;
                this.voltageSources[ji].setCurrent(ji, res);
            }
        }
        this.setNodeVoltages(this.nodeVoltages);
    }

    // set node voltages in each element given an array of node voltages
    private setNodeVoltages(nv: number[]): void {
        for (let j = 0; j !== nv.length; j++) {
            const res = nv[j];
            for (const cnl of this.getCircuitNode(j + 1)!.links) cnl.elm.setNodeVoltage(cnl.num, res);
        }
    }

    // we removed wires from the matrix.  in order to display wire currents, calculate them now.
    private calcWireCurrents(): void {
        for (const wi of this.wireInfoList) {
            let cur = 0;
            const p = wi.wire.getPost(wi.post);
            for (const ce of wi.neighbors!) {
                const n = ce.getNodeAtPoint(p.x, p.y);
                cur += ce.getCurrentIntoNode(n);
            }
            wi.wire.setCurrent(-1, wi.post === 0 ? cur : -cur);
        }
    }

    // factors a matrix into upper and lower triangular matrices by gaussian elimination.
    // ipvt[] returns an integer vector of pivot indices, used in lu_solve()
    static lu_factor(a: number[][], n: number, ipvt: number[]): boolean {
        // a row of all zeroes means a singular matrix
        for (let i = 0; i !== n; i++) {
            let allZeros = true;
            for (let j = 0; j !== n; j++)
                if (a[i][j] !== 0) { allZeros = false; break; }
            if (allZeros) return false;
        }
        // use Crout's method; loop through the columns
        for (let j = 0; j !== n; j++) {
            // calculate upper triangular elements for this column
            for (let i = 0; i !== j; i++) {
                const ai = a[i];
                let q = ai[j];
                for (let k = 0; k !== i; k++) q -= ai[k] * a[k][j];
                ai[j] = q;
            }
            // calculate lower triangular elements for this column
            let largest = 0;
            let largestRow = -1;
            for (let i = j; i !== n; i++) {
                const ai = a[i];
                let q = ai[j];
                for (let k = 0; k !== j; k++) q -= ai[k] * a[k][j];
                ai[j] = q;
                const x = Math.abs(q);
                if (x >= largest) {
                    largest = x;
                    largestRow = i;
                }
            }
            // pivoting
            if (j !== largestRow) {
                const tmp = a[largestRow];
                a[largestRow] = a[j];
                a[j] = tmp;
            }
            // keep track of row interchanges
            ipvt[j] = largestRow;
            // avoid zeros
            if (a[j][j] === 0.0) a[j][j] = 1e-18;
            if (j !== n - 1) {
                const mult = 1.0 / a[j][j];
                for (let i = j + 1; i !== n; i++) a[i][j] *= mult;
            }
        }
        return true;
    }

    // Solves the set of n linear equations using a LU factorization previously performed by
    // lu_factor.  On input, b is the right hand side, and on output, contains the solution.
    static lu_solve(a: number[][], n: number, ipvt: number[], b: number[]): void {
        // find first nonzero b element
        let i: number;
        for (i = 0; i !== n; i++) {
            const row = ipvt[i];
            const swap = b[row];
            b[row] = b[i];
            b[i] = swap;
            if (swap !== 0) break;
        }
        const bi = i++;
        for (; i < n; i++) {
            const row = ipvt[i];
            let tot = b[row];
            b[row] = b[i];
            // forward substitution using the lower triangular matrix
            for (let j = bi; j < i; j++) tot -= a[i][j] * b[j];
            b[i] = tot;
        }
        for (i = n - 1; i >= 0; i--) {
            let tot = b[i];
            // back-substitution using the upper triangular matrix
            for (let j = i + 1; j !== n; j++) tot -= a[i][j] * b[j];
            b[i] = tot / a[i][i];
        }
    }

    static invertMatrix(a: number[][], n: number): void {
        const ipvt: number[] = new Array(n).fill(0);
        CirSim.lu_factor(a, n, ipvt);
        const b: number[] = new Array(n).fill(0);
        const inva: number[][] = [];
        for (let i = 0; i !== n; i++) inva.push(new Array(n).fill(0));
        // solve for each column of identity matrix
        for (let i = 0; i !== n; i++) {
            b.fill(0);
            b[i] = 1;
            CirSim.lu_solve(a, n, ipvt, b);
            for (let j = 0; j !== n; j++) inva[j][i] = b[j];
        }
        // return in original matrix
        for (let i = 0; i !== n; i++)
            for (let j = 0; j !== n; j++) a[i][j] = inva[i][j];
    }

    // ---- circuit files -----------------------------------------------------------------------

    resetAction(): void {
        this.analyzeFlag = true;
        if (this.t === 0) this.setSimRunning(true);
        this.t = this.timeStepAccum = 0;
        this.timeStepCount = 0;
        for (const ce of this.elmList) ce.reset();
        for (let i = 0; i !== this.scopeCount; i++) this.scopes[i].resetGraph$1(true);
        this.repaint();
    }

    clear(): void {
        for (const ce of this.elmList) ce.delete();
        this.t = this.timeStepAccum = 0;
        this.timeStepCount = 0;
        this.elmList.clear();
        this.hintType = -1;
        this.maxTimeStep = 5e-6;
        this.minTimeStep = 50e-12;
        this.dotsCheckItem.setState(false);
        this.smallGridCheckItem.setState(false);
        this.powerCheckItem.setState(false);
        this.voltsCheckItem.setState(true);
        this.showValuesCheckItem.setState(true);
        this.setGrid();
        this.speedBar.setValue(117);
        this.currentBar.setValue(50);
        this.powerBar.setValue(50);
        CircuitElm.voltageRange = 5;
        this.scopeCount = 0;
        this.adjustables.clear();
        this.lastIterTime = 0;
        this.circuitMatrix = null;
        this.stopMessage = null;
        this.stopElm = null;
        this.readErrors = [];
    }

    // Parse a circuit in the text dump format
    readCircuit(text: string, flags = 0): void {
        if ((flags & CirSim.RC_RETAIN) === 0) this.clear();
        const subs = (flags & CirSim.RC_SUBCIRCUITS) !== 0;
        for (const line of text.split(/\r\n|\n|\r/)) {
            const st = new StringTokenizer().init$2(line, ' +\t\n\r\f');
            if (!st.hasMoreTokens()) continue;
            const type = st.nextToken$0();
            let tint = type.charCodeAt(0);
            const ch = type[0];
            try {
                if (subs && ch !== '.') continue;
                if (ch === 'o') {
                    const sc = new Scope().init$1(this);
                    sc.position = this.scopeCount;
                    sc.undump(st);
                    this.scopes[this.scopeCount++] = sc;
                    continue;
                }
                if (ch === 'h') {
                    this.hintType = parseInt(st.nextToken$0());
                    this.hintItem1 = parseInt(st.nextToken$0());
                    this.hintItem2 = parseInt(st.nextToken$0());
                    continue;
                }
                if (ch === '$') { this.readOptions(st); continue; }
                if (ch === '!') { CustomLogicModel.undumpModel(st); continue; }
                // ignore afilter-specific stuff
                if (ch === '%' || ch === '?' || ch === 'B') continue;
                // if first character is a digit then parse the type as a number
                if (tint >= 48 && tint <= 57) tint = this.intToken(type);
                if (tint === 34) { DiodeModel.undumpModel(st); continue; }
                if (tint === 32) { TransistorModel.undumpModel(st); continue; }
                if (tint === 38) {
                    const adj = new Adjustable().init$StringTokenizer_CirSim(st, this);
                    // a slider whose element index no longer exists has nothing to control
                    if (adj.elm != null) this.adjustables.add(adj);
                    continue;
                }
                if (ch === '.') { CustomCompositeModel.undumpModel(st); continue; }
                const x1 = this.intToken(st.nextToken$0());
                const y1 = this.intToken(st.nextToken$0());
                const x2 = this.intToken(st.nextToken$0());
                const y2 = this.intToken(st.nextToken$0());
                const f = this.intToken(st.nextToken$0());
                const ce = createCe(tint, x1, y1, x2, y2, f, st);
                if (ce == null) {
                    CirSim.console(`unrecognized dump type: ${type}`);
                    this.readErrors.push(`${line}: unrecognized dump type`);
                    continue;
                }
                ce.setPoints();
                this.elmList.add(ce);
            } catch (e) {
                CirSim.console(`exception while undumping ${e}`);
                this.readErrors.push(`${line}: ${e}`);
            }
        }
        if ((flags & CirSim.RC_RETAIN) === 0)
            for (const adj of this.adjustables)
                if (adj.elm != null) adj.createSlider$1(this);
        if ((flags & CirSim.RC_SUBCIRCUITS) !== 0) this.updateModels();
        this.needAnalyze();
    }

    private intToken(s: string): number {
        if (!/^[+-]?\d+$/.test(s)) throw new Error(`NumberFormatException: ${s}`);
        return parseInt(s, 10);
    }

    private readOptions(st: StringTokenizer): void {
        const flags = this.intToken(st.nextToken$0());
        this.dotsCheckItem.setState((flags & 1) !== 0);
        this.smallGridCheckItem.setState((flags & 2) !== 0);
        this.voltsCheckItem.setState((flags & 4) === 0);
        this.powerCheckItem.setState((flags & 8) === 8);
        this.showValuesCheckItem.setState((flags & 16) === 0);
        this.adjustTimeStep = (flags & 64) !== 0;
        this.maxTimeStep = this.timeStep = parseFloat(st.nextToken$0());
        const sp = parseFloat(st.nextToken$0());
        this.speedBar.setValue((Math.log(10 * sp) * 24 + 61.5) | 0);
        this.currentBar.setValue(this.intToken(st.nextToken$0()));
        CircuitElm.voltageRange = parseFloat(st.nextToken$0());
        try {
            this.powerBar.setValue(this.intToken(st.nextToken$0()));
            const m = parseFloat(st.nextToken$0());
            if (Number.isNaN(m)) throw new Error('minTimeStep');
            this.minTimeStep = m;
        } catch {
            // older files stop before these fields
        }
        this.setGrid();
    }

    // Serialize to the text dump format
    dumpCircuit(): string {
        CustomLogicModel.clearDumpedFlags();
        CustomCompositeModel.clearDumpedFlags();
        DiodeModel.clearDumpedFlags();
        TransistorModel.clearDumpedFlags();
        let f = this.dotsCheckItem.getState() ? 1 : 0;
        f |= this.smallGridCheckItem.getState() ? 2 : 0;
        f |= this.voltsCheckItem.getState() ? 0 : 4;
        f |= this.powerCheckItem.getState() ? 8 : 0;
        f |= this.showValuesCheckItem.getState() ? 0 : 16;
        // 32 = linear scale in afilter
        f |= this.adjustTimeStep ? 64 : 0;
        let dump = `$ ${f} ${this.maxTimeStep} ${this.getIterCount()} ${this.currentBar.getValue()} ${CircuitElm.voltageRange} ` +
            `${this.powerBar.getValue()} ${this.minTimeStep}\n`;
        for (const ce of this.elmList) {
            const m = ce.dumpModel();
            if (m != null && m.length !== 0) dump += m + '\n';
            dump += ce.dump() + '\n';
        }
        for (let i = 0; i !== this.scopeCount; i++) {
            const d = this.scopes[i].dump();
            if (d != null) dump += d + '\n';
        }
        for (const adj of this.adjustables) dump += `38 ${adj.dump()}\n`;
        if (this.hintType !== -1) dump += `h ${this.hintType} ${this.hintItem1} ${this.hintItem2}\n`;
        return dump;
    }

    // ---- scopes ----------------------------------------------------------------------------------

    setupScopes(): void {
        let pos = -1;
        // check scopes to make sure the elements still exist, and remove unused scopes/columns
        for (let i = 0; i < this.scopeCount; i++) {
            if (this.scopes[i].needToRemove()) {
                for (let j = i; j !== this.scopeCount; j++) this.scopes[j] = this.scopes[j + 1];
                this.scopeCount--;
                i--;
                continue;
            }
            if (this.scopes[i].position > pos + 1) this.scopes[i].position = pos + 1;
            pos = this.scopes[i].position;
        }
        while (this.scopeCount > 0 && this.scopes[this.scopeCount - 1].getElm() == null) this.scopeCount--;
        const h = this.canvasHeight - this.circuitArea.height;
        pos = 0;
        for (let i = 0; i !== this.scopeCount; i++) this.scopeColCount[i] = 0;
        for (let i = 0; i !== this.scopeCount; i++) {
            pos = Math.max(this.scopes[i].position, pos);
            this.scopeColCount[this.scopes[i].position]++;
        }
        const colct = pos + 1;
        let iw = this.infoWidth;
        if (colct <= 2) iw = (iw * 3 / 2) | 0;
        let w = ((this.canvasWidth - iw) / colct) | 0;
        const marg = 10;
        if (w < marg * 2) w = marg * 2;
        pos = -1;
        let colh = 0, row = 0, speed = 0;
        for (let i = 0; i !== this.scopeCount; i++) {
            const s = this.scopes[i];
            if (s.position > pos) {
                pos = s.position;
                colh = (h / this.scopeColCount[pos]) | 0;
                row = 0;
                speed = s.speed;
            }
            s.stackCount = this.scopeColCount[pos];
            if (s.speed !== speed) {
                s.speed = speed;
                s.resetGraph$0();
            }
            const r = new Rectangle().init$4(pos * w, this.canvasHeight - h + colh * row, w - marg, colh);
            row++;
            if (s.rect == null || r.x !== s.rect.x || r.y !== s.rect.y || r.width !== s.rect.width || r.height !== s.rect.height)
                s.setRect(r);
        }
    }

    // ---- results -----------------------------------------------------------------------------------

    // voltage and current of each element after the last step; convenient for scripts and tests
    getNodeVoltage(n: number): number { return n === 0 ? 0 : this.nodeVoltages[n - 1]; }
}

