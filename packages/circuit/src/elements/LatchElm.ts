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

// Changed 2026-10-31: converted from LatchElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, EditInfo, StringTokenizer, newArray, toInt } from '../core/internal';

export class LatchElm extends ChipElm {
    declare FLAG_STATE: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.lastLoad = false;
        this.flags = this.FLAG_STATE;
        this.setupPins();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.lastLoad = false;
        // add FLAG_STATE flag to old latches so their state gets saved
        if ((this.flags & this.FLAG_STATE) === 0) {
            this.flags |= this.FLAG_STATE;
            this.setupPins();
        }
        return this;
    }
    getChipName(): string {
        return "Latch";
    }
    needsBits(): boolean {
        return true;
    }
    declare loadPin: number;
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = this.bits + 1;
        this.pins = newArray(null, this.getPostCount());
        let i: number = 0;
        for (i = 0; i !== this.bits; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, this.bits - 1 - i, ChipElm.SIDE_W, "I" + i);
        }
        for (i = 0; i !== this.bits; i++) {
            this.pins[i + this.bits] = new ChipElm_Pin().init$3(this, this.bits - 1 - i, ChipElm.SIDE_E, "O");
            this.pins[i + this.bits].output = true;
            this.pins[i + this.bits].state = (this.flags & this.FLAG_STATE) !== 0;
        }
        this.pins[this.loadPin = this.bits * 2] = new ChipElm_Pin().init$3(this, this.bits, ChipElm.SIDE_W, "Ld");
        this.allocNodes();
    }
    declare lastLoad: boolean;
    execute(): void {
        let i: number = 0;
        if (this.pins[this.loadPin].value && !this.lastLoad) {
            for (i = 0; i !== this.bits; i++) {
                this.pins[i + this.bits].value = this.pins[i].value;
            }
        }
        this.lastLoad = this.pins[this.loadPin].value;
    }
    getVoltageSourceCount(): number {
        return this.bits;
    }
    getPostCount(): number {
        return this.bits * 2 + 1;
    }
    getDumpType(): number {
        return 168;
    }
    getEditInfo(n: number): EditInfo {
        if (n < 2) {
            return super.getEditInfo(n);
        }
        if (n === 2) {
            return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n < 2) {
            super.setEditValue(n, ei);
            return;
        }
        if (n === 2 && ei.value >= 2) {
            this.bits = toInt(ei.value);
            this.setupPins();
            this.setPoints();
        }
    }
}
Object.assign(LatchElm.prototype, { "FLAG_STATE": 2, "loadPin": 0, "lastLoad": false });
