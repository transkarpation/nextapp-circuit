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

// Changed 2026-10-31: converted from GateElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Graphics, Point, Polygon, StringTokenizer, boolOp, idiv, newArray, parseJDouble, parseJInt, toInt } from '../core/internal';

export abstract class GateElm extends CircuitElm {
    declare FLAG_SMALL: number;
    declare FLAG_SCHMITT: number;
    declare inputCount: number;
    declare lastOutput: boolean;
    declare highVoltage: number;
    static lastHighVoltage: number = 5;
    static lastSchmitt: boolean = false;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.inputCount = 2;
        this.noDiagonal = true;
        this.inputCount = 2;
        // copy defaults from last gate edited
        this.highVoltage = GateElm.lastHighVoltage;
        if (GateElm.lastSchmitt) {
            this.flags |= this.FLAG_SCHMITT;
        }
        this.setSize(CircuitElm.sim.smallGridCheckItem.getState() ? 1 : 2);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.inputCount = 2;
        this.inputCount = parseJInt(st.nextToken$0());
        let lastOutputVoltage: number = parseJDouble(st.nextToken$0());
        this.noDiagonal = true;
        this.highVoltage = 5;
        try {
            this.highVoltage = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.lastOutput = lastOutputVoltage > this.highVoltage * .5;
        this.setSize((f & this.FLAG_SMALL) !== 0 ? 1 : 2);
        return this;
    }
    isInverting(): boolean {
        return false;
    }
    declare gsize: number;
    declare gwidth: number;
    declare gwidth2: number;
    declare gheight: number;
    declare hs2: number;
    setSize(s: number): void {
        this.gsize = s;
        this.gwidth = 7 * s;
        this.gwidth2 = 14 * s;
        this.gheight = 8 * s;
        this.flags &= ~this.FLAG_SMALL;
        this.flags |= (s === 1) ? this.FLAG_SMALL : 0;
    }
    dump(): string {
        return super.dump() + " " + this.inputCount + " " + this.volts[this.inputCount] + " " + this.highVoltage;
    }
    declare inPosts: Point[];
    declare inGates: Point[];
    declare inputStates: boolean[];
    declare ww: number;
    setPoints(): void {
        super.setPoints();
        this.inputStates = newArray(false, this.inputCount);
        if (this.dn > 150 && this === CircuitElm.sim.dragElm) {
            this.setSize(2);
        }
        let hs: number = this.gheight;
        let i: number = 0;
        this.ww = this.gwidth2;
        // was 24
        if (this.ww > this.dn / 2) {
            this.ww = toInt((this.dn / 2));
        }
        if (this.isInverting() && this.ww + 8 > this.dn / 2) {
            this.ww = toInt((this.dn / 2 - 8));
        }
        this.calcLeads(this.ww * 2);
        this.inPosts = newArray(null, this.inputCount);
        this.inGates = newArray(null, this.inputCount);
        this.allocNodes();
        let i0: number = idiv(-this.inputCount, 2);
        for (i = 0; i !== this.inputCount; i++, i0++) {
            if (i0 === 0 && (this.inputCount & 1) === 0) {
                i0++;
            }
            this.inPosts[i] = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 0, hs * i0);
            this.inGates[i] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 0, hs * i0);
            this.volts[i] = (boolOp('^', this.lastOutput, this.isInverting())) ? 5 : 0;
        }
        this.hs2 = this.gwidth * (idiv(this.inputCount, 2) + 1);
        this.setBbox$3(this.point1, this.point2, this.hs2);
        if (this.hasSchmittInputs()) {
            this.schmittPoly = this.getSchmittPolygon(this.gsize, .47);
        }
    }
    createEuroGatePolygon(): void {
        let pts: Point[] = this.newPointArray(4);
        this.interpPoint2(this.lead1, this.lead2, pts[0], pts[1], 0, this.hs2);
        this.interpPoint2(this.lead1, this.lead2, pts[3], pts[2], 1, this.hs2);
        this.gatePoly = this.createPolygon$1(pts);
    }
    getGateText(): string {
        return null;
    }
    static useEuroGates(): boolean {
        return CircuitElm.sim.euroGatesCheckItem.getState();
    }
    draw(g: Graphics): void {
        let i: number = 0;
        for (i = 0; i !== this.inputCount; i++) {
            this.setVoltageColor(g, this.volts[i]);
            CircuitElm.drawThickLine$3(g, this.inPosts[i], this.inGates[i]);
        }
        this.setVoltageColor(g, this.volts[this.inputCount]);
        CircuitElm.drawThickLine$3(g, this.lead2, this.point2);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        CircuitElm.drawThickPolygon$2(g, this.gatePoly);
        if (GateElm.useEuroGates()) {
            let center: Point = this.interpPoint$3(this.point1, this.point2, .5);
            this.drawCenteredText(g, this.getGateText(), center.x, center.y - 6 * this.gsize, true);
        }
        g.setLineWidth(2);
        if (this.hasSchmittInputs()) {
            CircuitElm.drawPolygon(g, this.schmittPoly);
        }
        g.setLineWidth(1);
        if (this.linePoints != null) {
            for (i = 0; i !== this.linePoints.length - 1; i++) {
                CircuitElm.drawThickLine$3(g, this.linePoints[i], this.linePoints[i + 1]);
            }
        }
        if (this.isInverting()) {
            CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, 3);
        }
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
        this.drawDots(g, this.lead2, this.point2, this.curcount);
        this.drawPosts(g);
    }
    declare gatePoly: Polygon;
    declare schmittPoly: Polygon;
    declare pcircle: Point;
    declare linePoints: Point[];
    getPostCount(): number {
        return this.inputCount + 1;
    }
    getPost(n: number): Point {
        if (n === this.inputCount) {
            return this.point2;
        }
        return this.inPosts[n];
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    abstract getGateName(): string;
    getInfo(arr: string[]): void {
        arr[0] = this.getGateName();
        arr[1] = "Vout = " + CircuitElm.getVoltageText(this.volts[this.inputCount]);
        arr[2] = "Iout = " + CircuitElm.getCurrentText(this.getCurrent());
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(0, this.nodes[this.inputCount], this.voltSource);
    }
    hasSchmittInputs(): boolean {
        return (this.flags & this.FLAG_SCHMITT) !== 0;
    }
    getInput(x: number): boolean {
        if (!this.hasSchmittInputs()) {
            return this.volts[x] > this.highVoltage * .5;
        }
        let res: boolean = this.volts[x] > this.highVoltage * (this.inputStates[x] ? .35 : .55);
        this.inputStates[x] = res;
        return res;
    }
    abstract calcFunction(): boolean;
    declare oscillationCount: number;
    doStep(): void {
        let f: boolean = this.calcFunction();
        if (this.isInverting()) {
            f = !f;
        }
        // detect oscillation (using same strategy as Atanua)
        if (this.lastOutput === !f) {
            if (this.oscillationCount++ > 50) {
                // output is oscillating too much, randomly leave output the same
                this.oscillationCount = 0;
                if (CircuitElm.sim.getrand(10) > 5) {
                    f = this.lastOutput;
                }
            }
        } else {
            this.oscillationCount = 0;
        }
        this.lastOutput = f;
        let res: number = f ? this.highVoltage : 0;
        CircuitElm.sim.updateVoltageSource(0, this.nodes[this.inputCount], this.voltSource, res);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("# of Inputs", this.inputCount, 1, 8).setDimensionless();
        }
        if (n === 1) {
            return new EditInfo("High Voltage (V)", this.highVoltage, 1, 10);
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Schmitt Inputs", this.hasSchmittInputs());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value >= 1) {
            this.inputCount = toInt(ei.value);
            this.setPoints();
        }
        if (n === 1) {
            this.highVoltage = GateElm.lastHighVoltage = ei.value;
        }
        if (n === 2) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_SCHMITT;
            } else {
                this.flags &= ~this.FLAG_SCHMITT;
            }
            GateElm.lastSchmitt = this.hasSchmittInputs();
            this.setPoints();
        }
    }
    // there is no current path through the gate inputs, but there
    // is an indirect path through the output to ground.
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    hasGroundConnection(n1: number): boolean {
        return (n1 === this.inputCount);
    }
    getCurrentIntoNode(n: number): number {
        if (n === this.inputCount) {
            return this.current;
        }
        return 0;
    }
}
Object.assign(GateElm.prototype, { "FLAG_SMALL": 1, "FLAG_SCHMITT": 2, "inputCount": 0, "lastOutput": false, "highVoltage": 0, "gsize": 0, "gwidth": 0, "gwidth2": 0, "gheight": 0, "hs2": 0, "inPosts": null, "inGates": null, "inputStates": null, "ww": 0, "gatePoly": null, "schmittPoly": null, "pcircle": null, "linePoints": null, "oscillationCount": 0 });
