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

// Changed 2026-10-31: converted from TimeDelayRelayElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, EditInfo, Graphics, StringTokenizer, newArray, parseJDouble } from '../core/internal';

export class TimeDelayRelayElm extends ChipElm {
    declare lastTransition: number;
    declare poweredState: boolean;
    declare onState: boolean;
    declare vinResistance: number;
    declare resistance: number;
    declare onDelay: number;
    declare offDelay: number;
    declare onResistance: number;
    declare offResistance: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.onDelay = 1;
        this.offDelay = 0;
        this.onResistance = 1;
        this.offResistance = this.resistance = 10e6;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.onDelay = parseJDouble(st.nextToken$0());
        this.offDelay = parseJDouble(st.nextToken$0());
        this.onResistance = parseJDouble(st.nextToken$0());
        this.offResistance = this.resistance = parseJDouble(st.nextToken$0());
        return this;
    }
    reset(): void {
        this.lastTransition = 0;
        this.poweredState = this.onState = false;
    }
    dump(): string {
        return super.dump() + " " + this.onDelay + " " + this.offDelay + " " + this.onResistance + " " + this.offResistance;
    }
    getChipName(): string {
        return "time delay relay";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 2;
        this.pins = newArray(null, 4);
        this.pins[0] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "Vin");
        this.pins[1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "gnd");
        this.pins[2] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "in");
        this.pins[3] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "out");
    }
    nonLinear(): boolean {
        return true;
    }
    stamp(): void {
        this.resistance = (this.onState) ? this.onResistance : this.offResistance;
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.vinResistance);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
        CircuitElm.sim.stampNonLinear(this.nodes[3]);
    }
    doStep(): void {
        this.resistance = (this.onState) ? this.onResistance : this.offResistance;
        CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[3], this.resistance);
    }
    stepFinished(): void {
        let oldState: boolean = this.poweredState;
        this.poweredState = (this.volts[0] - this.volts[1] > 2.5);
        if (oldState !== this.poweredState) {
            this.lastTransition = CircuitElm.sim.t;
        }
        if (CircuitElm.sim.t > this.lastTransition + (this.poweredState ? this.onDelay : this.offDelay)) {
            this.onState = this.poweredState;
        }
    }
    draw(g: Graphics): void {
        this.pins[0].current = -(this.volts[0] - this.volts[1]) / this.vinResistance;
        this.pins[2].current = -(this.volts[2] - this.volts[3]) / this.resistance;
        this.pins[1].current = -this.pins[0].current;
        this.pins[3].current = -this.pins[2].current;
        this.drawChip(g);
    }
    getPostCount(): number {
        return 4;
    }
    getVoltageSourceCount(): number {
        return 0;
    }
    getDumpType(): number {
        return 414;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("On Delay (s)", this.onDelay, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Off Delay (s)", this.offDelay, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("On Resistance (ohms)", this.onResistance, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("Off Resistance (ohms)", this.offResistance, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.onDelay = ei.value;
        }
        if (n === 1) {
            this.offDelay = ei.value;
        }
        if (n === 2 && ei.value > 0) {
            this.onResistance = ei.value;
        }
        if (n === 3 && ei.value > 0) {
            this.offResistance = ei.value;
        }
    }
}
Object.assign(TimeDelayRelayElm.prototype, { "lastTransition": 0, "poweredState": false, "onState": false, "vinResistance": 10e3, "resistance": 0, "onDelay": 0, "offDelay": 0, "onResistance": 0, "offResistance": 0 });
