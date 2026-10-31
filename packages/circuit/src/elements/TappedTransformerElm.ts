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

// Changed 2026-10-31: converted from TappedTransformerElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Graphics, Inductor, Point, StringTokenizer, newArray, parseJDouble } from '../core/internal';

export class TappedTransformerElm extends CircuitElm {
    declare inductance: number;
    declare ratio: number;
    declare couplingCoef: number;
    declare ptEnds: Point[];
    declare ptCoil: Point[];
    declare ptCore: Point[];
    declare current$TappedTransformerElm: number[];
    declare curcount$TappedTransformerElm: number[];
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.inductance = 4;
        this.ratio = 1;
        this.noDiagonal = true;
        this.couplingCoef = .99;
        this.current$TappedTransformerElm = newArray(0, 4);
        this.curcount$TappedTransformerElm = newArray(0, 4);
        this.voltdiff = newArray(0, 3);
        this.curSourceValue = newArray(0, 3);
        this.a = newArray(0, 9);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.inductance = parseJDouble(st.nextToken$0());
        this.ratio = parseJDouble(st.nextToken$0());
        this.current$TappedTransformerElm = newArray(0, 4);
        this.curcount$TappedTransformerElm = newArray(0, 4);
        this.current$TappedTransformerElm[0] = parseJDouble(st.nextToken$0());
        this.current$TappedTransformerElm[1] = parseJDouble(st.nextToken$0());
        try {
            this.current$TappedTransformerElm[2] = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.couplingCoef = .99;
        try {
            this.couplingCoef = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.voltdiff = newArray(0, 3);
        this.curSourceValue = newArray(0, 3);
        this.noDiagonal = true;
        this.a = newArray(0, 9);
        return this;
    }
    getDumpType(): number {
        return 169;
    }
    dump(): string {
        return super.dump() + " " + this.inductance + " " + this.ratio + " " + this.current$TappedTransformerElm[0] + " " + this.current$TappedTransformerElm[1] + " " + this.current$TappedTransformerElm[2] + " " + this.couplingCoef;
    }
    draw(g: Graphics): void {
        let i: number = 0;
        for (i = 0; i !== 5; i++) {
            this.setVoltageColor(g, this.volts[i]);
            CircuitElm.drawThickLine$3(g, this.ptEnds[i], this.ptCoil[i]);
        }
        for (i = 0; i !== 4; i++) {
            if (i === 1) {
                continue;
            }
            this.setPowerColor$Graphics_dbl(g, this.current$TappedTransformerElm[i] * (this.volts[i] - this.volts[i + 1]));
            this.drawCoil(g, i > 1 ? -6 : 6, this.ptCoil[i], this.ptCoil[i + 1], this.volts[i], this.volts[i + 1]);
        }
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        for (i = 0; i !== 4; i += 2) {
            CircuitElm.drawThickLine$3(g, this.ptCore[i], this.ptCore[i + 1]);
        }
        for (i = 0; i !== 4; i++) {
            this.curcount$TappedTransformerElm[i] = this.updateDotCount$2(this.current$TappedTransformerElm[i], this.curcount$TappedTransformerElm[i]);
        }
        // primary dots
        this.drawDots(g, this.ptEnds[0], this.ptCoil[0], this.curcount$TappedTransformerElm[0]);
        this.drawDots(g, this.ptCoil[0], this.ptCoil[1], this.curcount$TappedTransformerElm[0]);
        this.drawDots(g, this.ptCoil[1], this.ptEnds[1], this.curcount$TappedTransformerElm[0]);
        // secondary dots
        this.drawDots(g, this.ptEnds[2], this.ptCoil[2], this.curcount$TappedTransformerElm[1]);
        this.drawDots(g, this.ptCoil[2], this.ptCoil[3], this.curcount$TappedTransformerElm[1]);
        this.drawDots(g, this.ptCoil[3], this.ptEnds[3], this.curcount$TappedTransformerElm[3]);
        this.drawDots(g, this.ptCoil[3], this.ptCoil[4], this.curcount$TappedTransformerElm[2]);
        this.drawDots(g, this.ptCoil[4], this.ptEnds[4], this.curcount$TappedTransformerElm[2]);
        this.drawPosts(g);
        this.setBbox$3(this.ptEnds[0], this.ptEnds[4], 0);
    }
    setPoints(): void {
        super.setPoints();
        let hs: number = 32;
        this.ptEnds = this.newPointArray(5);
        this.ptCoil = this.newPointArray(5);
        this.ptCore = this.newPointArray(4);
        this.ptEnds[0] = this.point1;
        this.ptEnds[2] = this.point2;
        this.interpPoint$5(this.point1, this.point2, this.ptEnds[1], 0, -hs * 2);
        this.interpPoint$5(this.point1, this.point2, this.ptEnds[3], 1, -hs);
        this.interpPoint$5(this.point1, this.point2, this.ptEnds[4], 1, -hs * 2);
        let ce: number = .5 - 12 / this.dn;
        let cd: number = .5 - 2 / this.dn;
        let i: number = 0;
        this.interpPoint$Point_Point_Point_dbl(this.ptEnds[0], this.ptEnds[2], this.ptCoil[0], ce);
        this.interpPoint$5(this.ptEnds[0], this.ptEnds[2], this.ptCoil[1], ce, -hs * 2);
        this.interpPoint$Point_Point_Point_dbl(this.ptEnds[0], this.ptEnds[2], this.ptCoil[2], 1 - ce);
        this.interpPoint$5(this.ptEnds[0], this.ptEnds[2], this.ptCoil[3], 1 - ce, -hs);
        this.interpPoint$5(this.ptEnds[0], this.ptEnds[2], this.ptCoil[4], 1 - ce, -hs * 2);
        for (i = 0; i !== 2; i++) {
            let b: number = -hs * i * 2;
            this.interpPoint$5(this.ptEnds[0], this.ptEnds[2], this.ptCore[i], cd, b);
            this.interpPoint$5(this.ptEnds[0], this.ptEnds[2], this.ptCore[i + 2], 1 - cd, b);
        }
    }
    getPost(n: number): Point {
        return this.ptEnds[n];
    }
    getPostCount(): number {
        return 5;
    }
    reset(): void {
        this.current$TappedTransformerElm[0] = this.current$TappedTransformerElm[1] = this.current$TappedTransformerElm[2] = this.current$TappedTransformerElm[3] = this.volts[0] = this.volts[1] = this.volts[2] = this.volts[3] = this.volts[4] = this.curcount$TappedTransformerElm[0] = this.curcount$TappedTransformerElm[1] = this.curcount$TappedTransformerElm[2] = 0;
        // need to set current-source values here in case one of the nodes is node 0.  In that case
        // calculateCurrent() may get called (from setNodeVoltage()) when analyzing circuit, before
        // startIteration() gets called
        this.curSourceValue[0] = this.curSourceValue[1] = this.curSourceValue[2] = 0;
    }
    declare a: number[];
    stamp(): void {
        // equations for transformer:
        //   v1 = L1 di1/dt + M1 di2/dt + M1 di3/dt
        //   v2 = M1 di1/dt + L2 di2/dt + M2 di3/dt
        //   v3 = M1 di1/dt + M2 di2/dt + L2 di3/dt
        // we invert that to get:
        //   di1/dt = a1 v1 + a2 v2 + a3 v3
        //   di2/dt = a4 v1 + a5 v2 + a6 v3
        //   di3/dt = a7 v1 + a8 v2 + a9 v3
        // integrate di1/dt using trapezoidal approx and we get:
        //   i1(t2) = i1(t1) + dt/2 (i1(t1) + i1(t2))
        //          = i1(t1) + a1 dt/2 v1(t1)+a2 dt/2 v2(t1)+a3 dt/2 v3(t1) +
        //                     a1 dt/2 v1(t2)+a2 dt/2 v2(t2)+a3 dt/2 v3(t2)
        // the norton equivalent of this for i1 is:
        //  a. current source, I = i1(t1) + a1 dt/2 v1(t1) + a2 dt/2 v2(t1)
        //                                + a3 dt/2 v3(t1)
        //  b. resistor, G = a1 dt/2
        //  c. current source controlled by voltage v2, G = a2 dt/2
        //  d. current source controlled by voltage v3, G = a3 dt/2
        // and similarly for i2, i3
        //
        // first winding goes from node 0 to 1, second is from 2 to 3 to 4
        let l1: number = this.inductance;
        // second winding is split in half, so each part has half the turns;
        // we square the 1/2 to divide by 4
        let l2: number = this.inductance * this.ratio * this.ratio / 4;
        let m1: number = this.couplingCoef * Math.sqrt(l1 * l2);
        // mutual inductance between two halves of the second winding
        // is equal to self-inductance of either half (slightly less
        // because the coupling is not perfect)
        let m2: number = this.couplingCoef * l2;
        // load pre-inverted matrix
        this.a[0] = l2 + m2;
        this.a[1] = this.a[2] = this.a[3] = this.a[6] = -m1;
        this.a[4] = this.a[8] = (l1 * l2 - m1 * m1) / (l2 - m2);
        this.a[5] = this.a[7] = (m1 * m1 - l1 * m2) / (l2 - m2);
        let i: number = 0;
        let det: number = l1 * (l2 + m2) - 2 * m1 * m1;
        for (i = 0; i !== 9; i++) {
            this.a[i] *= (this.isTrapezoidal() ? CircuitElm.sim.timeStep / 2 : CircuitElm.sim.timeStep) / det;
        }
        CircuitElm.sim.stampConductance(this.nodes[0], this.nodes[1], this.a[0]);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[1], this.nodes[2], this.nodes[3], this.a[1]);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[1], this.nodes[3], this.nodes[4], this.a[2]);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[2], this.nodes[3], this.nodes[0], this.nodes[1], this.a[3]);
        CircuitElm.sim.stampConductance(this.nodes[2], this.nodes[3], this.a[4]);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[2], this.nodes[3], this.nodes[3], this.nodes[4], this.a[5]);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[3], this.nodes[4], this.nodes[0], this.nodes[1], this.a[6]);
        CircuitElm.sim.stampVCCurrentSource(this.nodes[3], this.nodes[4], this.nodes[2], this.nodes[3], this.a[7]);
        CircuitElm.sim.stampConductance(this.nodes[3], this.nodes[4], this.a[8]);
        for (i = 0; i !== 5; i++) {
            CircuitElm.sim.stampRightSide(this.nodes[i]);
        }
    }
    isTrapezoidal(): boolean {
        return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
    }
    startIteration(): void {
        this.voltdiff[0] = this.volts[0] - this.volts[1];
        this.voltdiff[1] = this.volts[2] - this.volts[3];
        this.voltdiff[2] = this.volts[3] - this.volts[4];
        let i: number = 0, j: number = 0;
        for (i = 0; i !== 3; i++) {
            this.curSourceValue[i] = this.current$TappedTransformerElm[i];
            if (this.isTrapezoidal()) {
                for (j = 0; j !== 3; j++) {
                    this.curSourceValue[i] += this.a[i * 3 + j] * this.voltdiff[j];
                }
            }
        }
    }
    declare curSourceValue: number[];
    declare voltdiff: number[];
    doStep(): void {
        CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[1], this.curSourceValue[0]);
        CircuitElm.sim.stampCurrentSource(this.nodes[2], this.nodes[3], this.curSourceValue[1]);
        CircuitElm.sim.stampCurrentSource(this.nodes[3], this.nodes[4], this.curSourceValue[2]);
    }
    calculateCurrent(): void {
        this.voltdiff[0] = this.volts[0] - this.volts[1];
        this.voltdiff[1] = this.volts[2] - this.volts[3];
        this.voltdiff[2] = this.volts[3] - this.volts[4];
        let i: number = 0, j: number = 0;
        for (i = 0; i !== 3; i++) {
            this.current$TappedTransformerElm[i] = this.curSourceValue[i];
            for (j = 0; j !== 3; j++) {
                this.current$TappedTransformerElm[i] += this.a[i * 3 + j] * this.voltdiff[j];
            }
        }
        // calc current of tap wire
        this.current$TappedTransformerElm[3] = this.current$TappedTransformerElm[1] - this.current$TappedTransformerElm[2];
    }
    getInfo(arr: string[]): void {
        arr[0] = "transformer";
        arr[1] = "L = " + CircuitElm.getUnitText$2(this.inductance, "H");
        arr[2] = "Ratio = " + this.ratio;
        //arr[3] = "I1 = " + getCurrentText(current1);
        arr[3] = "Vd1 = " + CircuitElm.getVoltageText(this.volts[0] - this.volts[2]);
        //arr[5] = "I2 = " + getCurrentText(current2);
        arr[4] = "Vd2 = " + CircuitElm.getVoltageText(this.volts[1] - this.volts[3]);
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.current$TappedTransformerElm[0];
        }
        if (n === 1) {
            return this.current$TappedTransformerElm[0];
        }
        if (n === 2) {
            return -this.current$TappedTransformerElm[1];
        }
        if (n === 3) {
            return this.current$TappedTransformerElm[3];
        }
        return this.current$TappedTransformerElm[2];
    }
    getConnection(n1: number, n2: number): boolean {
        if (this.comparePair(n1, n2, 0, 1)) {
            return true;
        }
        if (this.comparePair(n1, n2, 2, 3)) {
            return true;
        }
        if (this.comparePair(n1, n2, 3, 4)) {
            return true;
        }
        if (this.comparePair(n1, n2, 2, 4)) {
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
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.inductance = ei.value;
        }
        if (n === 1 && this.ratio > 0) {
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
    }
}
Object.assign(TappedTransformerElm.prototype, { "inductance": 0, "ratio": 0, "couplingCoef": 0, "ptEnds": null, "ptCoil": null, "ptCore": null, "current$TappedTransformerElm": null, "curcount$TappedTransformerElm": null, "a": null, "curSourceValue": null, "voltdiff": null });
