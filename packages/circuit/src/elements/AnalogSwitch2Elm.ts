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

// Changed 2026-10-31: converted from AnalogSwitch2Elm.java to TypeScript.
/* eslint-disable */
import { AnalogSwitchElm, CircuitElm, Graphics, Point, StringTokenizer } from '../core/internal';

export class AnalogSwitch2Elm extends AnalogSwitchElm {
    init$2(xx: number, yy: number): this {
        AnalogSwitchElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        AnalogSwitchElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    declare openhs: number;
    declare swposts: Point[];
    declare swpoles: Point[];
    declare ctlPoint: Point;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.swposts = this.newPointArray(2);
        this.swpoles = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, this.swpoles[0], this.swpoles[1], 1, this.openhs);
        this.interpPoint2(this.point1, this.point2, this.swposts[0], this.swposts[1], 1, this.openhs);
        this.ctlPoint = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, .5, this.openhs);
    }
    getPostCount(): number {
        return 4;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.openhs);
        // draw first lead
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        // draw second lead
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.swpoles[0], this.swposts[0]);
        // draw third lead
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.swpoles[1], this.swposts[1]);
        // draw switch
        g.setColor(CircuitElm.lightGrayColor);
        let position: number = (this.open) ? 1 : 0;
        CircuitElm.drawThickLine$3(g, this.lead1, this.swpoles[position]);
        this.updateDotCount$0();
        this.drawDots(g, this.point1, this.lead1, this.curcount);
        this.drawDots(g, this.swpoles[position], this.swposts[position], this.curcount);
        this.drawPosts(g);
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 3) ? this.ctlPoint : this.swposts[n - 1];
    }
    getDumpType(): number {
        return 160;
    }
    calculateCurrent(): void {
        if (this.open) {
            this.current = (this.volts[0] - this.volts[2]) / this.r_on;
        } else {
            this.current = (this.volts[0] - this.volts[1]) / this.r_on;
        }
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
    }
    doStep(): void {
        this.open = (this.volts[3] < 2.5);
        if ((this.flags & this.FLAG_INVERT) !== 0) {
            this.open = !this.open;
        }
        if (this.open) {
            CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], this.r_on);
            CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.r_off);
        } else {
            CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.r_on);
            CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], this.r_off);
        }
    }
    getConnection(n1: number, n2: number): boolean {
        if (n1 === 3 || n2 === 3) {
            return false;
        }
        return true;
    }
    getInfo(arr: string[]): void {
        arr[0] = "analog switch (SPDT)";
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.current;
        }
        let position: number = (this.open) ? 1 : 0;
        if (n === position + 1) {
            return this.current;
        }
        return 0;
    }
}
Object.assign(AnalogSwitch2Elm.prototype, { "openhs": 16, "swposts": null, "swpoles": null, "ctlPoint": null });
