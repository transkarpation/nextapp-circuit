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

// Changed 2026-10-31: converted from TimerElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, ChipElm, ChipElm_Pin, CircuitElm, EditInfo, StringTokenizer, newArray } from '../core/internal';

export class TimerElm extends ChipElm {
    declare FLAG_RESET: number;
    declare FLAG_GROUND: number;
    declare N_DIS: number;
    declare N_TRIG: number;
    declare N_THRES: number;
    declare N_VIN: number;
    declare N_CTL: number;
    declare N_OUT: number;
    declare N_RST: number;
    declare N_GND: number;
    getDefaultFlags(): number {
        return this.FLAG_RESET | this.FLAG_GROUND;
    }
    declare ground: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getChipName(): string {
        return "555 Timer";
    }
    setupPins(): void {
        this.sizeX = 3;
        this.sizeY = 5;
        this.pins = newArray(null, 8);
        this.pins[this.N_DIS] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_W, "dis");
        this.pins[this.N_TRIG] = new ChipElm_Pin().init$3(this, 3, ChipElm.SIDE_W, "tr");
        this.pins[this.N_TRIG].lineOver = true;
        this.pins[this.N_THRES] = new ChipElm_Pin().init$3(this, 4, ChipElm.SIDE_W, "th");
        this.pins[this.N_VIN] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_N, "Vin");
        this.pins[this.N_CTL] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_S, "ctl");
        this.pins[this.N_OUT] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_E, "out");
        this.pins[this.N_OUT].state = true;
        this.pins[this.N_RST] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "rst");
        this.pins[this.N_GND] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_S, "gnd");
    }
    nonLinear(): boolean {
        return true;
    }
    hasReset(): boolean {
        return (this.flags & this.FLAG_RESET) !== 0 || this.hasGroundPin();
    }
    hasGroundPin(): boolean {
        return (this.flags & this.FLAG_GROUND) !== 0;
    }
    stamp(): void {
        this.ground = this.hasGroundPin() ? this.nodes[this.N_GND] : 0;
        // stamp voltage divider to put ctl pin at 2/3 V
        CircuitElm.sim.stampResistor(this.nodes[this.N_VIN], this.nodes[this.N_CTL], 5000);
        CircuitElm.sim.stampResistor(this.nodes[this.N_CTL], this.ground, 10000);
        // discharge, output, and Vin pins change in doStep()
        CircuitElm.sim.stampNonLinear(this.nodes[this.N_DIS]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.N_OUT]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.N_VIN]);
        if (this.hasGroundPin()) {
            CircuitElm.sim.stampNonLinear(this.nodes[this.N_GND]);
        }
    }
    calculateCurrent(): void {
        // need current for V, discharge, control, ground; output current is
        // calculated for us, and other pins have no current.
        this.pins[this.N_VIN].current = (this.volts[this.N_CTL] - this.volts[this.N_VIN]) / 5000;
        let groundVolts: number = this.hasGroundPin() ? this.volts[this.N_GND] : 0;
        this.pins[this.N_CTL].current = -(this.volts[this.N_CTL] - groundVolts) / 10000 - this.pins[this.N_VIN].current;
        this.pins[this.N_DIS].current = (!this.out) ? -(this.volts[this.N_DIS] - groundVolts) / 10 : 0;
        this.pins[this.N_OUT].current = -(this.volts[this.N_OUT] - (this.out ? this.volts[this.N_VIN] : groundVolts));
        if (this.out) {
            this.pins[this.N_VIN].current -= this.pins[this.N_OUT].current;
        }
        if (this.hasGroundPin()) {
            this.pins[this.N_GND].current = (this.volts[this.N_CTL] - groundVolts) / 10000;
            if (!this.out) {
                this.pins[this.N_GND].current += (this.volts[this.N_DIS] - groundVolts) / 10 + (this.volts[this.N_OUT] - groundVolts);
            }
        }
    }
    declare out: boolean;
    startIteration(): void {
        this.out = this.volts[this.N_OUT] > this.volts[this.N_VIN] / 2;
        // check comparators
        if (this.volts[this.N_THRES] > this.volts[this.N_CTL]) {
            this.out = false;
        }
        // trigger overrides threshold
        if (this.volts[this.N_CTL] / 2 > this.volts[this.N_TRIG]) {
            this.out = true;
        }
        let groundVolts: number = this.hasGroundPin() ? this.volts[this.N_GND] : 0;
        // reset overrides trigger
        if (this.hasReset() && this.volts[this.N_RST] < .7 + groundVolts) {
            this.out = false;
        }
    }
    doStep(): void {
        // if output is low, discharge pin 0.  we use a small
        // resistor because it's easier, and sometimes people tie
        // the discharge pin to the trigger and threshold pins.
        if (!this.out) {
            CircuitElm.sim.stampResistor(this.nodes[this.N_DIS], this.ground, 10);
        }
        // if output is high, connect Vin to output with a small resistor.  Otherwise connect output to ground.
        CircuitElm.sim.stampResistor(this.out ? this.nodes[this.N_VIN] : this.ground, this.nodes[this.N_OUT], 1);
    }
    getPostCount(): number {
        return this.hasGroundPin() ? 8 : this.hasReset() ? 7 : 6;
    }
    getVoltageSourceCount(): number {
        return 0;
    }
    getDumpType(): number {
        return 165;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, 0, 0);
            ei.checkbox = new Checkbox("Ground Pin", this.hasGroundPin());
            return ei;
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_GROUND);
            this.allocNodes();
            this.setPoints();
            return;
        }
        super.setEditValue(n, ei);
    }
}
Object.assign(TimerElm.prototype, { "FLAG_RESET": 2, "FLAG_GROUND": 4, "N_DIS": 0, "N_TRIG": 1, "N_THRES": 2, "N_VIN": 3, "N_CTL": 4, "N_OUT": 5, "N_RST": 6, "N_GND": 7, "ground": 0, "out": false });
