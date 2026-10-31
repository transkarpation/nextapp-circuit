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

// Changed 2026-10-31: converted from MonostableElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, ChipElm, ChipElm_Pin, CircuitElm, EditInfo, StringTokenizer, javaBoolean, newArray, parseJDouble } from '../core/internal';

export class MonostableElm extends ChipElm {
    //Used to detect rising edge
    declare prevInputValue: boolean;
    declare retriggerable: boolean;
    declare triggered: boolean;
    declare lastRisingEdge: number;
    declare delay: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.prevInputValue = false;
        this.retriggerable = false;
        this.triggered = false;
        this.lastRisingEdge = 0;
        this.delay = 0.01;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.prevInputValue = false;
        this.retriggerable = false;
        this.triggered = false;
        this.lastRisingEdge = 0;
        this.delay = 0.01;
        this.retriggerable = javaBoolean(st.nextToken$0());
        this.delay = parseJDouble(st.nextToken$0());
        return this;
    }
    getChipName(): string {
        return "Monostable";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 2;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "");
        this.pins[0].clock = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "Q");
        this.pins[1].output = true;
        this.pins[2] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "Q");
        this.pins[2].output = true;
        this.pins[2].lineOver = true;
    }
    getPostCount(): number {
        return 3;
    }
    getVoltageSourceCount(): number {
        return 2;
    }
    execute(): void {
        if (this.pins[0].value && this.prevInputValue !== this.pins[0].value && (this.retriggerable || !this.triggered)) {
            this.lastRisingEdge = CircuitElm.sim.t;
            this.pins[1].value = true;
            this.pins[2].value = false;
            this.triggered = true;
        }
        if (this.triggered && CircuitElm.sim.t > this.lastRisingEdge + this.delay) {
            this.pins[1].value = false;
            this.pins[2].value = true;
            this.triggered = false;
        }
        this.prevInputValue = this.pins[0].value;
    }
    dump(): string {
        return super.dump() + " " + this.retriggerable + " " + this.delay;
    }
    getDumpType(): number {
        return 194;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Retriggerable", this.retriggerable);
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("Period (s)", this.delay, 0.001, 0.1);
            return ei;
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2) {
            this.retriggerable = ei.checkbox.getState();
        }
        if (n === 3) {
            this.delay = ei.value;
        }
        super.setEditValue(n, ei);
    }
}
Object.assign(MonostableElm.prototype, { "prevInputValue": false, "retriggerable": false, "triggered": false, "lastRisingEdge": 0, "delay": 0 });
