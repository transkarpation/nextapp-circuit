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

// Changed 2026-10-31: converted from VCOElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, Graphics, StringTokenizer, newArray } from '../core/internal';

export class VCOElm extends ChipElm {
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getChipName(): string {
        return "VCO";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = 4;
        this.pins = newArray(null, 6);
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "Vi");
        this.pins[1] = new ChipElm_Pin().init$3(this, 3, ChipElm.SIDE_W, "Vo");
        this.pins[1].output = true;
        this.pins[2] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "C");
        this.pins[3] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "C");
        this.pins[4] = new ChipElm_Pin().init$3(this, 2, ChipElm.SIDE_E, "R1");
        this.pins[4].output = true;
        this.pins[5] = new ChipElm_Pin().init$3(this, 3, ChipElm.SIDE_E, "R2");
        this.pins[5].output = true;
    }
    nonLinear(): boolean {
        return true;
    }
    stamp(): void {
        // output pin
        CircuitElm.sim.stampVoltageSource(0, this.nodes[1], this.pins[1].voltSource);
        // attach Vi to R1 pin so its current is proportional to Vi
        CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[4], this.pins[4].voltSource, 0);
        // attach 5V to R2 pin so we get a current going
        CircuitElm.sim.stampVoltageSource(0, this.nodes[5], this.pins[5].voltSource, 5);
        // put resistor across cap pins to give current somewhere to go
        // in case cap is not connected
        CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[3], this.cResistance);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
        CircuitElm.sim.stampNonLinear(this.nodes[3]);
    }
    declare cResistance: number;
    declare cCurrent: number;
    declare cDir: number;
    doStep(): void {
        let vc: number = this.volts[3] - this.volts[2];
        let vo: number = this.volts[1];
        let dir: number = (vo < 2.5) ? 1 : -1;
        // switch direction of current through cap as we oscillate
        if (vo < 2.5 && vc > 4.5) {
            vo = 5;
            dir = -1;
        }
        if (vo > 2.5 && vc < .5) {
            vo = 0;
            dir = 1;
        }
        // generate output voltage
        CircuitElm.sim.updateVoltageSource(0, this.nodes[1], this.pins[1].voltSource, vo);
        // now we set the current through the cap to be equal to the
        // current through R1 and R2, so we can measure the voltage
        // across the cap
        let cur1: number = CircuitElm.sim.nodeList.size() + this.pins[4].voltSource;
        let cur2: number = CircuitElm.sim.nodeList.size() + this.pins[5].voltSource;
        CircuitElm.sim.stampMatrix(this.nodes[2], cur1, dir);
        CircuitElm.sim.stampMatrix(this.nodes[2], cur2, dir);
        CircuitElm.sim.stampMatrix(this.nodes[3], cur1, -dir);
        CircuitElm.sim.stampMatrix(this.nodes[3], cur2, -dir);
        this.cDir = dir;
    }
    // can't do this in calculateCurrent() because it's called before
    // we get pins[4].current and pins[5].current, which we need
    computeCurrent(): void {
        if (this.cResistance === 0) {
            return;
        }
        let c: number = this.cDir * (this.pins[4].current + this.pins[5].current) + (this.volts[3] - this.volts[2]) / this.cResistance;
        this.pins[2].current = -c;
        this.pins[3].current = c;
        this.pins[0].current = -this.pins[4].current;
    }
    draw(g: Graphics): void {
        this.computeCurrent();
        this.drawChip(g);
    }
    getPostCount(): number {
        return 6;
    }
    getVoltageSourceCount(): number {
        return 3;
    }
    getDumpType(): number {
        return 158;
    }
}
Object.assign(VCOElm.prototype, { "cResistance": 1e6, "cCurrent": 0, "cDir": 0 });
