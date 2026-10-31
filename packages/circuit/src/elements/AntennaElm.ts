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

// Changed 2026-10-31: converted from AntennaElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, Graphics, RailElm, StringTokenizer, VoltageElm } from '../core/internal';

export class AntennaElm extends RailElm {
    init$2(xx: number, yy: number): this {
        RailElm.prototype.init$3.call(this, xx, yy, VoltageElm.WF_AC);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        RailElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.waveform = VoltageElm.WF_AC;
        return this;
    }
    declare fmphase: number;
    drawRail(g: Graphics): void {
        this.drawRailText(g, "Ant");
    }
    getVoltage(): number {
        let fm: number = 3 * Math.sin(this.fmphase);
        return Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 3000) * (1.3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 12)) * 3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 2710) * (1.3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 13)) * 3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 2433) * (1.3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 14)) * 3 + fm;
    }
    stepFinished(): void {
        this.fmphase += 2 * CircuitElm.pi * (2200 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 13) * 100) * CircuitElm.sim.timeStep;
    }
    getDumpType(): number {
        return 65;
    }
    getShortcut(): number {
        return 0;
    }
    getEditInfo(n: number): EditInfo {
        return null;
    }
}
Object.assign(AntennaElm.prototype, { "fmphase": 0 });
