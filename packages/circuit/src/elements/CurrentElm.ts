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

// Changed 2026-10-31: converted from CurrentElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, Graphics, Point, Polygon, StringTokenizer, parseJDouble } from '../core/internal';

export class CurrentElm extends CircuitElm {
    declare currentValue: number;
    declare broken: boolean;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.currentValue = .01;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        try {
            this.currentValue = parseJDouble(st.nextToken$0());
        } catch (e) {
            this.currentValue = .01;
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.currentValue;
    }
    getDumpType(): number {
        return 105;
    }
    declare arrow: Polygon;
    declare ashaft1: Point;
    declare ashaft2: Point;
    declare center: Point;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(26);
        this.ashaft1 = this.interpPoint$3(this.lead1, this.lead2, .25);
        this.ashaft2 = this.interpPoint$3(this.lead1, this.lead2, .6);
        this.center = this.interpPoint$3(this.lead1, this.lead2, .5);
        let p2: Point = this.interpPoint$3(this.lead1, this.lead2, .75);
        this.arrow = this.calcArrow(this.center, p2, 4, 4);
    }
    draw(g: Graphics): void {
        let cr: number = 12;
        this.draw2Leads(g);
        this.setVoltageColor(g, (this.volts[0] + this.volts[1]) / 2);
        this.setPowerColor$Graphics_bool(g, false);
        CircuitElm.drawThickCircle(g, this.center.x, this.center.y, cr);
        CircuitElm.drawThickLine$3(g, this.ashaft1, this.ashaft2);
        g.fillPolygon(this.arrow);
        this.setBbox$3(this.point1, this.point2, cr);
        this.doDots(g);
        if (CircuitElm.sim.showValuesCheckItem.getState() && this.current !== 0) {
            let s: string = CircuitElm.getShortUnitText(this.current, "A");
            if (this.dx === 0 || this.dy === 0) {
                this.drawValues$3(g, s, cr);
            }
        }
        this.drawPosts(g);
    }
    // analyzeCircuit determines if current source has a path or if it's broken
    setBroken(b: boolean): void {
        this.broken = b;
    }
    // we defer stamping current sources until we can tell if they have a current path or not
    stamp(): void {
        if (this.broken) {
            // no current path; stamping a current source would cause a matrix error.
            CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], 1e8);
            this.current = 0;
        } else {
            // ok to stamp a current source
            CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[1], this.currentValue);
            this.current = this.currentValue;
        }
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Current (A)", this.currentValue, 0, .1);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        this.currentValue = ei.value;
    }
    getInfo(arr: string[]): void {
        arr[0] = "current source";
        this.getBasicInfo(arr);
    }
    getVoltageDiff(): number {
        return this.volts[1] - this.volts[0];
    }
    getPower(): number {
        return -this.getVoltageDiff() * this.current;
    }
}
Object.assign(CurrentElm.prototype, { "currentValue": 0, "broken": false, "arrow": null, "ashaft1": null, "ashaft2": null, "center": null });
