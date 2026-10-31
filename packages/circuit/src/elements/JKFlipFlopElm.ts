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

// Changed 2026-10-31: converted from JKFlipFlopElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, ChipElm, ChipElm_Pin, EditInfo, StringTokenizer, newArray } from '../core/internal';

export class JKFlipFlopElm extends ChipElm {
    declare FLAG_RESET: number;
    declare FLAG_POSITIVE_EDGE: number;
    hasReset(): boolean {
        return (this.flags & this.FLAG_RESET) !== 0;
    }
    positiveEdgeTriggered(): boolean {
        return (this.flags & this.FLAG_POSITIVE_EDGE) !== 0;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.pins[4].value = !this.pins[3].value;
        return this;
    }
    getChipName(): string {
        return "JK flip-flop";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 3;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "J");
        this.pins[1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "");
        this.pins[1].clock = true;
        this.pins[1].bubble = !this.positiveEdgeTriggered();
        this.pins[2] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_W, "K");
        this.pins[3] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "Q");
        this.pins[3].output = this.pins[3].state = true;
        this.pins[4] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_E, "Q");
        this.pins[4].output = true;
        this.pins[4].lineOver = true;
        if (this.hasReset()) {
            this.pins[5] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "R");
        }
    }
    getPostCount(): number {
        return 5 + (this.hasReset() ? 1 : 0);
    }
    getVoltageSourceCount(): number {
        return 2;
    }
    execute(): void {
        let transition: boolean = false;
        if (this.positiveEdgeTriggered()) {
            transition = this.pins[1].value && !this.lastClock;
        } else {
            transition = !this.pins[1].value && this.lastClock;
        }
        if (transition) {
            let q: boolean = this.pins[3].value;
            if (this.pins[0].value) {
                if (this.pins[2].value) {
                    q = !q;
                } else {
                    q = true;
                }
            } else if (this.pins[2].value) {
                q = false;
            }
            this.pins[3].value = q;
            this.pins[4].value = !q;
        }
        this.lastClock = this.pins[1].value;
        if (this.hasReset()) {
            if (this.pins[5].value) {
                this.pins[3].value = false;
                this.pins[4].value = true;
            }
        }
    }
    getDumpType(): number {
        return 156;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Reset Pin", this.hasReset());
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Positive Edge Triggered", this.positiveEdgeTriggered());
            return ei;
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_RESET;
            } else {
                this.flags &= ~this.FLAG_RESET;
            }
            this.setupPins();
            this.allocNodes();
            this.setPoints();
        }
        if (n === 3) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_POSITIVE_EDGE);
            this.pins[1].bubble = !this.positiveEdgeTriggered();
        }
        super.setEditValue(n, ei);
    }
}
Object.assign(JKFlipFlopElm.prototype, { "FLAG_RESET": 2, "FLAG_POSITIVE_EDGE": 4 });
