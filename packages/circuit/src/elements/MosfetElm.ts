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

// Changed 2026-10-31: converted from MosfetElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CirSim, CircuitElm, Color, Diode, EditInfo, Graphics, Point, Polygon, StringTokenizer, idiv, newArray, parseJDouble } from '../core/internal';

export class MosfetElm extends CircuitElm {
    declare pnp: number;
    declare FLAG_PNP: number;
    declare FLAG_SHOWVT: number;
    declare FLAG_DIGITAL: number;
    declare FLAG_FLIP: number;
    declare FLAG_HIDE_BULK: number;
    declare FLAG_BODY_DIODE: number;
    declare FLAG_BODY_TERMINAL: number;
    declare FLAGS_GLOBAL: number;
    declare bodyTerminal: number;
    declare vt: number;
    // beta = 1/(RdsON*(Vgs-Vt))
    declare beta: number;
    static globalFlags: number = 0;
    declare diodeB1: Diode;
    declare diodeB2: Diode;
    declare diodeCurrent1: number;
    declare diodeCurrent2: number;
    declare bodyCurrent: number;
    declare curcount_body1: number;
    declare curcount_body2: number;
    static lastBeta: number = 0;
    init$3(xx: number, yy: number, pnpflag: boolean): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.FLAG_PNP = 1;
        this.FLAG_SHOWVT = 2;
        this.FLAG_DIGITAL = 4;
        this.FLAG_FLIP = 8;
        this.FLAG_HIDE_BULK = 16;
        this.FLAG_BODY_DIODE = 32;
        this.FLAG_BODY_TERMINAL = 64;
        this.FLAGS_GLOBAL = (this.FLAG_HIDE_BULK | this.FLAG_DIGITAL);
        this.mode = 0;
        this.gm = 0;
        this.pnp = (pnpflag) ? -1 : 1;
        this.flags = (pnpflag) ? this.FLAG_PNP : 0;
        this.flags |= this.FLAG_BODY_DIODE;
        this.noDiagonal = true;
        this.setupDiodes();
        this.beta = this.getDefaultBeta();
        this.vt = this.getDefaultThreshold();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.FLAG_PNP = 1;
        this.FLAG_SHOWVT = 2;
        this.FLAG_DIGITAL = 4;
        this.FLAG_FLIP = 8;
        this.FLAG_HIDE_BULK = 16;
        this.FLAG_BODY_DIODE = 32;
        this.FLAG_BODY_TERMINAL = 64;
        this.FLAGS_GLOBAL = (this.FLAG_HIDE_BULK | this.FLAG_DIGITAL);
        this.mode = 0;
        this.gm = 0;
        this.pnp = ((f & this.FLAG_PNP) !== 0) ? -1 : 1;
        this.noDiagonal = true;
        this.setupDiodes();
        this.vt = this.getDefaultThreshold();
        this.beta = this.getBackwardCompatibilityBeta();
        try {
            this.vt = parseJDouble(st.nextToken$0());
            this.beta = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        MosfetElm.globalFlags = this.flags & (this.FLAGS_GLOBAL);
        this.allocNodes();
        // make sure volts[] has the right number of elements when hasBodyTerminal() is true
        return this;
    }
    // set up body diodes
    setupDiodes(): void {
        // diode from node 1 to body terminal
        this.diodeB1 = new Diode().init$1(CircuitElm.sim);
        this.diodeB1.setupForDefaultModel();
        // diode from node 2 to body terminal
        this.diodeB2 = new Diode().init$1(CircuitElm.sim);
        this.diodeB2.setupForDefaultModel();
    }
    getDefaultThreshold(): number {
        return 1.5;
    }
    // default beta for new elements
    getDefaultBeta(): number {
        return MosfetElm.lastBeta === 0 ? this.getBackwardCompatibilityBeta() : MosfetElm.lastBeta;
    }
    // default for elements in old files with no configurable beta.  JfetElm overrides this.
    // Not sure where this value came from, but the ZVP3306A has a beta of about .027.  Power MOSFETs have much higher betas (like 80 or more)
    getBackwardCompatibilityBeta(): number {
        return .02;
    }
    nonLinear(): boolean {
        return true;
    }
    drawDigital(): boolean {
        return (this.flags & this.FLAG_DIGITAL) !== 0;
    }
    showBulk(): boolean {
        return (this.flags & (this.FLAG_DIGITAL | this.FLAG_HIDE_BULK)) === 0;
    }
    hasBodyTerminal(): boolean {
        return (this.flags & this.FLAG_BODY_TERMINAL) !== 0 && this.doBodyDiode();
    }
    doBodyDiode(): boolean {
        return (this.flags & this.FLAG_BODY_DIODE) !== 0 && this.showBulk();
    }
    reset(): void {
        this.lastv1 = this.lastv2 = this.volts[0] = this.volts[1] = this.volts[2] = this.curcount = 0;
        this.diodeB1.reset();
        this.diodeB2.reset();
        if (this.doBodyDiode()) {
            this.volts[this.bodyTerminal] = 0;
        }
    }
    dump(): string {
        return super.dump() + " " + this.vt + " " + this.beta;
    }
    getDumpType(): number {
        return 102;
    }
    declare hs: number;
    draw(g: Graphics): void {
        // pick up global flags changes
        if ((this.flags & this.FLAGS_GLOBAL) !== MosfetElm.globalFlags) {
            this.setPoints();
        }
        this.setBbox$3(this.point1, this.point2, this.hs);
        // draw source/drain terminals
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.src[0], this.src[1]);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.drn[0], this.drn[1]);
        // draw line connecting source and drain
        let segments: number = 6;
        let i: number = 0;
        this.setPowerColor$Graphics_bool(g, true);
        let power: boolean = CircuitElm.sim.powerCheckItem.getState();
        let segf: number = 1. / segments;
        let enhancement: boolean = this.vt > 0 && this.showBulk();
        for (i = 0; i !== segments; i++) {
            if ((i === 1 || i === 4) && enhancement) {
                continue;
            }
            let v: number = this.volts[1] + (this.volts[2] - this.volts[1]) * i / segments;
            if (!power) {
                this.setVoltageColor(g, v);
            }
            this.interpPoint$Point_Point_Point_dbl(this.src[1], this.drn[1], CircuitElm.ps1, i * segf);
            this.interpPoint$Point_Point_Point_dbl(this.src[1], this.drn[1], CircuitElm.ps2, (i + 1) * segf);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
        }
        // draw little extensions of that line
        if (!power) {
            this.setVoltageColor(g, this.volts[1]);
        }
        CircuitElm.drawThickLine$3(g, this.src[1], this.src[2]);
        if (!power) {
            this.setVoltageColor(g, this.volts[2]);
        }
        CircuitElm.drawThickLine$3(g, this.drn[1], this.drn[2]);
        // draw bulk connection
        if (this.showBulk()) {
            this.setVoltageColor(g, this.volts[this.bodyTerminal]);
            if (!this.hasBodyTerminal()) {
                CircuitElm.drawThickLine$3(g, this.pnp === -1 ? this.drn[0] : this.src[0], this.body[0]);
            }
            CircuitElm.drawThickLine$3(g, this.body[0], this.body[1]);
        }
        // draw arrow
        if (!this.drawDigital()) {
            this.setVoltageColor(g, this.volts[this.bodyTerminal]);
            g.fillPolygon(this.arrowPoly);
        }
        if (power) {
            g.setColor(Color.gray);
        }
        // draw gate
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.gate[1]);
        CircuitElm.drawThickLine$3(g, this.gate[0], this.gate[2]);
        if (this.drawDigital() && this.pnp === -1) {
            CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, this.pcircler);
        }
        if ((this.flags & this.FLAG_SHOWVT) !== 0) {
            let s: string = "" + (this.vt * this.pnp);
            g.setColor(CircuitElm.whiteColor);
            g.setFont(CircuitElm.unitsFont);
            this.drawCenteredText(g, s, this.x2 + 2, this.y2, false);
        }
        this.curcount = this.updateDotCount$2(-this.ids, this.curcount);
        this.drawDots(g, this.src[0], this.src[1], this.curcount);
        this.drawDots(g, this.src[1], this.drn[1], this.curcount);
        this.drawDots(g, this.drn[1], this.drn[0], this.curcount);
        if (this.showBulk()) {
            this.curcount_body1 = this.updateDotCount$2(this.diodeCurrent1, this.curcount_body1);
            this.curcount_body2 = this.updateDotCount$2(this.diodeCurrent2, this.curcount_body2);
            this.drawDots(g, this.src[0], this.body[0], -this.curcount_body1);
            this.drawDots(g, this.body[0], this.drn[0], this.curcount_body2);
        }
        // label pins when highlighted
        if (this.needsHighlight() || CircuitElm.sim.dragElm === this) {
            g.setColor(Color.white);
            g.setFont(CircuitElm.unitsFont);
            // make fiddly adjustments to pin label locations depending on orientation
            let dsx: number = CircuitElm.sign$1(this.dx);
            let dsy: number = CircuitElm.sign$1(this.dy);
            let dsyn: number = this.dy === 0 ? 0 : 1;
            g.drawString("G", this.gate[1].x - (this.dx < 0 ? -2 : 12), this.gate[1].y + ((this.dy > 0) ? -5 : 12));
            g.drawString(this.pnp === -1 ? "D" : "S", this.src[0].x - 3 + 9 * (dsx - dsyn * this.pnp), this.src[0].y + 4);
            g.drawString(this.pnp === -1 ? "S" : "D", this.drn[0].x - 3 + 9 * (dsx - dsyn * this.pnp), this.drn[0].y + 4);
            if (this.hasBodyTerminal()) {
                g.drawString("B", this.body[0].x - 3 + 9 * (dsx - dsyn * this.pnp), this.body[0].y + 4);
            }
        }
        this.drawPosts(g);
    }
    // post 0 = gate, 1 = source for NPN, 2 = drain for NPN, 3 = body (if present)
    // for PNP, 1 is drain, 2 is source
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.src[0] : (n === 2) ? this.drn[0] : this.body[0];
    }
    getCurrent(): number {
        return this.ids;
    }
    getPower(): number {
        return this.ids * (this.volts[2] - this.volts[1]) - this.diodeCurrent1 * (this.volts[1] - this.volts[this.bodyTerminal]) - this.diodeCurrent2 * (this.volts[2] - this.volts[this.bodyTerminal]);
    }
    getPostCount(): number {
        return this.hasBodyTerminal() ? 4 : 3;
    }
    declare pcircler: number;
    // points for source and drain (these are swapped on PNP mosfets)
    declare src: Point[];
    declare drn: Point[];
    // points for gate, body, and the little circle on PNP mosfets
    declare gate: Point[];
    declare body: Point[];
    declare pcircle: Point;
    declare arrowPoly: Polygon;
    setPoints(): void {
        super.setPoints();
        // these two flags apply to all mosfets
        this.flags &= ~this.FLAGS_GLOBAL;
        this.flags |= MosfetElm.globalFlags;
        // find the coordinates of the various points we need to draw
        // the MOSFET.
        let hs2: number = this.hs * this.dsign;
        if ((this.flags & this.FLAG_FLIP) !== 0) {
            hs2 = -hs2;
        }
        this.src = this.newPointArray(3);
        this.drn = this.newPointArray(3);
        this.interpPoint2(this.point1, this.point2, this.src[0], this.drn[0], 1, -hs2);
        this.interpPoint2(this.point1, this.point2, this.src[1], this.drn[1], 1 - 22 / this.dn, -hs2);
        this.interpPoint2(this.point1, this.point2, this.src[2], this.drn[2], 1 - 22 / this.dn, idiv(-hs2 * 4, 3));
        this.gate = this.newPointArray(3);
        this.interpPoint2(this.point1, this.point2, this.gate[0], this.gate[2], 1 - 28 / this.dn, idiv(hs2, 2));
        // was 1-20/dn
        this.interpPoint$Point_Point_Point_dbl(this.gate[0], this.gate[2], this.gate[1], .5);
        if (this.showBulk()) {
            this.body = this.newPointArray(2);
            this.interpPoint$Point_Point_Point_dbl(this.src[0], this.drn[0], this.body[0], .5);
            this.interpPoint$Point_Point_Point_dbl(this.src[1], this.drn[1], this.body[1], .5);
        }
        if (!this.drawDigital()) {
            if (this.pnp === 1) {
                if (!this.showBulk()) {
                    this.arrowPoly = this.calcArrow(this.src[1], this.src[0], 10, 4);
                } else {
                    this.arrowPoly = this.calcArrow(this.body[0], this.body[1], 12, 5);
                }
            } else {
                if (!this.showBulk()) {
                    this.arrowPoly = this.calcArrow(this.drn[0], this.drn[1], 12, 5);
                } else {
                    this.arrowPoly = this.calcArrow(this.body[1], this.body[0], 12, 5);
                }
            }
        } else if (this.pnp === -1) {
            this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.gate[1], 1 - 36 / this.dn);
            let dist: number = (this.dsign < 0) ? 32 : 31;
            this.pcircle = this.interpPoint$3(this.point1, this.point2, 1 - dist / this.dn);
            this.pcircler = 3;
        }
    }
    declare lastv1: number;
    declare lastv2: number;
    declare ids: number;
    declare mode: number;
    declare gm: number;
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
        if (this.hasBodyTerminal()) {
            this.bodyTerminal = 3;
        } else {
            this.bodyTerminal = (this.pnp === -1) ? 2 : 1;
        }
        if (this.doBodyDiode()) {
            if (this.pnp === -1) {
                // pnp: diodes conduct when S or D are higher than body
                this.diodeB1.stamp(this.nodes[1], this.nodes[this.bodyTerminal]);
                this.diodeB2.stamp(this.nodes[2], this.nodes[this.bodyTerminal]);
            } else {
                // npn: diodes conduct when body is higher than S or D
                this.diodeB1.stamp(this.nodes[this.bodyTerminal], this.nodes[1]);
                this.diodeB2.stamp(this.nodes[this.bodyTerminal], this.nodes[2]);
            }
        }
    }
    nonConvergence(last: number, now: number): boolean {
        let diff: number = Math.abs(last - now);
        // high beta MOSFETs are more sensitive to small differences, so we are more strict about convergence testing
        if (this.beta > 1) {
            diff *= 100;
        }
        // difference of less than 10mV is fine
        if (diff < .01) {
            return false;
        }
        // larger differences are fine if value is large
        if (CircuitElm.sim.subIterations > 10 && diff < Math.abs(now) * .001) {
            return false;
        }
        // if we're having trouble converging, get more lenient
        if (CircuitElm.sim.subIterations > 100 && diff < .01 + (CircuitElm.sim.subIterations - 100) * .0001) {
            return false;
        }
        return true;
    }
    stepFinished(): void {
        this.calculate(true);
        // fix current if body is connected to source or drain
        if (this.bodyTerminal === 1) {
            this.diodeCurrent1 = -this.diodeCurrent2;
        }
        if (this.bodyTerminal === 2) {
            this.diodeCurrent2 = -this.diodeCurrent1;
        }
    }
    doStep(): void {
        this.calculate(false);
    }
    declare lastv0: number;
    // this is called in doStep to stamp the matrix, and also called in stepFinished() to calculate the current
    calculate(finished: boolean): void {
        let vs: number[] = null as any;
        if (finished) {
            vs = this.volts;
        } else {
            // limit voltage changes to .5V
            vs = newArray(0, 3);
            vs[0] = this.volts[0];
            vs[1] = this.volts[1];
            vs[2] = this.volts[2];
            if (vs[1] > this.lastv1 + .5) {
                vs[1] = this.lastv1 + .5;
            }
            if (vs[1] < this.lastv1 - .5) {
                vs[1] = this.lastv1 - .5;
            }
            if (vs[2] > this.lastv2 + .5) {
                vs[2] = this.lastv2 + .5;
            }
            if (vs[2] < this.lastv2 - .5) {
                vs[2] = this.lastv2 - .5;
            }
        }
        let source: number = 1;
        let drain: number = 2;
        // if source voltage > drain (for NPN), swap source and drain
        // (opposite for PNP)
        if (this.pnp * vs[1] > this.pnp * vs[2]) {
            source = 2;
            drain = 1;
        }
        let gate: number = 0;
        let vgs: number = vs[gate] - vs[source];
        let vds: number = vs[drain] - vs[source];
        if (!finished && (this.nonConvergence(this.lastv1, vs[1]) || this.nonConvergence(this.lastv2, vs[2]) || this.nonConvergence(this.lastv0, vs[0]))) {
            CircuitElm.sim.converged = false;
        }
        this.lastv0 = vs[0];
        this.lastv1 = vs[1];
        this.lastv2 = vs[2];
        let realvgs: number = vgs;
        let realvds: number = vds;
        vgs *= this.pnp;
        vds *= this.pnp;
        this.ids = 0;
        this.gm = 0;
        let Gds: number = 0;
        if (vgs < this.vt) {
            // should be all zero, but that causes a singular matrix,
            // so instead we treat it as a large resistor
            Gds = 1e-8;
            this.ids = vds * Gds;
            this.mode = 0;
        } else if (vds < vgs - this.vt) {
            // linear
            this.ids = this.beta * ((vgs - this.vt) * vds - vds * vds * .5);
            this.gm = this.beta * vds;
            Gds = this.beta * (vgs - vds - this.vt);
            this.mode = 1;
        } else {
            // saturation; Gds = 0
            this.gm = this.beta * (vgs - this.vt);
            // use very small Gds to avoid nonconvergence
            Gds = 1e-8;
            this.ids = .5 * this.beta * (vgs - this.vt) * (vgs - this.vt) + (vds - (vgs - this.vt)) * Gds;
            this.mode = 2;
        }
        if (this.doBodyDiode()) {
            this.diodeB1.doStep(this.pnp * (this.volts[this.bodyTerminal] - this.volts[1]));
            this.diodeCurrent1 = this.diodeB1.calculateCurrent(this.pnp * (this.volts[this.bodyTerminal] - this.volts[1])) * this.pnp;
            this.diodeB2.doStep(this.pnp * (this.volts[this.bodyTerminal] - this.volts[2]));
            this.diodeCurrent2 = this.diodeB2.calculateCurrent(this.pnp * (this.volts[this.bodyTerminal] - this.volts[2])) * this.pnp;
        } else {
            this.diodeCurrent1 = this.diodeCurrent2 = 0;
        }
        let ids0: number = this.ids;
        // flip ids if we swapped source and drain above
        if (source === 2 && this.pnp === 1 || source === 1 && this.pnp === -1) {
            this.ids = -this.ids;
        }
        if (finished) {
            return;
        }
        let rs: number = -this.pnp * ids0 + Gds * realvds + this.gm * realvgs;
        CircuitElm.sim.stampMatrix(this.nodes[drain], this.nodes[drain], Gds);
        CircuitElm.sim.stampMatrix(this.nodes[drain], this.nodes[source], -Gds - this.gm);
        CircuitElm.sim.stampMatrix(this.nodes[drain], this.nodes[gate], this.gm);
        CircuitElm.sim.stampMatrix(this.nodes[source], this.nodes[drain], -Gds);
        CircuitElm.sim.stampMatrix(this.nodes[source], this.nodes[source], Gds + this.gm);
        CircuitElm.sim.stampMatrix(this.nodes[source], this.nodes[gate], -this.gm);
        CircuitElm.sim.stampRightSide(this.nodes[drain], rs);
        CircuitElm.sim.stampRightSide(this.nodes[source], -rs);
    }
    getFetInfo(arr: string[], n: string): void {
        arr[0] = CirSim.LS(((this.pnp === -1) ? "p-" : "n-") + n);
        arr[0] += " (Vt=" + CircuitElm.getVoltageText(this.pnp * this.vt);
        arr[0] += ", \u03b2=" + this.beta + ")";
        arr[1] = ((this.pnp === 1) ? "Ids = " : "Isd = ") + CircuitElm.getCurrentText(this.ids);
        arr[2] = "Vgs = " + CircuitElm.getVoltageText(this.volts[0] - this.volts[this.pnp === -1 ? 2 : 1]);
        arr[3] = ((this.pnp === 1) ? "Vds = " : "Vsd = ") + CircuitElm.getVoltageText(this.volts[2] - this.volts[1]);
        arr[4] = CirSim.LS((this.mode === 0) ? "off" : (this.mode === 1) ? "linear" : "saturation");
        arr[5] = "gm = " + CircuitElm.getUnitText$2(this.gm, "A/V");
        arr[6] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
        if (this.showBulk()) {
            arr[7] = "Ib = " + CircuitElm.getUnitText$2(this.bodyTerminal === 1 ? -this.diodeCurrent1 : this.bodyTerminal === 2 ? this.diodeCurrent2 : -this.pnp * (this.diodeCurrent1 + this.diodeCurrent2), "A");
        }
    }
    getInfo(arr: string[]): void {
        this.getFetInfo(arr, "MOSFET");
    }
    getScopeText(v: number): string {
        return CirSim.LS(((this.pnp === -1) ? "p-" : "n-") + "MOSFET");
    }
    canViewInScope(): boolean {
        return true;
    }
    getVoltageDiff(): number {
        return this.volts[2] - this.volts[1];
    }
    getConnection(n1: number, n2: number): boolean {
        return !(n1 === 0 || n2 === 0);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Threshold Voltage", this.pnp * this.vt, .01, 5);
        }
        if (n === 1) {
            return new EditInfo(EditInfo.makeLink("mosfet-beta.html", "Beta"), this.beta, .01, 5);
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Show Bulk", this.showBulk());
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Swap D/S", (this.flags & this.FLAG_FLIP) !== 0);
            return ei;
        }
        if (n === 4 && !this.showBulk()) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Digital Symbol", this.drawDigital());
            return ei;
        }
        if (n === 4 && this.showBulk()) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Simulate Body Diode", (this.flags & this.FLAG_BODY_DIODE) !== 0);
            return ei;
        }
        if (n === 5 && this.doBodyDiode()) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Body Terminal", (this.flags & this.FLAG_BODY_TERMINAL) !== 0);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.vt = this.pnp * ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.beta = MosfetElm.lastBeta = ei.value;
        }
        if (n === 2) {
            MosfetElm.globalFlags = (!ei.checkbox.getState()) ? (MosfetElm.globalFlags | this.FLAG_HIDE_BULK) : (MosfetElm.globalFlags & ~(this.FLAG_HIDE_BULK | this.FLAG_DIGITAL));
            //		    setPoints();
            ei.newDialog = true;
        }
        if (n === 3) {
            this.flags = (ei.checkbox.getState()) ? (this.flags | this.FLAG_FLIP) : (this.flags & ~this.FLAG_FLIP);
            //			setPoints();
        }
        if (n === 4 && !this.showBulk()) {
            MosfetElm.globalFlags = (ei.checkbox.getState()) ? (MosfetElm.globalFlags | this.FLAG_DIGITAL) : (MosfetElm.globalFlags & ~this.FLAG_DIGITAL);
            //		    setPoints();
        }
        if (n === 4 && this.showBulk()) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_BODY_DIODE);
            ei.newDialog = true;
        }
        if (n === 5) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_BODY_TERMINAL);
        }
        // lots of different cases where the body terminal might have gotten removed/added so just do this all the time
        this.allocNodes();
        this.setPoints();
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return 0;
        }
        if (n === 3) {
            return -this.diodeCurrent1 - this.diodeCurrent2;
        }
        if (n === 1) {
            return this.ids + this.diodeCurrent1;
        }
        return -this.ids + this.diodeCurrent2;
    }
}
Object.assign(MosfetElm.prototype, { "pnp": 0, "FLAG_PNP": 0, "FLAG_SHOWVT": 0, "FLAG_DIGITAL": 0, "FLAG_FLIP": 0, "FLAG_HIDE_BULK": 0, "FLAG_BODY_DIODE": 0, "FLAG_BODY_TERMINAL": 0, "FLAGS_GLOBAL": 0, "bodyTerminal": 0, "vt": 0, "beta": 0, "diodeB1": null, "diodeB2": null, "diodeCurrent1": 0, "diodeCurrent2": 0, "bodyCurrent": 0, "curcount_body1": 0, "curcount_body2": 0, "hs": 16, "pcircler": 0, "src": null, "drn": null, "gate": null, "body": null, "pcircle": null, "arrowPoly": null, "lastv1": 0, "lastv2": 0, "ids": 0, "mode": 0, "gm": 0, "lastv0": 0 });
