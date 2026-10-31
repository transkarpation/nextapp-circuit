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

// Changed 2026-10-31: converted from RingCounterElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, EditInfo, StringTokenizer, newArray, toInt } from '../core/internal';

export class RingCounterElm extends ChipElm {
    declare justLoaded: boolean;
    declare FLAG_CLOCK_INHIBIT: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.flags |= this.FLAG_CLOCK_INHIBIT;
        this.setupPins();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.justLoaded = true;
        return this;
    }
    getChipName(): string {
        return "ring counter";
    }
    needsBits(): boolean {
        return true;
    }
    hasClockInhibit(): boolean {
        return (this.flags & this.FLAG_CLOCK_INHIBIT) !== 0 && this.bits >= 3;
    }
    declare clockInhibit: number;
    setupPins(): void {
        this.sizeX = this.bits > 2 ? this.bits : 2;
        this.sizeY = 2;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "");
        this.pins[0].clock = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, this.sizeX - 1, ChipElm.SIDE_S, "R");
        this.pins[1].bubble = true;
        let i: number = 0;
        for (i = 0; i !== this.bits; i++) {
            let ii: number = i + 2;
            this.pins[ii] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_N, "Q" + i);
            this.pins[ii].output = this.pins[ii].state = true;
        }
        if (this.hasClockInhibit()) {
            this.clockInhibit = this.pins.length - 1;
            this.pins[this.clockInhibit] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_S, "CE");
            this.pins[this.clockInhibit].lineOver = true;
        } else {
            this.clockInhibit = -1;
        }
        this.allocNodes();
    }
    getPostCount(): number {
        return this.hasClockInhibit() ? this.bits + 3 : this.bits + 2;
    }
    getVoltageSourceCount(): number {
        return this.bits;
    }
    execute(): void {
        let i: number = 0;
        // if we just loaded then the volts[] array is likely to be all zeroes, which might force us to do a reset, so defer execution until the next iteration
        if (this.justLoaded) {
            this.justLoaded = false;
            return;
        }
        let running: boolean = true;
        if (this.hasClockInhibit() && this.pins[this.clockInhibit].value) {
            running = false;
        }
        if (this.pins[0].value && !this.lastClock && running) {
            for (i = 0; i !== this.bits; i++) {
                if (this.pins[i + 2].value) {
                    break;
                }
            }
            if (i < this.bits) {
                this.pins[i++ + 2].value = false;
            }
            i %= this.bits;
            this.pins[i + 2].value = true;
        }
        if (!this.pins[1].value) {
            for (i = 1; i !== this.bits; i++) {
                this.pins[i + 2].value = false;
            }
            this.pins[2].value = true;
        }
        this.lastClock = this.pins[0].value;
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
    getDumpType(): number {
        return 163;
    }
}
Object.assign(RingCounterElm.prototype, { "justLoaded": false, "FLAG_CLOCK_INHIBIT": 2, "clockInhibit": 0 });
