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
// concrete subclass of ChipElm that can be used by other elements (like CustomCompositeElm) to draw chips.
// CustomCompositeElm can't be a subclass of both ChipElm and CompositeElm.

// Changed 2026-10-31: converted from CustomCompositeChipElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, newArray } from '../core/internal';

export class CustomCompositeChipElm extends ChipElm {
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.setSize(2);
        return this;
    }
    needsBits(): boolean {
        return false;
    }
    setupPins(): void {
    }
    getVoltageSourceCount(): number {
        return 0;
    }
    setPins(p: ChipElm_Pin[]): void {
        this.pins = p;
    }
    allocPins(n: number): void {
        this.pins = newArray(null, n);
    }
    setPin$4(n: number, p: number, s: number, t: string): void {
        this.pins[n] = new ChipElm_Pin().init$3(this, p, s, t);
        this.pins[n].fixName();
    }
    getPostCount(): number {
        return this.pins == null ? 1 : this.pins.length;
    }
}
