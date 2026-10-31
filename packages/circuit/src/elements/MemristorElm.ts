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

// Changed 2026-10-31: converted from MemristorElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, EditInfo, Graphics, Point, Scope, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class MemristorElm extends CircuitElm {
    declare r_on: number;
    declare r_off: number;
    declare dopeWidth: number;
    declare totalWidth: number;
    declare mobility: number;
    declare resistance: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.r_on = 100;
        this.r_off = 160 * this.r_on;
        this.dopeWidth = 0;
        this.totalWidth = 10e-9;
        // meters
        this.mobility = 1e-10;
        // m^2/sV
        this.resistance = 100;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.r_on = parseJDouble(st.nextToken$0());
        this.r_off = parseJDouble(st.nextToken$0());
        this.dopeWidth = parseJDouble(st.nextToken$0());
        this.totalWidth = parseJDouble(st.nextToken$0());
        this.mobility = parseJDouble(st.nextToken$0());
        try {
            this.current = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.resistance = 100;
        return this;
    }
    getDumpType(): number {
        return 109;
    }
    dump(): string {
        return super.dump() + " " + this.r_on + " " + this.r_off + " " + this.dopeWidth + " " + this.totalWidth + " " + this.mobility + " " + this.current;
    }
    declare ps3: Point;
    declare ps4: Point;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.ps3 = new Point().init$0();
        this.ps4 = new Point().init$0();
    }
    draw(g: Graphics): void {
        let segments: number = 6;
        let i: number = 0;
        let ox: number = 0;
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        let hs: number = 2 + toInt((8 * (1 - this.dopeWidth / this.totalWidth)));
        this.setBbox$3(this.point1, this.point2, hs);
        this.draw2Leads(g);
        this.setPowerColor$Graphics_bool(g, true);
        let segf: number = 1. / segments;
        // draw zigzag
        for (i = 0; i <= segments; i++) {
            let nx: number = (i & 1) === 0 ? 1 : -1;
            if (i === segments) {
                nx = 0;
            }
            let v: number = v1 + (v2 - v1) * i / segments;
            this.setVoltageColor(g, v);
            this.interpPoint$5(this.lead1, this.lead2, CircuitElm.ps1, i * segf, hs * ox);
            this.interpPoint$5(this.lead1, this.lead2, CircuitElm.ps2, i * segf, hs * nx);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            if (i === segments) {
                break;
            }
            this.interpPoint$5(this.lead1, this.lead2, CircuitElm.ps1, (i + 1) * segf, hs * nx);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            ox = nx;
        }
        this.doDots(g);
        this.drawPosts(g);
    }
    nonLinear(): boolean {
        return true;
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / this.resistance;
    }
    reset(): void {
        this.dopeWidth = 0;
    }
    startIteration(): void {
        let wd: number = this.dopeWidth / this.totalWidth;
        this.dopeWidth += CircuitElm.sim.timeStep * this.mobility * this.r_on * this.current / this.totalWidth;
        if (this.dopeWidth < 0) {
            this.dopeWidth = 0;
        }
        if (this.dopeWidth > this.totalWidth) {
            this.dopeWidth = this.totalWidth;
        }
        this.resistance = this.r_on * wd + this.r_off * (1 - wd);
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
    }
    doStep(): void {
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
    }
    getInfo(arr: string[]): void {
        arr[0] = "memristor";
        this.getBasicInfo(arr);
        arr[3] = "R = " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
        arr[4] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getScopeValue(x: number): number {
        return (x === Scope.VAL_R) ? this.resistance : super.getScopeValue(x);
    }
    getScopeUnits(x: number): number {
        return (x === Scope.VAL_R) ? Scope.UNITS_OHMS : super.getScopeUnits(x);
    }
    canShowValueInScope(x: number): boolean {
        return x === Scope.VAL_R;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Min Resistance (ohms)", this.r_on, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Max Resistance (ohms)", this.r_off, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Width of Doped Region (nm)", this.dopeWidth * 1e9, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("Total Width (nm)", this.totalWidth * 1e9, 0, 0);
        }
        if (n === 4) {
            return new EditInfo("Mobility (um^2/(s*V))", this.mobility * 1e12, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.r_on = ei.value;
        }
        if (n === 1) {
            this.r_off = ei.value;
        }
        if (n === 2) {
            this.dopeWidth = ei.value * 1e-9;
        }
        if (n === 3) {
            this.totalWidth = ei.value * 1e-9;
        }
        if (n === 4) {
            this.mobility = ei.value * 1e-12;
        }
    }
}
Object.assign(MemristorElm.prototype, { "r_on": 0, "r_off": 0, "dopeWidth": 0, "totalWidth": 0, "mobility": 0, "resistance": 0, "ps3": null, "ps4": null });
