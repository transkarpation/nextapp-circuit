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

// Changed 2026-10-31: converted from InductorElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Graphics, Inductor, StringTokenizer, parseJDouble } from '../core/internal';

export class InductorElm extends CircuitElm {
    declare ind: Inductor;
    declare inductance: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.ind = new Inductor().init$1(CircuitElm.sim);
        this.inductance = 1;
        this.ind.setup(this.inductance, this.current, this.flags);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.ind = new Inductor().init$1(CircuitElm.sim);
        this.inductance = parseJDouble(st.nextToken$0());
        this.current = parseJDouble(st.nextToken$0());
        this.ind.setup(this.inductance, this.current, this.flags);
        return this;
    }
    getDumpType(): number {
        return 108;
    }
    dump(): string {
        return super.dump() + " " + this.inductance + " " + this.current;
    }
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
    }
    draw(g: Graphics): void {
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        let i: number = 0;
        let hs: number = 8;
        this.setBbox$3(this.point1, this.point2, hs);
        this.draw2Leads(g);
        this.setPowerColor$Graphics_bool(g, false);
        this.drawCoil(g, 8, this.lead1, this.lead2, v1, v2);
        if (CircuitElm.sim.showValuesCheckItem.getState()) {
            let s: string = CircuitElm.getShortUnitText(this.inductance, "H");
            this.drawValues$3(g, s, hs);
        }
        this.doDots(g);
        this.drawPosts(g);
    }
    reset(): void {
        this.current = this.volts[0] = this.volts[1] = this.curcount = 0;
        this.ind.reset();
    }
    stamp(): void {
        this.ind.stamp(this.nodes[0], this.nodes[1]);
    }
    startIteration(): void {
        this.ind.startIteration(this.volts[0] - this.volts[1]);
    }
    nonLinear(): boolean {
        return this.ind.nonLinear();
    }
    calculateCurrent(): void {
        let voltdiff: number = this.volts[0] - this.volts[1];
        this.current = this.ind.calculateCurrent(voltdiff);
    }
    doStep(): void {
        let voltdiff: number = this.volts[0] - this.volts[1];
        this.ind.doStep(voltdiff);
    }
    getInfo(arr: string[]): void {
        arr[0] = "inductor";
        this.getBasicInfo(arr);
        arr[3] = "L = " + CircuitElm.getUnitText$2(this.inductance, "H");
        arr[4] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Inductance (H)", this.inductance, 0, 0);
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Trapezoidal Approximation", this.ind.isTrapezoidal());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.inductance = ei.value;
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.flags &= ~Inductor.FLAG_BACK_EULER;
            } else {
                this.flags |= Inductor.FLAG_BACK_EULER;
            }
        }
        this.ind.setup(this.inductance, this.current, this.flags);
    }
    getShortcut(): number {
        return 76;
    }
    getInductance(): number {
        return this.inductance;
    }
    setInductance(l: number): void {
        this.inductance = l;
        this.ind.setup(this.inductance, this.current, this.flags);
    }
}
Object.assign(InductorElm.prototype, { "ind": null, "inductance": 0 });
