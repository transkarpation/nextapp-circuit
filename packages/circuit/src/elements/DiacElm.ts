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

// Changed 2026-10-31: converted from DiacElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Diode, EditInfo, Graphics, Point, Polygon, StringTokenizer, newArray, parseJDouble } from '../core/internal';

export class DiacElm extends CircuitElm {
    // resistor from 0 to 2, 3
    // diodes from 2, 3 to 1
    declare onresistance: number;
    declare offresistance: number;
    declare breakdown: number;
    declare holdcurrent: number;
    declare state: boolean;
    declare diode1: Diode;
    declare diode2: Diode;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.offresistance = 1e8;
        this.onresistance = 500;
        this.breakdown = 30;
        this.holdcurrent = .01;
        this.state = false;
        this.createDiodes();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.onresistance = parseJDouble(st.nextToken$0());
        this.offresistance = parseJDouble(st.nextToken$0());
        this.breakdown = parseJDouble(st.nextToken$0());
        this.holdcurrent = parseJDouble(st.nextToken$0());
        this.createDiodes();
        return this;
    }
    createDiodes(): void {
        this.diode1 = new Diode().init$1(CircuitElm.sim);
        this.diode2 = new Diode().init$1(CircuitElm.sim);
        this.diode1.setupForDefaultModel();
        this.diode2.setupForDefaultModel();
    }
    nonLinear(): boolean {
        return true;
    }
    getDumpType(): number {
        return 203;
    }
    dump(): string {
        return super.dump() + " " + this.onresistance + " " + this.offresistance + " " + this.breakdown + " " + this.holdcurrent;
    }
    declare arrows: Polygon[];
    declare plate1: Point[];
    declare plate2: Point[];
    setPoints(): void {
        super.setPoints();
        this.calcLeads(16);
        this.plate1 = this.newPointArray(2);
        this.plate2 = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, this.plate1[0], this.plate1[1], 0, 16);
        this.interpPoint2(this.lead1, this.lead2, this.plate2[0], this.plate2[1], 1, 16);
        this.arrows = newArray(null, 2);
        let i: number = 0;
        for (i = 0; i !== 2; i++) {
            let sgn: number = -1 + i * 2;
            let p1: Point = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, i, 8 * sgn);
            let p2: Point = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1 - i, 16 * sgn);
            let p3: Point = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1 - i, 0 * sgn);
            this.arrows[i] = this.createPolygon$3(p1, p2, p3);
        }
    }
    draw(g: Graphics): void {
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.setBbox$3(this.point1, this.point2, 6);
        this.draw2Leads(g);
        this.setVoltageColor(g, v1);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickLine$3(g, this.plate1[0], this.plate1[1]);
        this.setVoltageColor(g, v2);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickLine$3(g, this.plate2[0], this.plate2[1]);
        g.fillPolygon(this.arrows[0]);
        this.setVoltageColor(g, v1);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.arrows[1]);
        this.setPowerColor$Graphics_bool(g, true);
        this.doDots(g);
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        let r: number = (this.state) ? this.onresistance : this.offresistance;
        this.current = (this.volts[0] - this.volts[2]) / r + (this.volts[0] - this.volts[3]) / r;
    }
    startIteration(): void {
        let vd: number = this.volts[0] - this.volts[1];
        if (Math.abs(this.current) < this.holdcurrent) {
            this.state = false;
        }
        if (Math.abs(vd) > this.breakdown) {
            this.state = true;
        }
    }
    doStep(): void {
        let r: number = (this.state) ? this.onresistance : this.offresistance;
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], r);
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[3], r);
        this.diode1.doStep(this.volts[2] - this.volts[1]);
        this.diode2.doStep(this.volts[1] - this.volts[3]);
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
        this.diode1.stamp(this.nodes[2], this.nodes[1]);
        this.diode2.stamp(this.nodes[1], this.nodes[3]);
    }
    getInternalNodeCount(): number {
        return 2;
    }
    getInfo(arr: string[]): void {
        arr[0] = "DIAC";
        this.getBasicInfo(arr);
        arr[3] = this.state ? "on" : "off";
        arr[4] = "Ron = " + CircuitElm.getUnitText$2(this.onresistance, CirSim.ohmString);
        arr[5] = "Roff = " + CircuitElm.getUnitText$2(this.offresistance, CirSim.ohmString);
        arr[6] = "Vbrkdn = " + CircuitElm.getUnitText$2(this.breakdown, "V");
        arr[7] = "Ihold = " + CircuitElm.getUnitText$2(this.holdcurrent, "A");
        arr[8] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("On resistance (ohms)", this.onresistance, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Off resistance (ohms)", this.offresistance, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Breakdown voltage (volts)", this.breakdown, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("Hold current (amps)", this.holdcurrent, 0, 0);
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
Object.assign(DiacElm.prototype, { "onresistance": 0, "offresistance": 0, "breakdown": 0, "holdcurrent": 0, "state": false, "diode1": null, "diode2": null, "arrows": null, "plate1": null, "plate2": null });
