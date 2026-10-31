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
// contributed by Edward Calver

// Changed 2026-10-31: converted from DeMultiplexerElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, EditInfo, StringTokenizer, newArray, parseJInt, toInt } from '../core/internal';

export class DeMultiplexerElm extends ChipElm {
    declare selectBitCount: number;
    declare outputCount: number;
    declare qPin: number;
    hasReset(): boolean {
        return false;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        try {
            this.selectBitCount = parseJInt(st.nextToken$0());
            this.setupPins();
            this.setPoints();
        } catch (e) {
        }
        return this;
    }
    getChipName(): string {
        return "demultiplexer";
    }
    dump(): string {
        return super.dump() + " " + this.selectBitCount;
    }
    setupPins(): void {
        if (this.selectBitCount === 0) {
            this.selectBitCount = 2;
        }
        this.outputCount = 1 << this.selectBitCount;
        this.sizeX = 1 + this.selectBitCount;
        this.sizeY = 1 + this.outputCount;
        this.pins = newArray(null, this.getPostCount());
        let i: number = 0;
        for (i = 0; i !== this.outputCount; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_E, "Q" + i);
            this.pins[i].output = true;
        }
        for (i = 0; i !== this.selectBitCount; i++) {
            let ii: number = i + this.outputCount;
            this.pins[ii] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_S, "S" + i);
        }
        this.qPin = this.outputCount + this.selectBitCount;
        this.pins[this.qPin] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "Q");
    }
    getPostCount(): number {
        return this.qPin + 1;
    }
    getVoltageSourceCount(): number {
        return this.outputCount;
    }
    execute(): void {
        let val: number = 0;
        let i: number = 0;
        for (i = 0; i !== this.selectBitCount; i++) {
            if (this.pins[i + this.outputCount].value) {
                val |= 1 << i;
            }
        }
        for (i = 0; i !== this.outputCount; i++) {
            this.pins[i].value = false;
        }
        this.pins[val].value = this.pins[this.qPin].value;
    }
    getEditInfo(n: number): EditInfo {
        if (n < 2) {
            return super.getEditInfo(n);
        }
        if (n === 2) {
            return new EditInfo("# of Select Bits", this.selectBitCount).setDimensionless();
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n < 2) {
            super.setEditValue(n, ei);
            return;
        }
        if (n === 2 && ei.value >= 1 && ei.value <= 6) {
            this.selectBitCount = toInt(ei.value);
            this.setupPins();
            this.setPoints();
        }
    }
    getDumpType(): number {
        return 185;
    }
}
Object.assign(DeMultiplexerElm.prototype, { "selectBitCount": 0, "outputCount": 0, "qPin": 0 });
