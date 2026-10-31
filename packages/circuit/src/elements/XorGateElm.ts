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

// Changed 2026-10-31: converted from XorGateElm.java to TypeScript.
/* eslint-disable */
import { OrGateElm, StringTokenizer, boolOp } from '../core/internal';

export class XorGateElm extends OrGateElm {
    init$2(xx: number, yy: number): this {
        OrGateElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        OrGateElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getGateName(): string {
        return "XOR gate";
    }
    getGateText(): string {
        return "=1";
    }
    calcFunction(): boolean {
        let i: number = 0;
        let f: boolean = false;
        for (i = 0; i !== this.inputCount; i++) {
            f = boolOp('^', f, this.getInput(i));
        }
        return f;
    }
    getDumpType(): number {
        return 154;
    }
    getShortcut(): number {
        return 52;
    }
}
