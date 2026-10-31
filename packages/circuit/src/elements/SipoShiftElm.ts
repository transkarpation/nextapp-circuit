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

// Changed 2026-10-31: converted from SipoShiftElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, StringTokenizer, newArray } from '../core/internal';

export class SipoShiftElm extends ChipElm {
    hasReset(): boolean {
        return false;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.data = 0;
        this.clockstate = false;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.data = 0;
        this.clockstate = false;
        return this;
    }
    declare data: number;
    //This has to be a short because there's no unsigned byte and it's screwing with my code
    declare clockstate: boolean;
    getChipName(): string {
        return "SIPO shift register";
    }
    setupPins(): void {
        this.sizeX = 9;
        this.sizeY = 3;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "D");
        this.pins[1] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_W, "");
        this.pins[1].clock = true;
        this.pins[2] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_N, "I7");
        this.pins[2].output = true;
        this.pins[3] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_N, "I6");
        this.pins[3].output = true;
        this.pins[4] = new ChipElm_Pin().init$3(this, 3, ChipElm.SIDE_N, "I5");
        this.pins[4].output = true;
        this.pins[5] = new ChipElm_Pin().init$3(this, 4, ChipElm.SIDE_N, "I4");
        this.pins[5].output = true;
        this.pins[6] = new ChipElm_Pin().init$3(this, 5, ChipElm.SIDE_N, "I3");
        this.pins[6].output = true;
        this.pins[7] = new ChipElm_Pin().init$3(this, 6, ChipElm.SIDE_N, "I2");
        this.pins[7].output = true;
        this.pins[8] = new ChipElm_Pin().init$3(this, 7, ChipElm.SIDE_N, "I1");
        this.pins[8].output = true;
        this.pins[9] = new ChipElm_Pin().init$3(this, 8, ChipElm.SIDE_N, "I0");
        this.pins[9].output = true;
    }
    getPostCount(): number {
        return 10;
    }
    getVoltageSourceCount(): number {
        return 8;
    }
    execute(): void {
        if (this.pins[1].value && !this.clockstate) {
            this.clockstate = true;
            this.data = (this.data >>> 1);
            if (this.pins[0].value) {
                this.data += 128;
            }
            if ((this.data & 128) > 0) {
                this.pins[2].value = true;
            } else {
                this.pins[2].value = false;
            }
            if ((this.data & 64) > 0) {
                this.pins[3].value = true;
            } else {
                this.pins[3].value = false;
            }
            if ((this.data & 32) > 0) {
                this.pins[4].value = true;
            } else {
                this.pins[4].value = false;
            }
            if ((this.data & 16) > 0) {
                this.pins[5].value = true;
            } else {
                this.pins[5].value = false;
            }
            if ((this.data & 8) > 0) {
                this.pins[6].value = true;
            } else {
                this.pins[6].value = false;
            }
            if ((this.data & 4) > 0) {
                this.pins[7].value = true;
            } else {
                this.pins[7].value = false;
            }
            if ((this.data & 2) > 0) {
                this.pins[8].value = true;
            } else {
                this.pins[8].value = false;
            }
            if ((this.data & 1) > 0) {
                this.pins[9].value = true;
            } else {
                this.pins[9].value = false;
            }
        }
        if (!this.pins[1].value) {
            this.clockstate = false;
        }
    }
    getDumpType(): number {
        return 189;
    }
}
Object.assign(SipoShiftElm.prototype, { "data": 0, "clockstate": false });
