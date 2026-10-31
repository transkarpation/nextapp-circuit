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

// Changed 2026-10-31: converted from PhaseCompElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, StringTokenizer, newArray } from '../core/internal';

export class PhaseCompElm extends ChipElm {
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getChipName(): string {
        return "phase comparator";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 2;
        this.pins = newArray(null, 3);
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "I1");
        this.pins[1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "I2");
        this.pins[2] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "O");
        this.pins[2].output = true;
    }
    nonLinear(): boolean {
        return true;
    }
    stamp(): void {
        let vn: number = CircuitElm.sim.nodeList.size() + this.pins[2].voltSource;
        CircuitElm.sim.stampNonLinear(vn);
        CircuitElm.sim.stampNonLinear(0);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
    }
    declare ff1: boolean;
    declare ff2: boolean;
    doStep(): void {
        let v1: boolean = this.volts[0] > 2.5;
        let v2: boolean = this.volts[1] > 2.5;
        if (v1 && !this.pins[0].value) {
            this.ff1 = true;
        }
        if (v2 && !this.pins[1].value) {
            this.ff2 = true;
        }
        if (this.ff1 && this.ff2) {
            this.ff1 = this.ff2 = false;
        }
        let out: number = (this.ff1) ? 5 : (this.ff2) ? 0 : -1;
        //System.out.println(out + " " + v1 + " " + v2);
        if (out !== -1) {
            CircuitElm.sim.stampVoltageSource(0, this.nodes[2], this.pins[2].voltSource, out);
        } else {
            // tie current through output pin to 0
            let vn: number = CircuitElm.sim.nodeList.size() + this.pins[2].voltSource;
            CircuitElm.sim.stampMatrix(vn, vn, 1);
        }
        this.pins[0].value = v1;
        this.pins[1].value = v2;
    }
    getPostCount(): number {
        return 3;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getDumpType(): number {
        return 161;
    }
}
Object.assign(PhaseCompElm.prototype, { "ff1": false, "ff2": false });
