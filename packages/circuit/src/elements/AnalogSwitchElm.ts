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

// Changed 2026-10-31: converted from AnalogSwitchElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Graphics, Point, StringTokenizer, idiv, parseJDouble } from '../core/internal';

export class AnalogSwitchElm extends CircuitElm {
    declare FLAG_INVERT: number;
    declare resistance: number;
    declare r_on: number;
    declare r_off: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.r_on = 20;
        this.r_off = 1e10;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.r_on = 20;
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
        return 159;
    }
    declare open: boolean;
    declare ps: Point;
    declare point3: Point;
    declare lead3: Point;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.ps = new Point().init$0();
        let openhs: number = 16;
        this.point3 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, .5, -openhs);
        this.lead3 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, .5, idiv(-openhs, 2));
    }
    draw(g: Graphics): void {
        let openhs: number = 16;
        let hs: number = (this.open) ? openhs : 0;
        this.setBbox$3(this.point1, this.point2, openhs);
        this.draw2Leads(g);
        g.setColor(CircuitElm.lightGrayColor);
        this.interpPoint$5(this.lead1, this.lead2, this.ps, 1, hs);
        CircuitElm.drawThickLine$3(g, this.lead1, this.ps);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.point3, this.lead3);
        if (!this.open) {
            this.doDots(g);
        }
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / this.resistance;
    }
    // we need this to be able to change the matrix for each step
    nonLinear(): boolean {
        return true;
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
    }
    doStep(): void {
        this.open = (this.volts[2] < 2.5);
        if ((this.flags & this.FLAG_INVERT) !== 0) {
            this.open = !this.open;
        }
        this.resistance = (this.open) ? this.r_off : this.r_on;
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
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
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.point2 : this.point3;
    }
    getInfo(arr: string[]): void {
        arr[0] = "analog switch";
        arr[1] = this.open ? "open" : "closed";
        arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
        arr[3] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
        arr[4] = "Vc = " + CircuitElm.getVoltageText(this.volts[2]);
    }
    // we have to just assume current will flow either way, even though that
    // might cause singular matrix errors
    getConnection(n1: number, n2: number): boolean {
        if (n1 === 2 || n2 === 2) {
            return false;
        }
        return true;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Normally closed", (this.flags & this.FLAG_INVERT) !== 0);
            return ei;
        }
        if (n === 1) {
            return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.flags = (ei.checkbox.getState()) ? (this.flags | this.FLAG_INVERT) : (this.flags & ~this.FLAG_INVERT);
        }
        if (n === 1 && ei.value > 0) {
            this.r_on = ei.value;
        }
        if (n === 2 && ei.value > 0) {
            this.r_off = ei.value;
        }
    }
    getCurrentIntoNode(n: number): number {
        if (n === 2) {
            return 0;
        }
        if (n === 0) {
            return -this.current;
        }
        return this.current;
    }
}
Object.assign(AnalogSwitchElm.prototype, { "FLAG_INVERT": 1, "resistance": 0, "r_on": 0, "r_off": 0, "open": false, "ps": null, "point3": null, "lead3": null });
