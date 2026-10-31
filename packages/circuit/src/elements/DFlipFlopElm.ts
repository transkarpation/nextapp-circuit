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

// Changed 2026-10-31: converted from DFlipFlopElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, ChipElm, ChipElm_Pin, EditInfo, StringTokenizer, newArray } from '../core/internal';

export class DFlipFlopElm extends ChipElm {
    declare FLAG_RESET: number;
    declare FLAG_SET: number;
    hasReset(): boolean {
        return (this.flags & this.FLAG_RESET) !== 0 || this.hasSet();
    }
    hasSet(): boolean {
        return (this.flags & this.FLAG_SET) !== 0;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.pins[2].value = !this.pins[1].value;
        return this;
    }
    getChipName(): string {
        return "D flip-flop";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 3;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "D");
        this.pins[1] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "Q");
        this.pins[1].output = this.pins[1].state = true;
        this.pins[2] = new ChipElm_Pin().init$3(this, this.hasSet() ? 1 : 2, ChipElm.SIDE_E, "Q");
        this.pins[2].output = true;
        this.pins[2].lineOver = true;
        this.pins[3] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "");
        this.pins[3].clock = true;
        if (!this.hasSet()) {
            if (this.hasReset()) {
                this.pins[4] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_W, "R");
            }
        } else {
            this.pins[5] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_W, "S");
            this.pins[4] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_E, "R");
        }
    }
    getPostCount(): number {
        return 4 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0);
    }
    getVoltageSourceCount(): number {
        return 2;
    }
    reset(): void {
        super.reset();
        this.volts[2] = 5;
        this.pins[2].value = true;
    }
    execute(): void {
        if (this.pins[3].value && !this.lastClock) {
            this.pins[1].value = this.pins[0].value;
            this.pins[2].value = !this.pins[0].value;
        }
        if (this.hasSet() && this.pins[5].value) {
            this.pins[1].value = true;
            this.pins[2].value = false;
        }
        if (this.hasReset() && this.pins[4].value) {
            this.pins[1].value = false;
            this.pins[2].value = true;
        }
        this.lastClock = this.pins[3].value;
    }
    getDumpType(): number {
        return 155;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Reset Pin", this.hasReset());
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Set Pin", this.hasSet());
            return ei;
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_RESET;
            } else {
                this.flags &= ~this.FLAG_RESET | this.FLAG_SET;
            }
            this.setupPins();
            this.allocNodes();
            this.setPoints();
        }
        if (n === 3) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_SET;
            } else {
                this.flags &= ~this.FLAG_SET;
            }
            this.setupPins();
            this.allocNodes();
            this.setPoints();
        }
        super.setEditValue(n, ei);
    }
}
Object.assign(DFlipFlopElm.prototype, { "FLAG_RESET": 2, "FLAG_SET": 4 });
