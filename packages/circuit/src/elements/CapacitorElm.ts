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

// Changed 2026-10-31: converted from CapacitorElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CirSim, CircuitElm, Color, EditInfo, Graphics, Point, StringTokenizer, parseJDouble } from '../core/internal';

export class CapacitorElm extends CircuitElm {
    declare capacitance: number;
    declare compResistance: number;
    declare voltdiff: number;
    declare initialVoltage: number;
    declare plate1: Point[];
    declare plate2: Point[];
    static FLAG_BACK_EULER: number = 2;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.capacitance = 1e-5;
        this.initialVoltage = 1e-3;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.capacitance = parseJDouble(st.nextToken$0());
        this.voltdiff = parseJDouble(st.nextToken$0());
        this.initialVoltage = 1e-3;
        try {
            this.initialVoltage = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    isTrapezoidal(): boolean {
        return (this.flags & CapacitorElm.FLAG_BACK_EULER) === 0;
    }
    setNodeVoltage(n: number, c: number): void {
        super.setNodeVoltage(n, c);
        this.voltdiff = this.volts[0] - this.volts[1];
    }
    reset(): void {
        super.reset();
        this.current = this.curcount = this.curSourceValue = 0;
        // put small charge on caps when reset to start oscillators
        this.voltdiff = this.initialVoltage;
    }
    shorted(): void {
        super.reset();
        this.voltdiff = this.current = this.curcount = this.curSourceValue = 0;
    }
    getDumpType(): number {
        return 99;
    }
    dump(): string {
        return super.dump() + " " + this.capacitance + " " + this.voltdiff + " " + this.initialVoltage;
    }
    // used for PolarCapacitorElm
    declare platePoints: Point[];
    setPoints(): void {
        super.setPoints();
        let f: number = (this.dn / 2 - 4) / this.dn;
        // calc leads
        this.lead1 = this.interpPoint$3(this.point1, this.point2, f);
        this.lead2 = this.interpPoint$3(this.point1, this.point2, 1 - f);
        // calc plates
        this.plate1 = this.newPointArray(2);
        this.plate2 = this.newPointArray(2);
        this.interpPoint2(this.point1, this.point2, this.plate1[0], this.plate1[1], f, 12);
        this.interpPoint2(this.point1, this.point2, this.plate2[0], this.plate2[1], 1 - f, 12);
    }
    draw(g: Graphics): void {
        let hs: number = 12;
        this.setBbox$3(this.point1, this.point2, hs);
        // draw first lead and plate
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.setPowerColor$Graphics_bool(g, false);
        CircuitElm.drawThickLine$3(g, this.plate1[0], this.plate1[1]);
        if (CircuitElm.sim.powerCheckItem.getState()) {
            g.setColor(Color.gray);
        }
        // draw second lead and plate
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.point2, this.lead2);
        this.setPowerColor$Graphics_bool(g, false);
        if (this.platePoints == null) {
            CircuitElm.drawThickLine$3(g, this.plate2[0], this.plate2[1]);
        } else {
            let i: number = 0;
            for (i = 0; i !== 7; i++) {
                CircuitElm.drawThickLine$3(g, this.platePoints[i], this.platePoints[i + 1]);
            }
        }
        this.updateDotCount$0();
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead1, this.curcount);
            this.drawDots(g, this.point2, this.lead2, -this.curcount);
        }
        this.drawPosts(g);
        if (CircuitElm.sim.showValuesCheckItem.getState()) {
            let s: string = CircuitElm.getShortUnitText(this.capacitance, "F");
            this.drawValues$3(g, s, hs);
        }
    }
    stamp(): void {
        if (CircuitElm.sim.dcAnalysisFlag) {
            // when finding DC operating point, replace cap with a 100M resistor
            CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], 1e8);
            this.curSourceValue = 0;
            return;
        }
        // capacitor companion model using trapezoidal approximation
        // (Norton equivalent) consists of a current source in
        // parallel with a resistor.  Trapezoidal is more accurate
        // than backward euler but can cause oscillatory behavior
        // if RC is small relative to the timestep.
        if (this.isTrapezoidal()) {
            this.compResistance = CircuitElm.sim.timeStep / (2 * this.capacitance);
        } else {
            this.compResistance = CircuitElm.sim.timeStep / this.capacitance;
        }
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.compResistance);
        CircuitElm.sim.stampRightSide(this.nodes[0]);
        CircuitElm.sim.stampRightSide(this.nodes[1]);
    }
    startIteration(): void {
        if (this.isTrapezoidal()) {
            this.curSourceValue = -this.voltdiff / this.compResistance - this.current;
        } else {
            this.curSourceValue = -this.voltdiff / this.compResistance;
        }
    }
    calculateCurrent(): void {
        let voltdiff: number = this.volts[0] - this.volts[1];
        if (CircuitElm.sim.dcAnalysisFlag) {
            this.current = voltdiff / 1e8;
            return;
        }
        // we check compResistance because this might get called
        // before stamp(), which sets compResistance, causing
        // infinite current
        if (this.compResistance > 0) {
            this.current = voltdiff / this.compResistance + this.curSourceValue;
        }
    }
    declare curSourceValue: number;
    doStep(): void {
        if (CircuitElm.sim.dcAnalysisFlag) {
            return;
        }
        CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[1], this.curSourceValue);
    }
    getInfo(arr: string[]): void {
        arr[0] = "capacitor";
        this.getBasicInfo(arr);
        arr[3] = "C = " + CircuitElm.getUnitText$2(this.capacitance, "F");
        arr[4] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
        //double v = getVoltageDiff();
        //arr[4] = "U = " + getUnitText(.5*capacitance*v*v, "J");
    }
    getScopeText(v: number): string {
        return CirSim.LS("capacitor") + ", " + CircuitElm.getUnitText$2(this.capacitance, "F");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Capacitance (F)", this.capacitance, 0, 0);
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Trapezoidal Approximation", this.isTrapezoidal());
            return ei;
        }
        if (n === 2) {
            return new EditInfo("Initial Voltage (on Reset)", this.initialVoltage);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.capacitance = ei.value;
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.flags &= ~CapacitorElm.FLAG_BACK_EULER;
            } else {
                this.flags |= CapacitorElm.FLAG_BACK_EULER;
            }
        }
        if (n === 2) {
            this.initialVoltage = ei.value;
        }
    }
    getShortcut(): number {
        return 99;
    }
    getCapacitance(): number {
        return this.capacitance;
    }
    setCapacitance(c: number): void {
        this.capacitance = c;
    }
}
Object.assign(CapacitorElm.prototype, { "capacitance": 0, "compResistance": 0, "voltdiff": 0, "initialVoltage": 0, "plate1": null, "plate2": null, "platePoints": null, "curSourceValue": 0 });
