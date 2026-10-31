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

// Changed 2026-10-31: converted from TransformerElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Graphics, Inductor, Point, StringTokenizer, newArray, parseJDouble } from '../core/internal';

export class TransformerElm extends CircuitElm {
    declare inductance: number;
    declare ratio: number;
    declare couplingCoef: number;
    declare ptEnds: Point[];
    declare ptCoil: Point[];
    declare ptCore: Point[];
    declare current$TransformerElm: number[];
    declare curcount$TransformerElm: number[];
    declare dots: Point[];
    declare width: number;
    declare polarity: number;
    static FLAG_REVERSE: number = 4;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.inductance = 4;
        this.ratio = this.polarity = 1;
        this.width = 32;
        this.noDiagonal = true;
        this.couplingCoef = .999;
        this.current$TransformerElm = newArray(0, 2);
        this.curcount$TransformerElm = newArray(0, 2);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.width = CircuitElm.max(32, CircuitElm.abs(yb - ya));
        this.inductance = parseJDouble(st.nextToken$0());
        this.ratio = parseJDouble(st.nextToken$0());
        this.current$TransformerElm = newArray(0, 2);
        this.curcount$TransformerElm = newArray(0, 2);
        this.current$TransformerElm[0] = parseJDouble(st.nextToken$0());
        this.current$TransformerElm[1] = parseJDouble(st.nextToken$0());
        this.couplingCoef = .999;
        try {
            this.couplingCoef = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.noDiagonal = true;
        this.polarity = ((this.flags & TransformerElm.FLAG_REVERSE) !== 0) ? -1 : 1;
        return this;
    }
    drag(xx: number, yy: number): void {
        xx = CircuitElm.sim.snapGrid(xx);
        yy = CircuitElm.sim.snapGrid(yy);
        this.width = CircuitElm.max(32, CircuitElm.abs(yy - this.y));
        if (xx === this.x) {
            yy = this.y;
        }
        this.x2 = xx;
        this.y2 = yy;
        this.setPoints();
    }
    getDumpType(): number {
        return 84;
    }
    dump(): string {
        return super.dump() + " " + this.inductance + " " + this.ratio + " " + this.current$TransformerElm[0] + " " + this.current$TransformerElm[1] + " " + this.couplingCoef;
    }
    isTrapezoidal(): boolean {
        return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
    }
    draw(g: Graphics): void {
        let i: number = 0;
        for (i = 0; i !== 4; i++) {
            this.setVoltageColor(g, this.volts[i]);
            CircuitElm.drawThickLine$3(g, this.ptEnds[i], this.ptCoil[i]);
        }
        for (i = 0; i !== 2; i++) {
            this.setPowerColor$Graphics_dbl(g, this.current$TransformerElm[i] * (this.volts[i] - this.volts[i + 2]));
            this.drawCoil(g, this.dsign * (i === 1 ? -6 * this.polarity : 6), this.ptCoil[i], this.ptCoil[i + 2], this.volts[i], this.volts[i + 2]);
        }
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        for (i = 0; i !== 2; i++) {
            CircuitElm.drawThickLine$3(g, this.ptCore[i], this.ptCore[i + 2]);
            if (this.dots != null) {
                g.fillOval(this.dots[i].x - 2, this.dots[i].y - 2, 5, 5);
            }
            this.curcount$TransformerElm[i] = this.updateDotCount$2(this.current$TransformerElm[i], this.curcount$TransformerElm[i]);
        }
        for (i = 0; i !== 2; i++) {
            this.drawDots(g, this.ptEnds[i], this.ptCoil[i], this.curcount$TransformerElm[i]);
            this.drawDots(g, this.ptCoil[i], this.ptCoil[i + 2], this.curcount$TransformerElm[i]);
            this.drawDots(g, this.ptEnds[i + 2], this.ptCoil[i + 2], -this.curcount$TransformerElm[i]);
        }
        this.drawPosts(g);
        this.setBbox$3(this.ptEnds[0], this.ptEnds[this.polarity === 1 ? 3 : 1], 0);
    }
    setPoints(): void {
        super.setPoints();
        this.point2.y = this.point1.y;
        this.ptEnds = this.newPointArray(4);
        this.ptCoil = this.newPointArray(4);
        this.ptCore = this.newPointArray(4);
        this.ptEnds[0] = this.point1;
        this.ptEnds[1] = this.point2;
        this.interpPoint$5(this.point1, this.point2, this.ptEnds[2], 0, -this.dsign * this.width);
        this.interpPoint$5(this.point1, this.point2, this.ptEnds[3], 1, -this.dsign * this.width);
        let ce: number = .5 - 12 / this.dn;
        let cd: number = .5 - 2 / this.dn;
        let i: number = 0;
        for (i = 0; i !== 4; i += 2) {
            this.interpPoint$Point_Point_Point_dbl(this.ptEnds[i], this.ptEnds[i + 1], this.ptCoil[i], ce);
            this.interpPoint$Point_Point_Point_dbl(this.ptEnds[i], this.ptEnds[i + 1], this.ptCoil[i + 1], 1 - ce);
            this.interpPoint$Point_Point_Point_dbl(this.ptEnds[i], this.ptEnds[i + 1], this.ptCore[i], cd);
            this.interpPoint$Point_Point_Point_dbl(this.ptEnds[i], this.ptEnds[i + 1], this.ptCore[i + 1], 1 - cd);
        }
        if (this.polarity === -1) {
            this.dots = newArray(null, 2);
            let dotp: number = Math.abs(7. / this.width);
            this.dots[0] = this.interpPoint$Point_Point_dbl_dbl(this.ptCoil[0], this.ptCoil[2], dotp, -7 * this.dsign);
            this.dots[1] = this.interpPoint$Point_Point_dbl_dbl(this.ptCoil[3], this.ptCoil[1], dotp, -7 * this.dsign);
            let x: Point = this.ptEnds[1];
            this.ptEnds[1] = this.ptEnds[3];
            this.ptEnds[3] = x;
            x = this.ptCoil[1];
            this.ptCoil[1] = this.ptCoil[3];
            this.ptCoil[3] = x;
        } else {
            this.dots = null;
        }
    }
    getPost(n: number): Point {
        return this.ptEnds[n];
    }
    getPostCount(): number {
        return 4;
    }
    reset(): void {
        // need to set current-source values here in case one of the nodes is node 0.  In that case
        // calculateCurrent() may get called (from setNodeVoltage()) when analyzing circuit, before
        // startIteration() gets called
        this.current$TransformerElm[0] = this.current$TransformerElm[1] = this.volts[0] = this.volts[1] = this.volts[2] = this.volts[3] = this.curcount$TransformerElm[0] = this.curcount$TransformerElm[1] = this.curSourceValue1 = this.curSourceValue2 = 0;
    }
    declare a1: number;
    declare a2: number;
    declare a3: number;
    declare a4: number;
    stamp(): void {
        // equations for transformer:
        //   v1 = L1 di1/dt + M  di2/dt
        //   v2 = M  di1/dt + L2 di2/dt
        // we invert that to get:
        //   di1/dt = a1 v1 + a2 v2
        //   di2/dt = a3 v1 + a4 v2
        // integrate di1/dt using trapezoidal approx and we get:
        //   i1(t2) = i1(t1) + dt/2 (i1(t1) + i1(t2))
        //          = i1(t1) + a1 dt/2 v1(t1) + a2 dt/2 v2(t1) +
        //                     a1 dt/2 v1(t2) + a2 dt/2 v2(t2)
        // the norton equivalent of this for i1 is:
        //  a. current source, I = i1(t1) + a1 dt/2 v1(t1) + a2 dt/2 v2(t1)
        //  b. resistor, G = a1 dt/2
        //  c. current source controlled by voltage v2, G = a2 dt/2
        // and for i2:
        //  a. current source, I = i2(t1) + a3 dt/2 v1(t1) + a4 dt/2 v2(t1)
        //  b. resistor, G = a3 dt/2
        //  c. current source controlled by voltage v2, G = a4 dt/2
        //
        // For backward euler,
        //
        //   i1(t2) = i1(t1) + a1 dt v1(t2) + a2 dt v2(t2)
        //
        // So the current source value is just i1(t1) and we use
        // dt instead of dt/2 for the resistor and VCCS.
        //
        // first winding goes from node 0 to 2, second is from 1 to 3
        let l1: number = this.inductance;
        let l2: number = this.inductance * this.ratio * this.ratio;
        let m: number = this.couplingCoef * Math.sqrt(l1 * l2);
        // build inverted matrix
        let deti: number = 1 / (l1 * l2 - m * m);
        let ts: number = this.isTrapezoidal() ? CircuitElm.sim.timeStep / 2 : CircuitElm.sim.timeStep;
        this.a1 = l2 * deti * ts;
        // we multiply dt/2 into a1..a4 here
        this.a2 = -m * deti * ts;
        this.a3 = -m * deti * ts;
        this.a4 = l1 * deti * ts;
        CircuitElm.sim.stampConductance(this.nodes[0], this.nodes[2], this.a1);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[2], this.nodes[1], this.nodes[3], this.a2);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[1], this.nodes[3], this.nodes[0], this.nodes[2], this.a3);
        CircuitElm.sim.stampConductance(this.nodes[1], this.nodes[3], this.a4);
        CircuitElm.sim.stampRightSide(this.nodes[0]);
        CircuitElm.sim.stampRightSide(this.nodes[1]);
        CircuitElm.sim.stampRightSide(this.nodes[2]);
        CircuitElm.sim.stampRightSide(this.nodes[3]);
    }
    startIteration(): void {
        let voltdiff1: number = this.volts[0] - this.volts[2];
        let voltdiff2: number = this.volts[1] - this.volts[3];
        if (this.isTrapezoidal()) {
            this.curSourceValue1 = voltdiff1 * this.a1 + voltdiff2 * this.a2 + this.current$TransformerElm[0];
            this.curSourceValue2 = voltdiff1 * this.a3 + voltdiff2 * this.a4 + this.current$TransformerElm[1];
        } else {
            this.curSourceValue1 = this.current$TransformerElm[0];
            this.curSourceValue2 = this.current$TransformerElm[1];
        }
    }
    declare curSourceValue1: number;
    declare curSourceValue2: number;
    doStep(): void {
        CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[2], this.curSourceValue1);
        CircuitElm.sim.stampCurrentSource(this.nodes[1], this.nodes[3], this.curSourceValue2);
    }
    calculateCurrent(): void {
        let voltdiff1: number = this.volts[0] - this.volts[2];
        let voltdiff2: number = this.volts[1] - this.volts[3];
        this.current$TransformerElm[0] = voltdiff1 * this.a1 + voltdiff2 * this.a2 + this.curSourceValue1;
        this.current$TransformerElm[1] = voltdiff1 * this.a3 + voltdiff2 * this.a4 + this.curSourceValue2;
    }
    getCurrentIntoNode(n: number): number {
        if (n < 2) {
            return -this.current$TransformerElm[n];
        }
        return this.current$TransformerElm[n - 2];
    }
    getInfo(arr: string[]): void {
        arr[0] = "transformer";
        arr[1] = "L = " + CircuitElm.getUnitText$2(this.inductance, "H");
        arr[2] = "Ratio = 1:" + this.ratio;
        arr[3] = "Vd1 = " + CircuitElm.getVoltageText(this.volts[0] - this.volts[2]);
        arr[4] = "Vd2 = " + CircuitElm.getVoltageText(this.volts[1] - this.volts[3]);
        arr[5] = "I1 = " + CircuitElm.getCurrentText(this.current$TransformerElm[0]);
        arr[6] = "I2 = " + CircuitElm.getCurrentText(this.current$TransformerElm[1]);
    }
    getConnection(n1: number, n2: number): boolean {
        if (this.comparePair(n1, n2, 0, 2)) {
            return true;
        }
        if (this.comparePair(n1, n2, 1, 3)) {
            return true;
        }
        return false;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Primary Inductance (H)", this.inductance, .01, 5);
        }
        if (n === 1) {
            return new EditInfo("Ratio", this.ratio, 1, 10).setDimensionless();
        }
        if (n === 2) {
            return new EditInfo("Coupling Coefficient", this.couplingCoef, 0, 1).setDimensionless();
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Trapezoidal Approximation", this.isTrapezoidal());
            return ei;
        }
        if (n === 4) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Swap Secondary Polarity", this.polarity === -1);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.inductance = ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.ratio = ei.value;
        }
        if (n === 2 && ei.value > 0 && ei.value < 1) {
            this.couplingCoef = ei.value;
        }
        if (n === 3) {
            if (ei.checkbox.getState()) {
                this.flags &= ~Inductor.FLAG_BACK_EULER;
            } else {
                this.flags |= Inductor.FLAG_BACK_EULER;
            }
        }
        if (n === 4) {
            this.polarity = (ei.checkbox.getState()) ? -1 : 1;
            if (ei.checkbox.getState()) {
                this.flags |= TransformerElm.FLAG_REVERSE;
            } else {
                this.flags &= ~TransformerElm.FLAG_REVERSE;
            }
            this.setPoints();
        }
    }
    getShortcut(): number {
        return 84;
    }
}
Object.assign(TransformerElm.prototype, { "inductance": 0, "ratio": 0, "couplingCoef": 0, "ptEnds": null, "ptCoil": null, "ptCore": null, "current$TransformerElm": null, "curcount$TransformerElm": null, "dots": null, "width": 0, "polarity": 0, "a1": 0, "a2": 0, "a3": 0, "a4": 0, "curSourceValue1": 0, "curSourceValue2": 0 });
