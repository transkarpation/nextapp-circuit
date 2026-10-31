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

// Changed 2026-10-31: converted from TriodeElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Color, EditInfo, Graphics, Point, StringTokenizer, newArray, parseJDouble } from '../core/internal';

export class TriodeElm extends CircuitElm {
    declare mu: number;
    declare kg1: number;
    declare curcountp: number;
    declare curcountc: number;
    declare curcountg: number;
    declare currentp: number;
    declare currentg: number;
    declare currentc: number;
    declare gridCurrentR: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.mu = 93;
        this.kg1 = 680;
        this.setup();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.mu = parseJDouble(st.nextToken$0());
        this.kg1 = parseJDouble(st.nextToken$0());
        this.setup();
        return this;
    }
    setup(): void {
        this.noDiagonal = true;
    }
    nonLinear(): boolean {
        return true;
    }
    reset(): void {
        this.volts[0] = this.volts[1] = this.volts[2] = 0;
        this.curcount = 0;
    }
    dump(): string {
        return super.dump() + " " + this.mu + " " + this.kg1;
    }
    getDumpType(): number {
        return 173;
    }
    declare plate: Point[];
    declare grid: Point[];
    declare cath: Point[];
    declare midgrid: Point;
    declare midcath: Point;
    declare circler: number;
    setPoints(): void {
        super.setPoints();
        this.plate = this.newPointArray(4);
        this.grid = this.newPointArray(8);
        this.cath = this.newPointArray(4);
        this.grid[0] = this.point1;
        let nearw: number = 8;
        this.interpPoint$5(this.point1, this.point2, this.plate[1], 1, nearw);
        let farw: number = 32;
        this.interpPoint$5(this.point1, this.point2, this.plate[0], 1, farw);
        let platew: number = 18;
        this.interpPoint2(this.point2, this.plate[1], this.plate[2], this.plate[3], 1, platew);
        this.circler = 24;
        this.interpPoint$5(this.point1, this.point2, this.grid[1], (this.dn - this.circler) / this.dn, 0);
        let i: number = 0;
        for (i = 0; i !== 3; i++) {
            this.interpPoint$5(this.grid[1], this.point2, this.grid[2 + i * 2], (i * 3 + 1) / 4.5, 0);
            this.interpPoint$5(this.grid[1], this.point2, this.grid[3 + i * 2], (i * 3 + 2) / 4.5, 0);
        }
        this.midgrid = this.point2;
        let cathw: number = 16;
        this.midcath = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1, -nearw);
        this.interpPoint2(this.point2, this.plate[1], this.cath[1], this.cath[2], -1, cathw);
        this.interpPoint$5(this.point2, this.plate[1], this.cath[3], -1.2, -cathw);
        this.interpPoint$5(this.point2, this.plate[1], this.cath[0], -farw / nearw, cathw);
    }
    draw(g: Graphics): void {
        g.setColor(Color.gray);
        CircuitElm.drawThickCircle(g, this.point2.x, this.point2.y, this.circler);
        this.setBbox$3(this.point1, this.plate[0], 16);
        this.adjustBbox$4(this.cath[0].x, this.cath[1].y, this.point2.x + this.circler, this.point2.y + this.circler);
        // draw plate
        this.setVoltageColor(g, this.volts[0]);
        this.setPowerColor$Graphics_dbl(g, this.currentp * (this.volts[0] - this.volts[2]));
        CircuitElm.drawThickLine$3(g, this.plate[0], this.plate[1]);
        CircuitElm.drawThickLine$3(g, this.plate[2], this.plate[3]);
        // draw grid
        this.setVoltageColor(g, this.volts[1]);
        this.setPowerColor$Graphics_dbl(g, this.currentg * (this.volts[1] - this.volts[2]));
        let i: number = 0;
        for (i = 0; i !== 8; i += 2) {
            CircuitElm.drawThickLine$3(g, this.grid[i], this.grid[i + 1]);
        }
        // draw cathode
        this.setVoltageColor(g, this.volts[2]);
        this.setPowerColor$Graphics_dbl(g, 0);
        for (i = 0; i !== 3; i++) {
            CircuitElm.drawThickLine$3(g, this.cath[i], this.cath[i + 1]);
        }
        // draw dots
        this.curcountp = this.updateDotCount$2(this.currentp, this.curcountp);
        this.curcountc = this.updateDotCount$2(this.currentc, this.curcountc);
        this.curcountg = this.updateDotCount$2(this.currentg, this.curcountg);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.plate[0], this.midgrid, this.curcountp);
            this.drawDots(g, this.midgrid, this.midcath, this.curcountc);
            this.drawDots(g, this.midcath, this.cath[1], this.curcountc + 8);
            this.drawDots(g, this.cath[1], this.cath[0], this.curcountc + 8);
            this.drawDots(g, this.point1, this.midgrid, this.curcountg);
        }
        this.drawPosts(g);
    }
    getCurrentIntoNode(n: number): number {
        if (n === 2) {
            return this.currentc;
        }
        if (n === 0) {
            return -this.currentp;
        }
        return -this.currentg;
    }
    getPost(n: number): Point {
        return (n === 0) ? this.plate[0] : (n === 1) ? this.grid[0] : this.cath[0];
    }
    getPostCount(): number {
        return 3;
    }
    getPower(): number {
        return (this.volts[0] - this.volts[2]) * this.currentc + (this.volts[this.gridN] - this.volts[this.cathN]) * this.currentg;
    }
    getCurrent(): number {
        return this.currentc;
    }
    // for scope
    declare gridN: number;
    declare cathN: number;
    declare plateN: number;
    declare lastv0: number;
    declare lastv1: number;
    declare lastv2: number;
    doStep(): void {
        let vs: number[] = newArray(0, 3);
        vs[0] = this.volts[0];
        vs[1] = this.volts[1];
        vs[2] = this.volts[2];
        if (vs[1] > this.lastv1 + .5) {
            vs[1] = this.lastv1 + .5;
        }
        if (vs[1] < this.lastv1 - .5) {
            vs[1] = this.lastv1 - .5;
        }
        if (vs[2] > this.lastv2 + .5) {
            vs[2] = this.lastv2 + .5;
        }
        if (vs[2] < this.lastv2 - .5) {
            vs[2] = this.lastv2 - .5;
        }
        let vgk: number = vs[this.gridN] - vs[this.cathN];
        let vpk: number = vs[this.plateN] - vs[this.cathN];
        if (Math.abs(this.lastv0 - vs[0]) > .01 || Math.abs(this.lastv1 - vs[1]) > .01 || Math.abs(this.lastv2 - vs[2]) > .01) {
            CircuitElm.sim.converged = false;
        }
        this.lastv0 = vs[0];
        this.lastv1 = vs[1];
        this.lastv2 = vs[2];
        let ids: number = 0;
        let gm: number = 0;
        let Gds: number = 0;
        let ival: number = vgk + vpk / this.mu;
        this.currentg = 0;
        if (vgk > .01) {
            CircuitElm.sim.stampResistor(this.nodes[this.gridN], this.nodes[this.cathN], this.gridCurrentR);
            this.currentg = vgk / this.gridCurrentR;
        } else {
            CircuitElm.sim.stampResistor(this.nodes[this.gridN], this.nodes[this.cathN], 1e8);
        }
        // avoid singular matrix
        if (ival < 0) {
            // should be all zero, but that causes a singular matrix,
            // so instead we treat it as a large resistor
            Gds = 1e-8;
            ids = vpk * Gds;
        } else {
            ids = Math.pow(ival, 1.5) / this.kg1;
            let q: number = 1.5 * Math.sqrt(ival) / this.kg1;
            // gm = dids/dgk;
            // Gds = dids/dpk;
            Gds = q;
            gm = q / this.mu;
        }
        this.currentp = ids;
        this.currentc = ids + this.currentg;
        let rs: number = -ids + Gds * vpk + gm * vgk;
        CircuitElm.sim.stampMatrix(this.nodes[this.plateN], this.nodes[this.plateN], Gds);
        CircuitElm.sim.stampMatrix(this.nodes[this.plateN], this.nodes[this.cathN], -Gds - gm);
        CircuitElm.sim.stampMatrix(this.nodes[this.plateN], this.nodes[this.gridN], gm);
        CircuitElm.sim.stampMatrix(this.nodes[this.cathN], this.nodes[this.plateN], -Gds);
        CircuitElm.sim.stampMatrix(this.nodes[this.cathN], this.nodes[this.cathN], Gds + gm);
        CircuitElm.sim.stampMatrix(this.nodes[this.cathN], this.nodes[this.gridN], -gm);
        CircuitElm.sim.stampRightSide(this.nodes[this.plateN], rs);
        CircuitElm.sim.stampRightSide(this.nodes[this.cathN], -rs);
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
    }
    getInfo(arr: string[]): void {
        arr[0] = "triode";
        let vac: number = this.volts[this.plateN] - this.volts[this.cathN];
        let vgc: number = this.volts[this.gridN] - this.volts[this.cathN];
        let vag: number = this.volts[this.plateN] - this.volts[this.gridN];
        arr[1] = "Vac = " + CircuitElm.getVoltageText(vac);
        arr[2] = "Vgc = " + CircuitElm.getVoltageText(vgc);
        arr[3] = "Vag = " + CircuitElm.getVoltageText(vag);
        arr[4] = "Ic = " + CircuitElm.getUnitText$2(this.currentc, "A");
        arr[5] = "Ig = " + CircuitElm.getUnitText$2(this.currentg, "A");
    }
    // grid not connected to other terminals
    getConnection(n1: number, n2: number): boolean {
        return !(n1 === 1 || n2 === 1);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("mu", this.mu, 0, 0).setDimensionless();
        }
        if (n === 1) {
            return new EditInfo("kg1", this.kg1, 0, 0).setDimensionless();
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.mu = ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.kg1 = ei.value;
        }
    }
    canViewInScope(): boolean {
        return true;
    }
    getVoltageDiff(): number {
        return this.volts[this.plateN] - this.volts[this.cathN];
    }
}
Object.assign(TriodeElm.prototype, { "mu": 0, "kg1": 0, "curcountp": 0, "curcountc": 0, "curcountg": 0, "currentp": 0, "currentg": 0, "currentc": 0, "gridCurrentR": 6000, "plate": null, "grid": null, "cath": null, "midgrid": null, "midcath": null, "circler": 0, "gridN": 1, "cathN": 2, "plateN": 0, "lastv0": 0, "lastv1": 0, "lastv2": 0 });
