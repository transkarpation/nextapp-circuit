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

// Changed 2026-10-31: converted from SevenSegDecoderElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, StringTokenizer, newArray } from '../core/internal';

export class SevenSegDecoderElm extends ChipElm {
    static symbols: boolean[][] = [[true, true, true, true, true, true, false], [false, true, true, false, false, false, false], [true, true, false, true, true, false, true], [true, true, true, true, false, false, true], [false, true, true, false, false, true, true], [true, false, true, true, false, true, true], [true, false, true, true, true, true, true], [true, true, true, false, false, false, false], [true, true, true, true, true, true, true], [true, true, true, false, false, true, true], [true, true, true, false, true, true, true], [false, false, true, true, true, true, true], [true, false, false, true, true, true, false], [false, true, true, true, true, false, true], [true, false, false, true, true, true, true], [true, false, false, false, true, true, true]];
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
        return "Seven Segment LED Decoder";
    }
    setupPins(): void {
        this.sizeX = 3;
        this.sizeY = 7;
        this.pins = newArray(null, this.getPostCount());
        this.pins[7] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "I3");
        this.pins[8] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "I2");
        this.pins[9] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_W, "I1");
        this.pins[10] = new ChipElm_Pin().init$3(this, 3, ChipElm.SIDE_W, "I0");
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "a");
        this.pins[0].output = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "b");
        this.pins[1].output = true;
        this.pins[2] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_E, "c");
        this.pins[2].output = true;
        this.pins[3] = new ChipElm_Pin().init$3(this, 3, ChipElm.SIDE_E, "d");
        this.pins[3].output = true;
        this.pins[4] = new ChipElm_Pin().init$3(this, 4, ChipElm.SIDE_E, "e");
        this.pins[4].output = true;
        this.pins[5] = new ChipElm_Pin().init$3(this, 5, ChipElm.SIDE_E, "f");
        this.pins[5].output = true;
        this.pins[6] = new ChipElm_Pin().init$3(this, 6, ChipElm.SIDE_E, "g");
        this.pins[6].output = true;
    }
    getPostCount(): number {
        return 11;
    }
    getVoltageSourceCount(): number {
        return 7;
    }
    execute(): void {
        let input: number = 0;
        if (this.pins[7].value) {
            input += 8;
        }
        if (this.pins[8].value) {
            input += 4;
        }
        if (this.pins[9].value) {
            input += 2;
        }
        if (this.pins[10].value) {
            input += 1;
        }
        for (let i: number = 0; i < 7; i++) {
            this.pins[i].value = SevenSegDecoderElm.symbols[input][i];
        }
    }
    getDumpType(): number {
        return 197;
    }
}
