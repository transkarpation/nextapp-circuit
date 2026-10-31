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

// Changed 2026-10-31: converted from CounterElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, ChipElm, ChipElm_Pin, EditInfo, StringTokenizer, javaBoolean, newArray, parseJInt, toInt } from '../core/internal';

export class CounterElm extends ChipElm {
    declare invertreset: boolean;
    declare modulus: number;
    declare FLAG_UP_DOWN: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.invertreset = true;
        try {
            this.invertreset = javaBoolean(st.nextToken$0());
            this.modulus = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        this.pins[1].bubble = this.invertreset;
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.invertreset + " " + this.modulus;
    }
    needsBits(): boolean {
        return true;
    }
    getChipName(): string {
        return "Counter";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = this.bits > 2 ? this.bits : 2;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "");
        this.pins[0].clock = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, this.sizeY - 1, ChipElm.SIDE_W, "R");
        this.pins[1].bubble = this.invertreset;
        let i: number = 0;
        for (i = 0; i !== this.bits; i++) {
            let ii: number = i + 2;
            this.pins[ii] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_E, "Q" + (this.bits - i - 1));
            this.pins[ii].output = this.pins[ii].state = true;
        }
        if (this.hasUpDown()) {
            this.pins[this.bits + 2] = new ChipElm_Pin().init$3(this, this.sizeY - 2, ChipElm.SIDE_W, "U/D");
        }
        this.allocNodes();
    }
    getPostCount(): number {
        return (this.hasUpDown()) ? this.bits + 3 : this.bits + 2;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Flip X", (this.flags & this.FLAG_FLIP_X) !== 0);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Flip Y", (this.flags & this.FLAG_FLIP_Y) !== 0);
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Invert reset pin", this.invertreset);
            return ei;
        }
        if (n === 3) {
            return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
        }
        if (n === 4) {
            return new EditInfo("Modulus", this.modulus, 1, 1).setDimensionless();
        }
        if (n === 5) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Up/Down Pin", this.hasUpDown());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_FLIP_X;
            } else {
                this.flags &= ~this.FLAG_FLIP_X;
            }
            this.setPoints();
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_FLIP_Y;
            } else {
                this.flags &= ~this.FLAG_FLIP_Y;
            }
            this.setPoints();
        }
        if (n === 2) {
            this.invertreset = ei.checkbox.getState();
            this.setupPins();
            this.setPoints();
        }
        if (n === 3 && ei.value >= 3) {
            this.bits = toInt(ei.value);
            this.setupPins();
            this.setPoints();
        }
        if (n === 4) {
            this.modulus = toInt(ei.value);
        }
        if (n === 5) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_UP_DOWN);
            this.setupPins();
            this.setPoints();
        }
    }
    hasUpDown(): boolean {
        return (this.flags & this.FLAG_UP_DOWN) !== 0;
    }
    getVoltageSourceCount(): number {
        return this.bits;
    }
    execute(): void {
        if (this.pins[0].value && !this.lastClock) {
            let i: number = 0;
            let value: number = 0;
            // get direction
            let dir: number = 1;
            if (this.hasUpDown() && this.pins[this.bits + 2].value) {
                dir = -1;
            }
            // get current value
            let lastBit: number = 2 + this.bits - 1;
            for (i = 0; i !== this.bits; i++) {
                if (this.pins[lastBit - i].value) {
                    value |= 1 << i;
                }
            }
            // update value
            value += dir;
            if (this.modulus !== 0) {
                value = (value + this.modulus) % this.modulus;
            }
            // convert value to binary
            for (i = 0; i !== this.bits; i++) {
                this.pins[lastBit - i].value = (value & (1 << i)) !== 0;
            }
        }
        if (!this.pins[1].value === this.invertreset) {
            let i: number = 0;
            for (i = 0; i !== this.bits; i++) {
                this.pins[i + 2].value = false;
            }
        }
        this.lastClock = this.pins[0].value;
    }
    getDumpType(): number {
        return 164;
    }
}
Object.assign(CounterElm.prototype, { "invertreset": false, "modulus": 0, "FLAG_UP_DOWN": 4 });
