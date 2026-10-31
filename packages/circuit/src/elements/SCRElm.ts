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
// Silicon-Controlled Rectifier
// 3 nodes, 1 internal node
// 0 = anode, 1 = cathode, 2 = gate
// 0, 3 = variable resistor
// 3, 1 = diode
// 2, 1 = 50 ohm resistor

// Changed 2026-10-31: converted from SCRElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Color, Diode, EditInfo, Graphics, Point, Polygon, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class SCRElm extends CircuitElm {
    declare anode: number;
    declare cnode: number;
    declare gnode: number;
    declare inode: number;
    declare FLAG_GATE_FIX: number;
    declare diode: Diode;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.setDefaults();
        this.flags |= this.FLAG_GATE_FIX;
        this.setup();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.setDefaults();
        try {
            this.lastvac = parseJDouble(st.nextToken$0());
            this.lastvag = parseJDouble(st.nextToken$0());
            this.volts[this.anode] = 0;
            this.volts[this.cnode] = -this.lastvac;
            this.volts[this.gnode] = -this.lastvag;
            this.triggerI = parseJDouble(st.nextToken$0());
            this.holdingI = parseJDouble(st.nextToken$0());
            this.gresistance = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.setup();
        return this;
    }
    setDefaults(): void {
        this.gresistance = 50;
        this.holdingI = .0082;
        this.triggerI = .01;
    }
    setup(): void {
        this.diode = new Diode().init$1(CircuitElm.sim);
        this.diode.setupForDefaultModel();
    }
    nonLinear(): boolean {
        return true;
    }
    reset(): void {
        this.volts[this.anode] = this.volts[this.cnode] = this.volts[this.gnode] = 0;
        this.diode.reset();
        this.lastvag = this.lastvac = this.curcount_a = this.curcount_c = this.curcount_g = 0;
    }
    getDumpType(): number {
        return 177;
    }
    dump(): string {
        return super.dump() + " " + (this.volts[this.anode] - this.volts[this.cnode]) + " " + (this.volts[this.anode] - this.volts[this.gnode]) + " " + this.triggerI + " " + this.holdingI + " " + this.gresistance;
    }
    declare ia: number;
    declare ic: number;
    declare ig: number;
    declare curcount_a: number;
    declare curcount_c: number;
    declare curcount_g: number;
    declare lastvac: number;
    declare lastvag: number;
    declare gresistance: number;
    declare triggerI: number;
    declare holdingI: number;
    declare hs: number;
    declare poly: Polygon;
    declare cathode: Point[];
    declare gate: Point[];
    applyGateFix(): boolean {
        return (this.flags & this.FLAG_GATE_FIX) !== 0;
    }
    setPoints(): void {
        super.setPoints();
        let dir: number = 0;
        if (CircuitElm.abs(this.dx) > CircuitElm.abs(this.dy)) {
            dir = -CircuitElm.sign$1(this.dx) * CircuitElm.sign$1(this.dy);
            // correct dn (length) or else calcLeads() may get confused, and also gate may be drawn weirdly.  Can't do this with old circuits or it may
            // break them
            if (this.applyGateFix()) {
                this.dn = CircuitElm.abs(this.dx);
            }
            this.point2.y = this.point1.y;
        } else {
            dir = CircuitElm.sign$1(this.dy) * CircuitElm.sign$1(this.dx);
            if (this.applyGateFix()) {
                this.dn = CircuitElm.abs(this.dy);
            }
            this.point2.x = this.point1.x;
        }
        if (dir === 0) {
            dir = 1;
        }
        this.calcLeads(16);
        this.cathode = this.newPointArray(2);
        let pa: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
        this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], 1, this.hs);
        this.poly = this.createPolygon$3(pa[0], pa[1], this.lead2);
        this.gate = this.newPointArray(2);
        let leadlen: number = (this.dn - 16) / 2;
        let gatelen: number = CircuitElm.sim.gridSize;
        gatelen = toInt(gatelen + (leadlen % CircuitElm.sim.gridSize));
        if (leadlen < gatelen) {
            this.x2 = this.x;
            this.y2 = this.y;
            return;
        }
        this.interpPoint$5(this.lead2, this.point2, this.gate[0], gatelen / leadlen, gatelen * dir);
        this.interpPoint$5(this.lead2, this.point2, this.gate[1], gatelen / leadlen, CircuitElm.sim.gridSize * 2 * dir);
        this.gate[1].x = CircuitElm.sim.snapGrid(this.gate[1].x);
        this.gate[1].y = CircuitElm.sim.snapGrid(this.gate[1].y);
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.hs);
        this.adjustBbox$2(this.gate[0], this.gate[1]);
        let v1: number = this.volts[this.anode];
        let v2: number = this.volts[this.cnode];
        this.draw2Leads(g);
        // draw arrow thingy
        this.setVoltageColor(g, v1);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.poly);
        this.setVoltageColor(g, this.volts[this.gnode]);
        CircuitElm.drawThickLine$3(g, this.lead2, this.gate[0]);
        CircuitElm.drawThickLine$3(g, this.gate[0], this.gate[1]);
        // draw thing arrow is pointing to
        this.setVoltageColor(g, v2);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickLine$3(g, this.cathode[0], this.cathode[1]);
        this.curcount_a = this.updateDotCount$2(this.ia, this.curcount_a);
        this.curcount_c = this.updateDotCount$2(this.ic, this.curcount_c);
        this.curcount_g = this.updateDotCount$2(this.ig, this.curcount_g);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead2, this.curcount_a);
            this.drawDots(g, this.point2, this.lead2, this.curcount_c);
            this.drawDots(g, this.gate[1], this.gate[0], this.curcount_g);
            this.drawDots(g, this.gate[0], this.lead2, this.curcount_g + CircuitElm.distance(this.gate[1], this.gate[0]));
        }
        if ((this.needsHighlight() || CircuitElm.sim.dragElm === this) && this.point1.x === this.point2.x && this.point2.y > this.point1.y) {
            g.setColor(Color.white);
            let ds: number = CircuitElm.sign$1(this.dx);
            g.drawString("C", this.lead2.x + ((ds < 0) ? 5 : -15), this.lead2.y + 12);
            g.drawString("A", this.lead1.x + 5, this.lead1.y - 4);
            // x+6 if ds=1, -12 if -1
            g.drawString("G", this.gate[0].x, this.gate[0].y + 12);
        }
        this.drawPosts(g);
    }
    getCurrentIntoNode(n: number): number {
        if (n === this.anode) {
            return -this.ia;
        }
        if (n === this.cnode) {
            return -this.ic;
        }
        return -this.ig;
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.point2 : this.gate[1];
    }
    getPostCount(): number {
        return 3;
    }
    getInternalNodeCount(): number {
        return 1;
    }
    getPower(): number {
        return (this.volts[this.anode] - this.volts[this.gnode]) * this.ia + (this.volts[this.cnode] - this.volts[this.gnode]) * this.ic;
    }
    declare aresistance: number;
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[this.anode]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.cnode]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.gnode]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.inode]);
        CircuitElm.sim.stampResistor(this.nodes[this.gnode], this.nodes[this.cnode], this.gresistance);
        this.diode.stamp(this.nodes[this.inode], this.nodes[this.cnode]);
    }
    doStep(): void {
        let vac: number = this.volts[this.anode] - this.volts[this.cnode];
        // typically negative
        let vag: number = this.volts[this.anode] - this.volts[this.gnode];
        // typically positive
        if (Math.abs(vac - this.lastvac) > .01 || Math.abs(vag - this.lastvag) > .01) {
            CircuitElm.sim.converged = false;
        }
        this.lastvac = vac;
        this.lastvag = vag;
        this.diode.doStep(this.volts[this.inode] - this.volts[this.cnode]);
        let icmult: number = 1 / this.triggerI;
        let iamult: number = 1 / this.holdingI - icmult;
        //System.out.println(icmult + " " + iamult);
        this.aresistance = (-icmult * this.ic + this.ia * iamult > 1) ? .0105 : 10e5;
        //System.out.println(vac + " " + vag + " " + sim.converged + " " + ic + " " + ia + " " + aresistance + " " + volts[inode] + " " + volts[gnode] + " " + volts[anode]);
        CircuitElm.sim.stampResistor(this.nodes[this.anode], this.nodes[this.inode], this.aresistance);
    }
    getInfo(arr: string[]): void {
        arr[0] = "SCR";
        let vac: number = this.volts[this.anode] - this.volts[this.cnode];
        let vag: number = this.volts[this.anode] - this.volts[this.gnode];
        let vgc: number = this.volts[this.gnode] - this.volts[this.cnode];
        arr[1] = "Ia = " + CircuitElm.getCurrentText(this.ia);
        arr[2] = "Ig = " + CircuitElm.getCurrentText(this.ig);
        arr[3] = "Vac = " + CircuitElm.getVoltageText(vac);
        arr[4] = "Vag = " + CircuitElm.getVoltageText(vag);
        arr[5] = "Vgc = " + CircuitElm.getVoltageText(vgc);
        arr[6] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    calculateCurrent(): void {
        this.ig = (this.volts[this.gnode] - this.volts[this.cnode]) / this.gresistance;
        this.ia = (this.volts[this.anode] - this.volts[this.inode]) / this.aresistance;
        this.ic = -this.ig - this.ia;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Trigger Current (A)", this.triggerI, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Holding Current (A)", this.holdingI, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Gate Resistance (ohms)", this.gresistance, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.triggerI = ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.holdingI = ei.value;
        }
        if (n === 2 && ei.value > 0) {
            this.gresistance = ei.value;
        }
    }
}
Object.assign(SCRElm.prototype, { "anode": 0, "cnode": 1, "gnode": 2, "inode": 3, "FLAG_GATE_FIX": 1, "diode": null, "ia": 0, "ic": 0, "ig": 0, "curcount_a": 0, "curcount_c": 0, "curcount_g": 0, "lastvac": 0, "lastvag": 0, "gresistance": 0, "triggerI": 0, "holdingI": 0, "hs": 8, "poly": null, "cathode": null, "gate": null, "aresistance": 0 });
