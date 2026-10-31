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

// Changed 2026-10-31: converted from InverterElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, GateElm, Graphics, Point, Polygon, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class InverterElm extends CircuitElm {
    declare slewRate: number;
    // V/ns
    declare highVoltage: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.noDiagonal = true;
        this.slewRate = .5;
        // copy defaults from last gate edited
        this.highVoltage = GateElm.lastHighVoltage;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.noDiagonal = true;
        this.slewRate = .5;
        this.highVoltage = 5;
        try {
            this.slewRate = parseJDouble(st.nextToken$0());
            this.highVoltage = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.slewRate + " " + this.highVoltage;
    }
    getDumpType(): number {
        return 73;
    }
    declare center: Point;
    draw(g: Graphics): void {
        this.drawPosts(g);
        this.draw2Leads(g);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        CircuitElm.drawThickPolygon$2(g, this.gatePoly);
        if (GateElm.useEuroGates()) {
            this.drawCenteredText(g, "1", this.center.x, this.center.y - 6, true);
        }
        CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, 3);
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
        this.drawDots(g, this.lead2, this.point2, this.curcount);
    }
    declare gatePoly: Polygon;
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
        if (GateElm.useEuroGates()) {
            let pts: Point[] = this.newPointArray(4);
            let l2: Point = this.interpPoint$3(this.point1, this.point2, .5 + (ww - 5) / this.dn);
            // make room for circle
            this.interpPoint2(this.lead1, l2, pts[0], pts[1], 0, hs);
            this.interpPoint2(this.lead1, l2, pts[3], pts[2], 1, hs);
            this.gatePoly = this.createPolygon$1(pts);
            this.center = this.interpPoint$3(this.lead1, l2, .5);
        } else {
            let triPoints: Point[] = this.newPointArray(3);
            this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs);
            triPoints[2] = this.interpPoint$3(this.point1, this.point2, .5 + (ww - 5) / this.dn);
            this.gatePoly = this.createPolygon$1(triPoints);
        }
        this.setBbox$3(this.point1, this.point2, hs);
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(0, this.nodes[1], this.voltSource);
    }
    declare lastOutputVoltage: number;
    startIteration(): void {
        this.lastOutputVoltage = this.volts[1];
    }
    doStep(): void {
        let out: number = this.volts[0] > this.highVoltage * .5 ? 0 : this.highVoltage;
        let maxStep: number = this.slewRate * CircuitElm.sim.timeStep * 1e9;
        out = Math.max(Math.min(this.lastOutputVoltage + maxStep, out), this.lastOutputVoltage - maxStep);
        CircuitElm.sim.updateVoltageSource(0, this.nodes[1], this.voltSource, out);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "inverter";
        arr[1] = "Vi = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[2] = "Vo = " + CircuitElm.getVoltageText(this.volts[1]);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Slew Rate (V/ns)", this.slewRate, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("High Voltage (V)", this.highVoltage, 1, 10);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.slewRate = ei.value;
        }
        if (n === 1) {
            this.highVoltage = GateElm.lastHighVoltage = ei.value;
        }
    }
    // there is no current path through the inverter input, but there
    // is an indirect path through the output to ground.
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    hasGroundConnection(n1: number): boolean {
        return (n1 === 1);
    }
    getShortcut(): number {
        return 49;
    }
    getCurrentIntoNode(n: number): number {
        if (n === 1) {
            return this.current;
        }
        return 0;
    }
}
Object.assign(InverterElm.prototype, { "slewRate": 0, "highVoltage": 0, "center": null, "gatePoly": null, "pcircle": null, "lastOutputVoltage": 0 });
