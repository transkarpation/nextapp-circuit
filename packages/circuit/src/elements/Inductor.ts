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

// Changed 2026-10-31: converted from Inductor.java to TypeScript.
/* eslint-disable */
import { CirSim, newArray } from '../core/internal';

export class Inductor {
    static FLAG_BACK_EULER: number = 2;
    declare nodes: number[];
    declare flags: number;
    declare sim: CirSim;
    declare inductance: number;
    declare compResistance: number;
    declare current: number;
    declare curSourceValue: number;
    init$1(s: CirSim): this {
        this.sim = s;
        this.nodes = newArray(0, 2);
        return this;
    }
    setup(ic: number, cr: number, f: number): void {
        this.inductance = ic;
        this.current = cr;
        this.flags = f;
    }
    isTrapezoidal(): boolean {
        return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
    }
    reset(): void {
        // need to set curSourceValue here in case one of inductor nodes is node 0.  In that case
        // calculateCurrent() may get called (from setNodeVoltage()) when analyzing circuit, before
        // startIteration() gets called
        this.current = this.curSourceValue = 0;
    }
    stamp(n0: number, n1: number): void {
        // inductor companion model using trapezoidal or backward euler
        // approximations (Norton equivalent) consists of a current
        // source in parallel with a resistor.  Trapezoidal is more
        // accurate than backward euler but can cause oscillatory behavior.
        // The oscillation is a real problem in circuits with switches.
        this.nodes[0] = n0;
        this.nodes[1] = n1;
        if (this.isTrapezoidal()) {
            this.compResistance = 2 * this.inductance / this.sim.timeStep;
        } else {
            this.compResistance = this.inductance / this.sim.timeStep;
        }
        this.sim.stampResistor(this.nodes[0], this.nodes[1], this.compResistance);
        this.sim.stampRightSide(this.nodes[0]);
        this.sim.stampRightSide(this.nodes[1]);
    }
    nonLinear(): boolean {
        return false;
    }
    startIteration(voltdiff: number): void {
        if (this.isTrapezoidal()) {
            this.curSourceValue = voltdiff / this.compResistance + this.current;
        } else {
            this.curSourceValue = this.current;
        }
    }
    calculateCurrent(voltdiff: number): number {
        // we check compResistance because this might get called
        // before stamp(), which sets compResistance, causing
        // infinite current
        if (this.compResistance > 0) {
            this.current = voltdiff / this.compResistance + this.curSourceValue;
        }
        return this.current;
    }
    doStep(voltdiff: number): void {
        this.sim.stampCurrentSource(this.nodes[0], this.nodes[1], this.curSourceValue);
    }
    constructor() {}
}
Object.assign(Inductor.prototype, { "nodes": null, "flags": 0, "sim": null, "inductance": 0, "compResistance": 0, "current": 0, "curSourceValue": 0 });
