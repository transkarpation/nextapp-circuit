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

// Changed 2026-10-31: converted from HalfAdderElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, StringTokenizer, boolOp, newArray } from '../core/internal';

export class HalfAdderElm extends ChipElm {
    hasReset(): boolean {
        return false;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getChipName(): string {
        return "Half Adder";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 2;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "S");
        this.pins[0].output = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "C");
        this.pins[1].output = true;
        this.pins[2] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "A");
        this.pins[3] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "B");
    }
    getPostCount(): number {
        return 4;
    }
    getVoltageSourceCount(): number {
        return 2;
    }
    execute(): void {
        this.pins[0].value = boolOp('^', this.pins[2].value, this.pins[3].value);
        this.pins[1].value = this.pins[2].value && this.pins[3].value;
    }
    getDumpType(): number {
        return 195;
    }
}
