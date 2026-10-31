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
// contributed by Edward Calver

// Changed 2026-10-31: converted from InvertingSchmittElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, Graphics, Point, Polygon, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class InvertingSchmittElm extends CircuitElm {
    declare slewRate: number;
    // V/ns
    declare lowerTrigger: number;
    declare upperTrigger: number;
    declare state: boolean;
    declare logicOnLevel: number;
    declare logicOffLevel: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.noDiagonal = true;
        this.slewRate = .5;
        this.state = false;
        this.lowerTrigger = 1.66;
        this.upperTrigger = 3.33;
        this.logicOnLevel = 5;
        this.logicOffLevel = 0;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.noDiagonal = true;
        this.slewRate = .5;
        this.lowerTrigger = 1.66;
        this.upperTrigger = 3.33;
        this.logicOnLevel = 5;
        this.logicOffLevel = 0;
        try {
            this.slewRate = parseJDouble(st.nextToken$0());
            this.lowerTrigger = parseJDouble(st.nextToken$0());
            this.upperTrigger = parseJDouble(st.nextToken$0());
            this.logicOnLevel = parseJDouble(st.nextToken$0());
            this.logicOffLevel = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.slewRate + " " + this.lowerTrigger + " " + this.upperTrigger + " " + this.logicOnLevel + " " + this.logicOffLevel;
    }
    getDumpType(): number {
        return 183;
    }
    //Trying to find unused type
    draw(g: Graphics): void {
        this.drawPosts(g);
        this.draw2Leads(g);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        CircuitElm.drawThickPolygon$2(g, this.gatePoly);
        g.setLineWidth(2);
        CircuitElm.drawPolygon(g, this.symbolPoly);
        g.setLineWidth(1);
        CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, 3);
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
        this.drawDots(g, this.lead2, this.point2, this.curcount);
    }
    declare gatePoly: Polygon;
    declare symbolPoly: Polygon;
    declare pcircle: Point;
    setPoints(): void {
        super.setPoints();
        let hs: number = 16;
        let ww: number = 16;
        if (ww > this.dn / 2) {
            ww = toInt((this.dn / 2));
        }
        this.lead1 = this.interpPoint$3(this.point1, this.point2, .5 - ww / this.dn);
        this.lead2 = this.interpPoint$3(this.point1, this.point2, .5 + (ww + 2) / this.dn);
        this.pcircle = this.interpPoint$3(this.point1, this.point2, .5 + (ww - 2) / this.dn);
        let triPoints: Point[] = this.newPointArray(3);
        this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs);
        triPoints[2] = this.interpPoint$3(this.point1, this.point2, .5 + (ww - 5) / this.dn);
        this.gatePoly = this.createPolygon$1(triPoints);
        this.symbolPoly = this.getSchmittPolygon(1, .3);
        this.setBbox$3(this.point1, this.point2, hs);
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(0, this.nodes[1], this.voltSource);
    }
    doStep(): void {
        let v0: number = this.volts[1];
        let out: number = 0;
        if (this.state) {
            //Output is high
            if (this.volts[0] > this.upperTrigger) {
                this.state = false;
                out = this.logicOffLevel;
            } else {
                out = this.logicOnLevel;
            }
        } else {
            //Output is low
            if (this.volts[0] < this.lowerTrigger) {
                this.state = true;
                out = this.logicOnLevel;
            } else {
                out = this.logicOffLevel;
            }
        }
        let maxStep: number = this.slewRate * CircuitElm.sim.timeStep * 1e9;
        out = Math.max(Math.min(v0 + maxStep, out), v0 - maxStep);
        CircuitElm.sim.updateVoltageSource(0, this.nodes[1], this.voltSource, out);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "inverting Schmitt trigger";
        arr[1] = "Vi = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[2] = "Vo = " + CircuitElm.getVoltageText(this.volts[1]);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            this.dlt = this.lowerTrigger;
            return new EditInfo("Lower threshold (V)", this.lowerTrigger, 0.01, 5);
        }
        if (n === 1) {
            this.dut = this.upperTrigger;
            return new EditInfo("Upper threshold (V)", this.upperTrigger, 0.01, 5);
        }
        if (n === 2) {
            return new EditInfo("Slew Rate (V/ns)", this.slewRate, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("High Voltage (V)", this.logicOnLevel, 0, 0);
        }
        if (n === 4) {
            return new EditInfo("Low Voltage (V)", this.logicOffLevel, 0, 0);
        }
        return null;
    }
    declare dlt: number;
    declare dut: number;
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.dlt = ei.value;
        }
        if (n === 1) {
            this.dut = ei.value;
        }
        if (n === 2) {
            this.slewRate = ei.value;
        }
        if (n === 3) {
            this.logicOnLevel = ei.value;
        }
        if (n === 4) {
            this.logicOffLevel = ei.value;
        }
        if (this.dlt > this.dut) {
            this.upperTrigger = this.dlt;
            this.lowerTrigger = this.dut;
        } else {
            this.upperTrigger = this.dut;
            this.lowerTrigger = this.dlt;
        }
    }
    // there is no current path through the InvertingSchmitt input, but there
    // is an indirect path through the output to ground.
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    hasGroundConnection(n1: number): boolean {
        return (n1 === 1);
    }
    getCurrentIntoNode(n: number): number {
        if (n === 1) {
            return this.current;
        }
        return 0;
    }
}
Object.assign(InvertingSchmittElm.prototype, { "slewRate": 0, "lowerTrigger": 0, "upperTrigger": 0, "state": false, "logicOnLevel": 0, "logicOffLevel": 0, "gatePoly": null, "symbolPoly": null, "pcircle": null, "dlt": 0, "dut": 0 });
