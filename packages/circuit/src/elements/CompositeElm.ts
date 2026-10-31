// Circuit element made up of a composition of other circuit elements
// Using this will be (relatively) inefficient in terms of simulation performance because
// all the internal workings of the element are simulated from the individual components.
// However, it may allow some types of components to be more quickly programed in to the simulator
// than writing each component from scratch.
//
// It also provides a path to allow user created circuits to be 
// re-imported in to the simuation as new circuit elements.
// Instatiations should:
// - Set the variable "diagonal" in the constructors
// - Override constructors to set up the elements posts/leads etc. and configure the contents of the CompositeElm
// - Override getDumpType, dump, draw, getInfo, setPoints, canViewInScope

// Changed 2026-10-31: converted from CompositeElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, CircuitNode, CircuitNodeLink, CustomLogicModel, HashMap, Point, StringTokenizer, Vector, newArray, parseJInt } from '../core/internal';

export abstract class CompositeElm extends CircuitElm {
    // need to use escape() instead of converting spaces to _'s so composite elements can be nested
    declare FLAG_ESCAPE: number;
    // list of elements contained in this subcircuit
    declare compElmList: Vector<CircuitElm>;
    // list of nodes, mapping each one to a list of elements that reference that node
    declare compNodeList: Vector<CircuitNode>;
    declare numPosts: number;
    declare numNodes: number;
    declare posts: Point[];
    declare voltageSources: Vector<VoltageSourceRecord>;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.numPosts = 0;
        this.numNodes = 0;
        return this;
    }
    init$5(xa: number, ya: number, xb: number, yb: number, f: number): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.numPosts = 0;
        this.numNodes = 0;
        return this;
    }
    init$4(xx: number, yy: number, s: string, externalNodes: number[]): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.numPosts = 0;
        this.numNodes = 0;
        this.loadComposite(null, s, externalNodes);
        this.allocNodes();
        return this;
    }
    init$8(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer, s: string, externalNodes: number[]): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.numPosts = 0;
        this.numNodes = 0;
        this.loadComposite(st, s, externalNodes);
        this.allocNodes();
        return this;
    }
    useEscape(): boolean {
        return (this.flags & this.FLAG_ESCAPE) !== 0;
    }
    loadComposite(stIn: StringTokenizer, model: string, externalNodes: number[]): void {
        let compNodeHash: HashMap<number,CircuitNode> = new HashMap();
        let modelLinet: StringTokenizer = new StringTokenizer().init$2(model, "\r");
        let cn: CircuitNode = null as any;
        let cnLink: CircuitNodeLink = null as any;
        let vsRecord: VoltageSourceRecord = null as any;
        this.compElmList = new Vector();
        this.compNodeList = new Vector();
        this.voltageSources = new Vector();
        // Build compElmList and compNodeHash from input string
        while (modelLinet.hasMoreTokens()) {
            let line: string = modelLinet.nextToken$0();
            let stModel: StringTokenizer = new StringTokenizer().init$2(line, " +\t\n\r\f");
            let ceType: string = stModel.nextToken$0();
            let newce: CircuitElm = CirSim.constructElement(ceType, 0, 0);
            if (stIn != null) {
                let tint: number = newce.getDumpType();
                let dumpedCe: string = stIn.nextToken$0();
                if (this.useEscape()) {
                    dumpedCe = CustomLogicModel.unescape(dumpedCe);
                }
                let stCe: StringTokenizer = new StringTokenizer().init$2(dumpedCe, this.useEscape() ? " " : "_");
                let flags: number = parseJInt(stCe.nextToken$0());
                newce = CirSim.createCe(tint, 0, 0, 0, 0, flags, stCe);
            }
            this.compElmList.add(newce);
            let thisPost: number = 0;
            while (stModel.hasMoreTokens()) {
                let nodeOfThisPost: number = parseJInt(stModel.nextToken$0());
                // node = 0 means ground
                if (nodeOfThisPost === 0) {
                    newce.setNode(thisPost, 0);
                    newce.setNodeVoltage(thisPost, 0);
                    thisPost++;
                    continue;
                }
                cnLink = new CircuitNodeLink().init$0();
                cnLink.num = thisPost;
                cnLink.elm = newce;
                if (!compNodeHash.containsKey(nodeOfThisPost)) {
                    cn = new CircuitNode().init$0();
                    cn.links.add(cnLink);
                    compNodeHash.put(nodeOfThisPost, cn);
                } else {
                    cn = compNodeHash.get(nodeOfThisPost);
                    cn.links.add(cnLink);
                }
                thisPost++;
            }
        }
        // Flatten compNodeHash in to compNodeList
        this.numPosts = externalNodes.length;
        for (let i: number = 0; i < externalNodes.length; i++) {
            // External Nodes First
            if (compNodeHash.containsKey(externalNodes[i])) {
                this.compNodeList.add(compNodeHash.get(externalNodes[i]));
                compNodeHash.remove(externalNodes[i]);
            } else {
                throw new Error();
            }
        }
        for (const entry of compNodeHash.entrySet()) {
            let key: number = entry.getKey();
            this.compNodeList.add(compNodeHash.get(key));
        }
        // allocate more nodes for sub-elements' internal nodes
        for (let i: number = 0; i !== this.compElmList.size(); i++) {
            let ce: CircuitElm = this.compElmList.get(i);
            let inodes: number = ce.getInternalNodeCount();
            for (let j: number = 0; j !== inodes; j++) {
                cnLink = new CircuitNodeLink().init$0();
                cnLink.num = j + ce.getPostCount();
                cnLink.elm = ce;
                cn = new CircuitNode().init$0();
                cn.links.add(cnLink);
                this.compNodeList.add(cn);
            }
        }
        this.numNodes = this.compNodeList.size();
        //	CirSim.console("Dumping compNodeList");
        //	for (int i = 0; i < numNodes; i++) {
        //	    CirSim.console("New node" + i + " Size of links:" + compNodeList.get(i).links.size());
        //	}
        this.posts = newArray(null, this.numPosts);
        // Enumerate voltage sources
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            let cnt: number = this.compElmList.get(i).getVoltageSourceCount();
            for (let j: number = 0; j < cnt; j++) {
                vsRecord = new VoltageSourceRecord().init$0();
                vsRecord.elm = this.compElmList.get(i);
                vsRecord.vsNumForElement = j;
                this.voltageSources.add(vsRecord);
            }
        }
        // dump new circuits with escape()
        this.flags |= this.FLAG_ESCAPE;
    }
    nonLinear(): boolean {
        return true;
        // Lets assume that any useful composite elements are
        // non-linear
    }
    dump(): string {
        let dumpStr: string = super.dump();
        dumpStr += this.dumpElements$0();
        return dumpStr;
    }
    dumpElements$0(): string {
        let dumpStr: string = "";
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            let tstring: string = this.compElmList.get(i).dump();
            tstring = tstring.replace(new RegExp("[A-Za-z0-9]+ 0 0 0 0 "), "");
            // remove unused tint x1 y1 x2 y2 coords for internal components
            dumpStr += " " + CustomLogicModel.escape(tstring);
        }
        return dumpStr;
    }
    // dump subset of elements (some of them may not have any state, and/or may be very long, so we avoid dumping them for brevity)
    dumpWithMask(mask: number): string {
        let dumpStr: string = super.dump();
        return dumpStr + this.dumpElements$1(mask);
    }
    dumpElements$1(mask: number): string {
        let dumpStr: string = "";
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            if ((mask & (1 << i)) === 0) {
                continue;
            }
            let tstring: string = this.compElmList.get(i).dump();
            tstring = tstring.replace(new RegExp("[A-Za-z0-9]+ 0 0 0 0 "), "");
            // remove unused tint x1 y1 x2 y2 coords for internal components
            dumpStr += " " + CustomLogicModel.escape(tstring);
        }
        return dumpStr;
    }
    // are n1 and n2 connected internally somehow?
    getConnection(n1: number, n2: number): boolean {
        let connectedNodes: Vector<number> = new Vector();
        // keep list of nodes connected to n1
        connectedNodes.add(n1);
        let i: number = 0;
        for (i = 0; i < connectedNodes.size(); i++) {
            // next node in list
            let n: number = connectedNodes.get(i);
            if (n === n2) {
                return true;
            }
            // find all elements connected to n
            let cnLinks: Vector<CircuitNodeLink> = this.compNodeList.get(n).links;
            for (let j: number = 0; j < cnLinks.size(); j++) {
                let link: CircuitNodeLink = cnLinks.get(j);
                let lelm: CircuitElm = link.elm;
                // loop through all other nodes this element has
                for (let k: number = 0; k !== lelm.getConnectionNodeCount(); k++) {
                    if (k !== link.num && lelm.getConnection(link.num, k)) {
                        let kn: number = lelm.getConnectionNode(k);
                        if (kn === 0) {
                            return true;
                        }
                        let m: number = 0;
                        // find local node number (kn is global) and add it to list
                        for (m = 0; m !== this.nodes.length; m++) {
                            if (this.nodes[m] === kn && !connectedNodes.contains(m)) {
                                connectedNodes.add(m);
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    // is n1 connected to ground somehow?
    hasGroundConnection(n1: number): boolean {
        let connectedNodes: Vector<number> = new Vector();
        // keep list of nodes connected to n1
        connectedNodes.add(n1);
        let i: number = 0;
        for (i = 0; i < connectedNodes.size(); i++) {
            // next node in list
            let n: number = connectedNodes.get(i);
            // find all elements connected to n
            let cnLinks: Vector<CircuitNodeLink> = this.compNodeList.get(n).links;
            for (let j: number = 0; j < cnLinks.size(); j++) {
                let link: CircuitNodeLink = cnLinks.get(j);
                let lelm: CircuitElm = link.elm;
                if (lelm.hasGroundConnection(link.num)) {
                    return true;
                }
                // loop through all other nodes this element has
                for (let k: number = 0; k !== lelm.getConnectionNodeCount(); k++) {
                    if (k !== link.num && lelm.getConnection(link.num, k)) {
                        let kn: number = lelm.getConnectionNode(k);
                        let m: number = 0;
                        // find local node number (kn is global) and add it to list
                        for (m = 0; m !== this.nodes.length; m++) {
                            if (this.nodes[m] === kn && !connectedNodes.contains(m)) {
                                connectedNodes.add(m);
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    reset(): void {
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            this.compElmList.get(i).reset();
        }
    }
    getPostCount(): number {
        return this.numPosts;
    }
    getInternalNodeCount(): number {
        return this.numNodes - this.numPosts;
    }
    getPost(n: number): Point {
        return this.posts[n];
    }
    setPost$2(n: number, p: Point): void {
        this.posts[n] = p;
    }
    setPost$3(n: number, x: number, y: number): void {
        this.posts[n].x = x;
        this.posts[n].y = y;
    }
    getPower(): number {
        let power: number = 0;
        power = 0;
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            power += this.compElmList.get(i).getPower();
        }
        return power;
    }
    stamp(): void {
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            let ce: CircuitElm = this.compElmList.get(i);
            ce.setParentList(this.compElmList);
            ce.stamp();
        }
    }
    startIteration(): void {
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            this.compElmList.get(i).startIteration();
        }
    }
    doStep(): void {
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            this.compElmList.get(i).doStep();
        }
    }
    stepFinished(): void {
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            this.compElmList.get(i).stepFinished();
        }
    }
    // called to set node p (local to this element) to equal n (global)
    setNode(p: number, n: number): void {
        // nodes[p] = n
        let cnLinks: Vector<CircuitNodeLink> = null as any;
        super.setNode(p, n);
        cnLinks = this.compNodeList.get(p).links;
        // call setNode() for all elements that use that node
        for (let i: number = 0; i < cnLinks.size(); i++) {
            cnLinks.get(i).elm.setNode(cnLinks.get(i).num, n);
        }
    }
    setNodeVoltage(n: number, c: number): void {
        // volts[n] = c;
        let cnLinks: Vector<CircuitNodeLink> = null as any;
        super.setNodeVoltage(n, c);
        cnLinks = this.compNodeList.get(n).links;
        for (let i: number = 0; i < cnLinks.size(); i++) {
            cnLinks.get(i).elm.setNodeVoltage(cnLinks.get(i).num, c);
        }
        this.volts[n] = c;
    }
    canViewInScope(): boolean {
        return false;
    }
    delete(): void {
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            this.compElmList.get(i).delete();
        }
        super.delete();
    }
    getVoltageSourceCount(): number {
        return this.voltageSources.size();
    }
    // Find the component with the nth voltage
    // and set the
    // appropriate source in that component
    setVoltageSource(n: number, v: number): void {
        // voltSource(n) = v;
        let vsr: VoltageSourceRecord = null as any;
        vsr = this.voltageSources.get(n);
        vsr.elm.setVoltageSource(vsr.vsNumForElement, v);
        vsr.vsNode = v;
    }
    setCurrent(vsn: number, c: number): void {
        for (let i: number = 0; i < this.voltageSources.size(); i++) {
            if (this.voltageSources.get(i).vsNode === vsn) {
                this.voltageSources.get(i).elm.setCurrent(vsn, c);
            }
        }
    }
    getCurrentIntoNode(n: number): number {
        let c: number = 0;
        let cnLinks: Vector<CircuitNodeLink> = null as any;
        cnLinks = this.compNodeList.get(n).links;
        for (let i: number = 0; i < cnLinks.size(); i++) {
            c += cnLinks.get(i).elm.getCurrentIntoNode(cnLinks.get(i).num);
        }
        return c;
    }
}
Object.assign(CompositeElm.prototype, { "FLAG_ESCAPE": 1, "compElmList": null, "compNodeList": null, "numPosts": 0, "numNodes": 0, "posts": null, "voltageSources": null });

export class VoltageSourceRecord {
    declare vsNumForElement: number;
    declare vsNode: number;
    declare elm: CircuitElm;
    init$0(): this {
        return this;
    }
    constructor() {}
}
Object.assign(VoltageSourceRecord.prototype, { "vsNumForElement": 0, "vsNode": 0, "elm": null });
