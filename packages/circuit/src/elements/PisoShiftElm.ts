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

// Changed 2026-10-31: converted from PisoShiftElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, StringTokenizer, newArray, toByte } from '../core/internal';

export class PisoShiftElm extends ChipElm {
    hasReset(): boolean {
        return false;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.data = 0;
        this.clockstate = false;
        this.modestate = false;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.data = 0;
        this.clockstate = false;
        this.modestate = false;
        return this;
    }
    declare data: number;
    //Lack of unsigned types sucks
    declare clockstate: boolean;
    declare modestate: boolean;
    getChipName(): string {
        return "PISO shift register";
    }
    setupPins(): void {
        this.sizeX = 10;
        this.sizeY = 3;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "L");
        this.pins[1] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_W, "");
        this.pins[1].clock = true;
        this.pins[2] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_N, "I7");
        this.pins[3] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_N, "I6");
        this.pins[4] = new ChipElm_Pin().init$3(this, 3, ChipElm.SIDE_N, "I5");
        this.pins[5] = new ChipElm_Pin().init$3(this, 4, ChipElm.SIDE_N, "I4");
        this.pins[6] = new ChipElm_Pin().init$3(this, 5, ChipElm.SIDE_N, "I3");
        this.pins[7] = new ChipElm_Pin().init$3(this, 6, ChipElm.SIDE_N, "I2");
        this.pins[8] = new ChipElm_Pin().init$3(this, 7, ChipElm.SIDE_N, "I1");
        this.pins[9] = new ChipElm_Pin().init$3(this, 8, ChipElm.SIDE_N, "I0");
        this.pins[10] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "Q");
        this.pins[10].output = true;
    }
    getPostCount(): number {
        return 11;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    execute(): void {
        if (this.pins[0].value && !this.modestate) {
            this.modestate = true;
            this.data = 0;
            if (this.pins[2].value) {
                this.data += 128;
            }
            if (this.pins[3].value) {
                this.data += 64;
            }
            if (this.pins[4].value) {
                this.data += 32;
            }
            if (this.pins[5].value) {
                this.data += 16;
            }
            if (this.pins[6].value) {
                this.data += 8;
            }
            if (this.pins[7].value) {
                this.data += 4;
            }
            if (this.pins[8].value) {
                this.data += 2;
            }
            if (this.pins[9].value) {
                this.data += 1;
            }
        } else if (this.pins[1].value && !this.clockstate) {
            this.clockstate = true;
            if ((this.data & 1) === 0) {
                this.pins[10].value = false;
            } else {
                this.pins[10].value = true;
            }
            this.data = toByte((this.data >>> 1));
        }
        if (!this.pins[0].value) {
            this.modestate = false;
        }
        if (!this.pins[1].value) {
            this.clockstate = false;
        }
    }
    getDumpType(): number {
        return 186;
    }
}
Object.assign(PisoShiftElm.prototype, { "data": 0, "clockstate": false, "modestate": false });
