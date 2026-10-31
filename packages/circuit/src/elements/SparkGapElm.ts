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

// Changed 2026-10-31: converted from SparkGapElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, EditInfo, Graphics, Point, Polygon, StringTokenizer, parseJDouble } from '../core/internal';

export class SparkGapElm extends CircuitElm {
    declare resistance: number;
    declare onresistance: number;
    declare offresistance: number;
    declare breakdown: number;
    declare holdcurrent: number;
    declare state: boolean;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.offresistance = 1e9;
        this.onresistance = 1e3;
        this.breakdown = 1e3;
        this.holdcurrent = 0.001;
        this.state = false;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.onresistance = parseJDouble(st.nextToken$0());
        this.offresistance = parseJDouble(st.nextToken$0());
        this.breakdown = parseJDouble(st.nextToken$0());
        this.holdcurrent = parseJDouble(st.nextToken$0());
        return this;
    }
    nonLinear(): boolean {
        return true;
    }
    getDumpType(): number {
        return 187;
    }
    dump(): string {
        return super.dump() + " " + this.onresistance + " " + this.offresistance + " " + this.breakdown + " " + this.holdcurrent;
    }
    declare arrow1: Polygon;
    declare arrow2: Polygon;
    setPoints(): void {
        super.setPoints();
        let dist: number = 16;
        let alen: number = 8;
        this.calcLeads(dist + alen);
        let p1: Point = this.interpPoint$3(this.point1, this.point2, (this.dn - alen) / (2 * this.dn));
        this.arrow1 = this.calcArrow(this.point1, p1, alen, alen);
        p1 = this.interpPoint$3(this.point1, this.point2, (this.dn + alen) / (2 * this.dn));
        this.arrow2 = this.calcArrow(this.point2, p1, alen, alen);
    }
    draw(g: Graphics): void {
        let i: number = 0;
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.setBbox$3(this.point1, this.point2, 8);
        this.draw2Leads(g);
        this.setVoltageColor(g, this.volts[0]);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.arrow1);
        this.setVoltageColor(g, this.volts[1]);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.arrow2);
        if (this.state) {
            this.doDots(g);
        }
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        let vd: number = this.volts[0] - this.volts[1];
        this.current = vd / this.resistance;
    }
    reset(): void {
        super.reset();
        this.state = false;
    }
    startIteration(): void {
        if (Math.abs(this.current) < this.holdcurrent) {
            this.state = false;
        }
        let vd: number = this.volts[0] - this.volts[1];
        if (Math.abs(vd) > this.breakdown) {
            this.state = true;
        }
    }
    doStep(): void {
        this.resistance = (this.state) ? this.onresistance : this.offresistance;
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
    }
    getInfo(arr: string[]): void {
        arr[0] = "spark gap";
        this.getBasicInfo(arr);
        arr[3] = this.state ? "on" : "off";
        arr[4] = "Ron = " + CircuitElm.getUnitText$2(this.onresistance, CirSim.ohmString);
        arr[5] = "Roff = " + CircuitElm.getUnitText$2(this.offresistance, CirSim.ohmString);
        arr[6] = "Vbreakdown = " + CircuitElm.getUnitText$2(this.breakdown, "V");
    }
    getEditInfo(n: number): EditInfo {
        // ohmString doesn't work here on linux
        if (n === 0) {
            return new EditInfo("On resistance (ohms)", this.onresistance, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Off resistance (ohms)", this.offresistance, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Breakdown voltage", this.breakdown, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("Holding current (A)", this.holdcurrent, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (ei.value > 0 && n === 0) {
            this.onresistance = ei.value;
        }
        if (ei.value > 0 && n === 1) {
            this.offresistance = ei.value;
        }
        if (ei.value > 0 && n === 2) {
            this.breakdown = ei.value;
        }
        if (ei.value > 0 && n === 3) {
            this.holdcurrent = ei.value;
        }
    }
}
Object.assign(SparkGapElm.prototype, { "resistance": 0, "onresistance": 0, "offresistance": 0, "breakdown": 0, "holdcurrent": 0, "state": false, "arrow1": null, "arrow2": null });
