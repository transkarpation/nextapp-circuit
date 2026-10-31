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

// Changed 2026-10-31: converted from SchmittElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Graphics, InvertingSchmittElm, Point, StringTokenizer, toInt } from '../core/internal';

export class SchmittElm extends InvertingSchmittElm {
    init$2(xx: number, yy: number): this {
        InvertingSchmittElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        InvertingSchmittElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getDumpType(): number {
        return 182;
    }
    doStep(): void {
        let v0: number = this.volts[1];
        let out: number = 0;
        if (this.state) {
            //Output is high
            if (this.volts[0] > this.upperTrigger) {
                this.state = false;
                out = this.logicOnLevel;
            } else {
                out = this.logicOffLevel;
            }
        } else {
            //Output is low
            if (this.volts[0] < this.lowerTrigger) {
                this.state = true;
                out = this.logicOffLevel;
            } else {
                out = this.logicOnLevel;
            }
        }
        let maxStep: number = this.slewRate * CircuitElm.sim.timeStep * 1e9;
        out = Math.max(Math.min(v0 + maxStep, out), v0 - maxStep);
        CircuitElm.sim.updateVoltageSource(0, this.nodes[1], this.voltSource, out);
    }
    draw(g: Graphics): void {
        this.drawPosts(g);
        this.draw2Leads(g);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        CircuitElm.drawThickPolygon$2(g, this.gatePoly);
        g.setLineWidth(2);
        CircuitElm.drawPolygon(g, this.symbolPoly);
        g.setLineWidth(1);
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
        this.drawDots(g, this.lead2, this.point2, this.curcount);
    }
    setPoints(): void {
        super.setPoints();
        let hs: number = 16;
        let ww: number = 16;
        if (ww > this.dn / 2) {
            ww = toInt((this.dn / 2));
        }
        this.lead1 = this.interpPoint$3(this.point1, this.point2, .5 - ww / this.dn);
        this.lead2 = this.interpPoint$3(this.point1, this.point2, .5 + (ww - 3) / this.dn);
        let triPoints: Point[] = this.newPointArray(3);
        this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs);
        triPoints[2] = this.interpPoint$3(this.point1, this.point2, .5 + (ww - 5) / this.dn);
        this.gatePoly = this.createPolygon$1(triPoints);
    }
    getInfo(arr: string[]): void {
        arr[0] = "Schmitt Trigger~";
        // ~ is for localization
    }
    getCurrentIntoNode(n: number): number {
        if (n === 1) {
            return this.current;
        }
        return 0;
    }
}
