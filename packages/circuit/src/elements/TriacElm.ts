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
// 3 nodes, 2 internal nodes
// 1 = MT1, 0 = MT2, 2 = gate
// 3 = internal node between MT1 and MT2 (mtinode)
// 1,3 = variable resistor
// 3,0 = back-to-back diodes
// 2,1 = resistor
// MT1 and MT2 are nodes 1 and 0 (instead of 0 and 1) so that MT1 will be at the bottom when drawn bottom-to-top

// Changed 2026-10-31: converted from TriacElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Color, Diode, EditInfo, Graphics, Point, Polygon, StringTokenizer, javaBoolean, newArray, parseJDouble, toInt } from '../core/internal';

export class TriacElm extends CircuitElm {
    declare mt1node: number;
    declare mt2node: number;
    declare gnode: number;
    declare mtinode: number;
    declare diode03: Diode;
    declare diode30: Diode;
    declare state: boolean;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.setDefaults();
        this.setup();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.setDefaults();
        this.triggerI = parseJDouble(st.nextToken$0());
        this.holdingI = parseJDouble(st.nextToken$0());
        this.cresistance = parseJDouble(st.nextToken$0());
        this.state = javaBoolean(st.nextToken$0());
        this.setup();
        return this;
    }
    setDefaults(): void {
        this.holdingI = .0082;
        this.triggerI = .01;
        this.cresistance = 100;
    }
    setup(): void {
        this.diode03 = new Diode().init$1(CircuitElm.sim);
        this.diode03.setupForDefaultModel();
        this.diode30 = new Diode().init$1(CircuitElm.sim);
        this.diode30.setupForDefaultModel();
    }
    nonLinear(): boolean {
        return true;
    }
    reset(): void {
        this.volts[this.mt1node] = this.volts[this.mt2node] = this.volts[this.gnode] = 0;
        this.diode03.reset();
        this.diode30.reset();
        this.curcount_1 = this.curcount_2 = this.curcount_g = 0;
    }
    getDumpType(): number {
        return 206;
    }
    dump(): string {
        return super.dump() + " " + this.triggerI + " " + this.holdingI + " " + this.cresistance + " " + this.state;
    }
    declare i1: number;
    declare i2: number;
    declare ig: number;
    declare curcount_1: number;
    declare curcount_2: number;
    declare curcount_g: number;
    declare cresistance: number;
    declare triggerI: number;
    declare holdingI: number;
    declare hs: number;
    declare poly: Polygon;
    declare cathode: Point[];
    declare gate: Point[];
    declare arrows: Polygon[];
    declare plate1: Point[];
    declare plate2: Point[];
    setPoints(): void {
        super.setPoints();
        let dir: number = 0;
        if (CircuitElm.abs(this.dx) > CircuitElm.abs(this.dy)) {
            dir = -CircuitElm.sign$1(this.dx) * CircuitElm.sign$1(this.dy);
            this.dn = CircuitElm.abs(this.dx);
            this.point2.y = this.point1.y;
        } else {
            dir = CircuitElm.sign$1(this.dy) * CircuitElm.sign$1(this.dx);
            this.dn = CircuitElm.abs(this.dy);
            this.point2.x = this.point1.x;
        }
        if (dir === 0) {
            dir = 1;
        }
        this.calcLeads(16);
        this.plate1 = this.newPointArray(2);
        this.plate2 = this.newPointArray(2);
        this.gate = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, this.plate1[0], this.plate1[1], 0, 16);
        this.interpPoint2(this.lead1, this.lead2, this.plate2[0], this.plate2[1], 1, 16);
        this.arrows = newArray(null, 2);
        let i: number = 0;
        for (i = 0; i !== 2; i++) {
            let sgn: number = -1 + i * 2;
            let p1: Point = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, i, 8 * sgn);
            let p2: Point = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1 - i, 16 * sgn);
            let p3: Point = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1 - i, 0 * sgn);
            this.arrows[i] = this.createPolygon$3(p1, p2, p3);
        }
        let gatelen: number = CircuitElm.sim.gridSize;
        let leadlen: number = (this.dn - 16) / 2;
        gatelen = toInt(gatelen + (leadlen % CircuitElm.sim.gridSize));
        if (leadlen < gatelen) {
            this.x2 = this.x;
            this.y2 = this.y;
            return;
        }
        this.interpPoint$5(this.lead2, this.point2, this.gate[0], gatelen / leadlen, gatelen * dir);
        this.interpPoint$5(this.lead2, this.point2, this.gate[1], gatelen / leadlen, CircuitElm.sim.gridSize * 2 * dir);
    }
    draw(g: Graphics): void {
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.setBbox$3(this.point1, this.point2, 6);
        this.adjustBbox$2(this.gate[0], this.gate[1]);
        this.draw2Leads(g);
        this.setVoltageColor(g, v1);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickLine$3(g, this.plate1[0], this.plate1[1]);
        this.setVoltageColor(g, v2);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickLine$3(g, this.plate2[0], this.plate2[1]);
        g.fillPolygon(this.arrows[0]);
        this.setVoltageColor(g, v1);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.arrows[1]);
        this.setVoltageColor(g, this.volts[this.gnode]);
        CircuitElm.drawThickLine$3(g, this.lead2, this.gate[0]);
        CircuitElm.drawThickLine$3(g, this.gate[0], this.gate[1]);
        this.curcount_1 = this.updateDotCount$2(this.i1, this.curcount_1);
        this.curcount_2 = this.updateDotCount$2(this.i2, this.curcount_2);
        this.curcount_g = this.updateDotCount$2(this.ig, this.curcount_g);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead2, this.curcount_2);
            this.drawDots(g, this.point2, this.lead2, this.curcount_1);
            this.drawDots(g, this.gate[1], this.gate[0], this.curcount_g);
            this.drawDots(g, this.gate[0], this.lead2, this.curcount_g + CircuitElm.distance(this.gate[1], this.gate[0]));
        }
        if ((this.needsHighlight() || CircuitElm.sim.dragElm === this) && this.point1.x === this.point2.x && this.point2.y > this.point1.y) {
            g.setColor(Color.white);
            let ds: number = CircuitElm.sign$1(this.dx);
            g.drawString("MT1", this.lead2.x + ((ds < 0) ? 5 : -30), this.lead2.y + 12);
            g.drawString("MT2", this.lead1.x + 5, this.lead1.y - 4);
            // x+6 if ds=1, -12 if -1
            g.drawString("G", this.gate[0].x, this.gate[0].y + 12);
        }
        this.drawPosts(g);
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.point2 : this.gate[1];
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.i2;
        }
        if (n === 1) {
            return -this.i1;
        }
        return -this.ig;
    }
    getPostCount(): number {
        return 3;
    }
    getInternalNodeCount(): number {
        return 1;
    }
    declare aresistance: number;
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[this.mt1node]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.mt2node]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.gnode]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.mtinode]);
        CircuitElm.sim.stampResistor(this.nodes[this.gnode], this.nodes[this.mt1node], this.cresistance);
        this.diode03.stamp(this.nodes[this.mt2node], this.nodes[this.mtinode]);
        this.diode30.stamp(this.nodes[this.mtinode], this.nodes[this.mt2node]);
    }
    startIteration(): void {
        if (Math.abs(this.i2) < this.holdingI) {
            this.state = false;
        }
        if (Math.abs(this.ig) > this.triggerI) {
            this.state = true;
        }
        this.aresistance = (this.state) ? .01 : 10e5;
    }
    doStep(): void {
        this.diode03.doStep(this.volts[this.mt2node] - this.volts[this.mtinode]);
        this.diode30.doStep(this.volts[this.mtinode] - this.volts[this.mt2node]);
        CircuitElm.sim.stampResistor(this.nodes[this.mtinode], this.nodes[this.mt1node], this.aresistance);
    }
    getInfo(arr: string[]): void {
        arr[0] = "TRIAC";
        arr[1] = (this.state) ? "on" : "off";
        arr[2] = "Vmt2mt1 = " + CircuitElm.getVoltageText(this.volts[this.mt2node] - this.volts[this.mt1node]);
        arr[3] = "Imt1 = " + CircuitElm.getCurrentText(this.i1);
        arr[4] = "Imt2 = " + CircuitElm.getCurrentText(this.i2);
        arr[5] = "Ig = " + CircuitElm.getCurrentText(this.ig);
        arr[6] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    calculateCurrent(): void {
        this.i2 = (this.volts[this.mtinode] - this.volts[this.mt1node]) / this.aresistance;
        this.ig = -(this.volts[this.mt1node] - this.volts[this.gnode]) / this.cresistance;
        this.i1 = -this.i2 - this.ig;
    }
    getPower(): number {
        return (this.volts[this.mt2node] - this.volts[this.mt1node]) * this.i2 + (this.volts[this.gnode] - this.volts[this.mt1node]) * this.ig;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Trigger Current (A)", this.triggerI, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Holding Current (A)", this.holdingI, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Gate-MT1 Resistance (ohms)", this.cresistance, 0, 0);
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
            this.cresistance = ei.value;
        }
    }
    canViewInScope(): boolean {
        return true;
    }
    getVoltageDiff(): number {
        return this.volts[this.mt2node] - this.volts[this.mt1node];
    }
    getCurrent(): number {
        return this.i2;
    }
    // for scope
}
Object.assign(TriacElm.prototype, { "mt1node": 1, "mt2node": 0, "gnode": 2, "mtinode": 3, "diode03": null, "diode30": null, "state": false, "i1": 0, "i2": 0, "ig": 0, "curcount_1": 0, "curcount_2": 0, "curcount_g": 0, "cresistance": 0, "triggerI": 0, "holdingI": 0, "hs": 8, "poly": null, "cathode": null, "gate": null, "arrows": null, "plate1": null, "plate2": null, "aresistance": 0 });
