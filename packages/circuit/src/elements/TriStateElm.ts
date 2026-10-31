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

// Changed 2026-10-31: converted from TriStateElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, Graphics, Point, Polygon, StringTokenizer, idiv, parseJDouble, toInt } from '../core/internal';

export class TriStateElm extends CircuitElm {
    declare resistance: number;
    declare r_on: number;
    declare r_off: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.r_on = 0.1;
        this.r_off = 1e10;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.r_on = 0.1;
        this.r_off = 1e10;
        try {
            this.r_on = parseJDouble(st.nextToken$0());
            this.r_off = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.r_on + " " + this.r_off;
    }
    getDumpType(): number {
        return 180;
    }
    declare open: boolean;
    declare ps: Point;
    declare point3: Point;
    declare lead3: Point;
    declare gatePoly: Polygon;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.ps = new Point().init$0();
        let hs: number = 16;
        let ww: number = 16;
        if (ww > this.dn / 2) {
            ww = toInt((this.dn / 2));
        }
        let triPoints: Point[] = this.newPointArray(3);
        this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs + 2);
        triPoints[2] = this.interpPoint$3(this.point1, this.point2, .5 + (ww - 2) / this.dn);
        this.gatePoly = this.createPolygon$1(triPoints);
        this.point3 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, .5, -hs);
        this.lead3 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, .5, idiv(-hs, 2));
    }
    draw(g: Graphics): void {
        let hs: number = 16;
        this.setBbox$3(this.point1, this.point2, hs);
        this.draw2Leads(g);
        g.setColor(CircuitElm.lightGrayColor);
        CircuitElm.drawThickPolygon$2(g, this.gatePoly);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.point3, this.lead3);
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
        this.drawDots(g, this.lead2, this.point2, this.curcount);
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / this.resistance;
    }
    getCurrentIntoNode(n: number): number {
        if (n === 1) {
            return this.current;
        }
        return 0;
    }
    // we need this to be able to change the matrix for each step
    nonLinear(): boolean {
        return true;
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(0, this.nodes[3], this.voltSource);
        CircuitElm.sim.stampNonLinear(this.nodes[3]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
    }
    doStep(): void {
        this.open = (this.volts[2] < 2.5);
        this.resistance = (this.open) ? this.r_off : this.r_on;
        CircuitElm.sim.stampResistor(this.nodes[3], this.nodes[1], this.resistance);
        CircuitElm.sim.updateVoltageSource(0, this.nodes[3], this.voltSource, this.volts[0] > 2.5 ? 5 : 0);
    }
    drag(xx: number, yy: number): void {
        xx = CircuitElm.sim.snapGrid(xx);
        yy = CircuitElm.sim.snapGrid(yy);
        if (CircuitElm.abs(this.x - xx) < CircuitElm.abs(this.y - yy)) {
            xx = this.x;
        } else {
            yy = this.y;
        }
        let q1: number = CircuitElm.abs(this.x - xx) + CircuitElm.abs(this.y - yy);
        let q2: number = (idiv(q1, 2)) % CircuitElm.sim.gridSize;
        if (q2 !== 0) {
            return;
        }
        this.x2 = xx;
        this.y2 = yy;
        this.setPoints();
    }
    getPostCount(): number {
        return 3;
    }
    getInternalNodeCount(): number {
        return 1;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.point2 : this.point3;
    }
    getInfo(arr: string[]): void {
        arr[0] = "tri-state buffer";
        arr[1] = this.open ? "open" : "closed";
        arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
        arr[3] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
        arr[4] = "Vc = " + CircuitElm.getVoltageText(this.volts[2]);
    }
    // there is no current path through the input, but there
    // is an indirect path through the output to ground.
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    hasGroundConnection(n1: number): boolean {
        return (n1 === 1);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.r_on = ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.r_off = ei.value;
        }
    }
}
Object.assign(TriStateElm.prototype, { "resistance": 0, "r_on": 0, "r_off": 0, "open": false, "ps": null, "point3": null, "lead3": null, "gatePoly": null });
