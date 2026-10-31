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

// Changed 2026-10-31: converted from SeqGenElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, ChipElm, ChipElm_Pin, CircuitElm, EditInfo, StringTokenizer, javaBoolean, newArray, parseJInt } from '../core/internal';

export class SeqGenElm extends ChipElm {
    hasReset(): boolean {
        return false;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.data = 0;
        this.position = 0;
        this.oneshot = false;
        this.lastchangetime = 0;
        this.clockstate = false;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.data = 0;
        this.position = 0;
        this.oneshot = false;
        this.lastchangetime = 0;
        this.clockstate = false;
        this.data = (parseJInt(st.nextToken$0()));
        if (st.hasMoreTokens()) {
            this.oneshot = javaBoolean(st.nextToken$0());
            this.position = 8;
        }
        return this;
    }
    declare data: number;
    declare position: number;
    declare oneshot: boolean;
    declare lastchangetime: number;
    declare clockstate: boolean;
    getChipName(): string {
        return "Sequence generator";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 2;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "");
        this.pins[0].clock = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "Q");
        this.pins[1].output = true;
    }
    getPostCount(): number {
        return 2;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    GetNextBit(): void {
        if (((this.data >>> this.position) & 1) !== 0) {
            this.pins[1].value = true;
        } else {
            this.pins[1].value = false;
        }
        this.position++;
    }
    execute(): void {
        if (this.oneshot) {
            if (CircuitElm.sim.t - this.lastchangetime > 0.005) {
                if (this.position <= 8) {
                    this.GetNextBit();
                }
                this.lastchangetime = CircuitElm.sim.t;
            }
        }
        if (this.pins[0].value && !this.clockstate) {
            this.clockstate = true;
            if (this.oneshot) {
                this.position = 0;
            } else {
                this.GetNextBit();
                if (this.position >= 8) {
                    this.position = 0;
                }
            }
        }
        if (!this.pins[0].value) {
            this.clockstate = false;
        }
    }
    getDumpType(): number {
        return 188;
    }
    dump(): string {
        return super.dump() + " " + this.data + " " + this.oneshot;
    }
    getEditInfo(n: number): EditInfo {
        //My code
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 0 set", (this.data & 1) !== 0);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 1 set", (this.data & 2) !== 0);
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 2 set", (this.data & 4) !== 0);
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 3 set", (this.data & 8) !== 0);
            return ei;
        }
        if (n === 4) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 4 set", (this.data & 16) !== 0);
            return ei;
        }
        if (n === 5) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 5 set", (this.data & 32) !== 0);
            return ei;
        }
        if (n === 6) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 6 set", (this.data & 64) !== 0);
            return ei;
        }
        if (n === 7) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bit 7 set", (this.data & 128) !== 0);
            return ei;
        }
        if (n === 8) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("One shot", this.oneshot);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            if (ei.checkbox.getState()) {
                this.data |= 1;
            } else {
                this.data &= ~1;
            }
            this.setPoints();
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.data |= 2;
            } else {
                this.data &= ~2;
            }
            this.setPoints();
        }
        if (n === 2) {
            if (ei.checkbox.getState()) {
                this.data |= 4;
            } else {
                this.data &= ~4;
            }
            this.setPoints();
        }
        if (n === 3) {
            if (ei.checkbox.getState()) {
                this.data |= 8;
            } else {
                this.data &= ~8;
            }
            this.setPoints();
        }
        if (n === 4) {
            if (ei.checkbox.getState()) {
                this.data |= 16;
            } else {
                this.data &= ~16;
            }
            this.setPoints();
        }
        if (n === 5) {
            if (ei.checkbox.getState()) {
                this.data |= 32;
            } else {
                this.data &= ~32;
            }
            this.setPoints();
        }
        if (n === 6) {
            if (ei.checkbox.getState()) {
                this.data |= 64;
            } else {
                this.data &= ~64;
            }
            this.setPoints();
        }
        if (n === 7) {
            if (ei.checkbox.getState()) {
                this.data |= 128;
            } else {
                this.data &= ~128;
            }
            this.setPoints();
        }
        if (n === 8) {
            if (ei.checkbox.getState()) {
                this.oneshot = true;
                this.position = 8;
            } else {
                this.position = 0;
                this.oneshot = false;
            }
        }
    }
}
Object.assign(SeqGenElm.prototype, { "data": 0, "position": 0, "oneshot": false, "lastchangetime": 0, "clockstate": false });
