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

// Changed 2026-10-31: converted from CC2Elm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, Graphics, StringTokenizer, newArray, parseJDouble } from '../core/internal';

export class CC2Elm extends ChipElm {
    declare gain: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.gain = 1;
        return this;
    }
    init$3(xx: number, yy: number, g: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.gain = g;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.gain = parseJDouble(st.nextToken$0());
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.gain;
    }
    getChipName(): string {
        return "CC2";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 3;
        this.pins = newArray(null, 3);
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "X");
        this.pins[0].output = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_W, "Y");
        this.pins[2] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "Z");
    }
    getInfo(arr: string[]): void {
        arr[0] = (this.gain === 1) ? "CCII+~" : "CCII-~";
        // ~ is for localization
        arr[1] = "X,Y = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[2] = "Z = " + CircuitElm.getVoltageText(this.volts[2]);
        arr[3] = "I = " + CircuitElm.getCurrentText(this.pins[0].current);
    }
    //boolean nonLinear() { return true; }
    stamp(): void {
        // X voltage = Y voltage
        CircuitElm.sim.stampVoltageSource(0, this.nodes[0], this.pins[0].voltSource);
        CircuitElm.sim.stampVCVS(0, this.nodes[1], 1, this.pins[0].voltSource);
        // Z current = gain * X current
        CircuitElm.sim.stampCCCS(0, this.nodes[2], this.pins[0].voltSource, this.gain);
    }
    draw(g: Graphics): void {
        this.pins[2].current = this.pins[0].current * this.gain;
        this.drawChip(g);
    }
    getPostCount(): number {
        return 3;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getDumpType(): number {
        return 179;
    }
}
Object.assign(CC2Elm.prototype, { "gain": 0 });

export class CC2NegElm extends CC2Elm {
    init$2(xx: number, yy: number): this {
        CC2Elm.prototype.init$3.call(this, xx, yy, -1);
        return this;
    }
    getDumpClass(): any {
        return CC2Elm;
    }
}
