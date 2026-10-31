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

// Changed 2026-10-31: converted from MultiplexerElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, EditInfo, StringTokenizer, newArray, parseJInt, toInt } from '../core/internal';

export class MultiplexerElm extends ChipElm {
    declare selectBitCount: number;
    declare outputCount: number;
    hasReset(): boolean {
        return false;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.selectBitCount = 2;
        this.setupPins();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.selectBitCount = 2;
        try {
            this.selectBitCount = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        this.setupPins();
        return this;
    }
    getChipName(): string {
        return "Multiplexer";
    }
    dump(): string {
        return super.dump() + " " + this.selectBitCount;
    }
    setupPins(): void {
        this.sizeX = this.selectBitCount + 1;
        this.outputCount = 1;
        let i: number = 0;
        for (i = 0; i !== this.selectBitCount; i++) {
            this.outputCount <<= 1;
        }
        this.sizeY = this.outputCount + 1;
        this.pins = newArray(null, this.getPostCount());
        for (i = 0; i !== this.outputCount; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_W, "I" + i);
        }
        let n: number = this.outputCount;
        for (i = 0; i !== this.selectBitCount; i++, n++) {
            this.pins[n] = new ChipElm_Pin().init$3(this, i + 1, ChipElm.SIDE_S, "S" + i);
        }
        this.pins[n] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "Q");
        this.pins[n].output = true;
        this.allocNodes();
    }
    getPostCount(): number {
        return this.outputCount + this.selectBitCount + 1;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    execute(): void {
        let selectedValue: number = 0;
        let i: number = 0;
        for (i = 0; i !== this.selectBitCount; i++) {
            if (this.pins[this.outputCount + i].value) {
                selectedValue |= 1 << i;
            }
        }
        this.pins[this.outputCount + this.selectBitCount].value = this.pins[selectedValue].value;
    }
    getDumpType(): number {
        return 184;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            return new EditInfo("# of Select Bits", this.selectBitCount, 1, 8).setDimensionless();
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2 && ei.value >= 1 && ei.value <= 6) {
            this.selectBitCount = toInt(ei.value);
            this.setupPins();
            this.setPoints();
            return;
        }
        super.setEditValue(n, ei);
    }
}
Object.assign(MultiplexerElm.prototype, { "selectBitCount": 0, "outputCount": 0 });
