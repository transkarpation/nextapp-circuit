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

// Changed 2026-10-31: converted from JfetElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Diode, EditInfo, Graphics, MosfetElm, Point, Polygon, StringTokenizer, idiv } from '../core/internal';

export class JfetElm extends MosfetElm {
    declare diode: Diode;
    declare gateCurrent: number;
    init$3(xx: number, yy: number, pnpflag: boolean): this {
        MosfetElm.prototype.init$3.call(this, xx, yy, pnpflag);
        this.noDiagonal = true;
        this.diode = new Diode().init$1(CircuitElm.sim);
        this.diode.setupForDefaultModel();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        MosfetElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.noDiagonal = true;
        this.diode = new Diode().init$1(CircuitElm.sim);
        this.diode.setupForDefaultModel();
        return this;
    }
    reset(): void {
        super.reset();
        this.diode.reset();
    }
    declare gatePoly: Polygon;
    declare arrowPoly$JfetElm: Polygon;
    declare gatePt: Point;
    declare curcountg: number;
    declare curcounts: number;
    declare curcountd: number;
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.hs);
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.src[0], this.src[1]);
        CircuitElm.drawThickLine$3(g, this.src[1], this.src[2]);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.drn[0], this.drn[1]);
        CircuitElm.drawThickLine$3(g, this.drn[1], this.drn[2]);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.gatePt);
        g.fillPolygon(this.arrowPoly$JfetElm);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.gatePoly);
        this.curcountd = this.updateDotCount$2(-this.ids, this.curcountd);
        this.curcountg = this.updateDotCount$2(this.gateCurrent, this.curcountg);
        this.curcounts = this.updateDotCount$2(-this.gateCurrent - this.ids, this.curcounts);
        if (this.curcountd !== 0 || this.curcounts !== 0) {
            this.drawDots(g, this.src[0], this.src[1], this.curcounts);
            this.drawDots(g, this.src[1], this.src[2], this.curcounts + 8);
            this.drawDots(g, this.drn[0], this.drn[1], -this.curcountd);
            this.drawDots(g, this.drn[1], this.drn[2], -(this.curcountd + 8));
            this.drawDots(g, this.point1, this.gatePt, this.curcountg);
        }
        this.drawPosts(g);
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.gateCurrent;
        }
        if (n === 1) {
            return this.gateCurrent + this.ids;
        }
        return -this.ids;
    }
    setPoints(): void {
        super.setPoints();
        // find the coordinates of the various points we need to draw
        // the JFET.
        let hs2: number = this.hs * this.dsign;
        this.src = this.newPointArray(3);
        this.drn = this.newPointArray(3);
        this.interpPoint2(this.point1, this.point2, this.src[0], this.drn[0], 1, -hs2);
        this.interpPoint2(this.point1, this.point2, this.src[1], this.drn[1], 1, idiv(-hs2, 2));
        this.interpPoint2(this.point1, this.point2, this.src[2], this.drn[2], 1 - 10 / this.dn, idiv(-hs2, 2));
        this.gatePt = this.interpPoint$3(this.point1, this.point2, 1 - 14 / this.dn);
        let ra: Point[] = this.newPointArray(4);
        this.interpPoint2(this.point1, this.point2, ra[0], ra[1], 1 - 13 / this.dn, this.hs);
        this.interpPoint2(this.point1, this.point2, ra[2], ra[3], 1 - 10 / this.dn, this.hs);
        this.gatePoly = this.createPolygon$4(ra[0], ra[1], ra[3], ra[2]);
        if (this.pnp === -1) {
            let x: Point = this.interpPoint$3(this.gatePt, this.point1, 18 / this.dn);
            this.arrowPoly$JfetElm = this.calcArrow(this.gatePt, x, 8, 3);
        } else {
            this.arrowPoly$JfetElm = this.calcArrow(this.point1, this.gatePt, 8, 3);
        }
    }
    stamp(): void {
        super.stamp();
        if (this.pnp < 0) {
            this.diode.stamp(this.nodes[1], this.nodes[0]);
        } else {
            this.diode.stamp(this.nodes[0], this.nodes[1]);
        }
    }
    doStep(): void {
        super.doStep();
        this.diode.doStep(this.pnp * (this.volts[0] - this.volts[1]));
    }
    calculateCurrent(): void {
        this.gateCurrent = this.pnp * this.diode.calculateCurrent(this.pnp * (this.volts[0] - this.volts[1]));
    }
    showBulk(): boolean {
        return false;
    }
    getDumpType(): number {
        return 106;
    }
    // these values are taken from Hayes+Horowitz p155
    getDefaultThreshold(): number {
        return -4;
    }
    getDefaultBeta(): number {
        return .00125;
    }
    getBackwardCompatibilityBeta(): number {
        return this.getDefaultBeta();
    }
    getInfo(arr: string[]): void {
        this.getFetInfo(arr, "JFET");
    }
    getEditInfo(n: number): EditInfo {
        if (n < 2) {
            return super.getEditInfo(n);
        }
        return null;
    }
    getConnection(n1: number, n2: number): boolean {
        return true;
    }
    getScopeText(v: number): string {
        return CirSim.LS(((this.pnp === -1) ? "p-" : "n-") + "JFET");
    }
}
Object.assign(JfetElm.prototype, { "diode": null, "gateCurrent": 0, "gatePoly": null, "arrowPoly$JfetElm": null, "gatePt": null, "curcountg": 0, "curcounts": 0, "curcountd": 0 });
