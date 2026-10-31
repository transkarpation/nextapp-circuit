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

// Changed 2026-10-31: converted from ACRailElm.java to TypeScript.
/* eslint-disable */
import { RailElm, VoltageElm } from '../core/internal';

export class ACRailElm extends RailElm {
    init$2(xx: number, yy: number): this {
        RailElm.prototype.init$3.call(this, xx, yy, VoltageElm.WF_AC);
        return this;
    }
    getDumpClass(): any {
        return RailElm;
    }
    getShortcut(): number {
        return 0;
    }
}
