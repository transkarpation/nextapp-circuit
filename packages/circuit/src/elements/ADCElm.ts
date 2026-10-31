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

// Changed 2026-10-31: converted from ADCElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, StringTokenizer, newArray, toInt } from '../core/internal';

export class ADCElm extends ChipElm {
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getChipName(): string {
        return "ADC";
    }
    needsBits(): boolean {
        return true;
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = this.bits > 2 ? this.bits : 2;
        this.pins = newArray(null, this.getPostCount());
        let i: number = 0;
        for (i = 0; i !== this.bits; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, this.bits - 1 - i, ChipElm.SIDE_E, "D" + i);
            this.pins[i].output = true;
        }
        this.pins[this.bits] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "In");
        this.pins[this.bits + 1] = new ChipElm_Pin().init$3(this, this.sizeY - 1, ChipElm.SIDE_W, "V+");
        this.allocNodes();
    }
    execute(): void {
        let imax: number = (1 << this.bits) - 1;
        // if we round, the half-flash doesn't work
        let val: number = imax * this.volts[this.bits] / this.volts[this.bits + 1];
        // + .5;
        let ival: number = toInt(val);
        ival = CircuitElm.min(imax, CircuitElm.max(0, ival));
        let i: number = 0;
        for (i = 0; i !== this.bits; i++) {
            this.pins[i].value = ((ival & (1 << i)) !== 0);
        }
    }
    getVoltageSourceCount(): number {
        return this.bits;
    }
    getPostCount(): number {
        return this.bits + 2;
    }
    getDumpType(): number {
        return 167;
    }
}
