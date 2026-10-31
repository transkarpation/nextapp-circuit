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

// Changed 2026-10-31: converted from GroundElm.java to TypeScript.
/* eslint-disable */
import { Choice, CircuitElm, EditInfo, Graphics, Point, StringTokenizer, parseJInt, toInt } from '../core/internal';

export class GroundElm extends CircuitElm {
    static lastSymbolType: number = 0;
    declare symbolType: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.symbolType = GroundElm.lastSymbolType;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        if (st.hasMoreTokens()) {
            try {
                this.symbolType = parseJInt(st.nextToken$0());
            } catch (e) {
            }
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.symbolType;
    }
    getDumpType(): number {
        return 103;
    }
    getPostCount(): number {
        return 1;
    }
    draw(g: Graphics): void {
        this.setVoltageColor(g, 0);
        CircuitElm.drawThickLine$3(g, this.point1, this.point2);
        if (this.symbolType === 0) {
            let i: number = 0;
            for (i = 0; i !== 3; i++) {
                let a: number = 10 - i * 4;
                let b: number = i * 5;
                // -10;
                this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1 + b / this.dn, a);
                CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            }
        } else if (this.symbolType === 1) {
            this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1, 10);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            let i: number = 0;
            for (i = 0; i <= 2; i++) {
                let p: Point = this.interpPoint$3(CircuitElm.ps1, CircuitElm.ps2, i / 2.);
                CircuitElm.drawThickLine$5(g, p.x, p.y, toInt((p.x - 5 * this.dpx1 + 8 * this.dx / this.dn)), toInt((p.y + 8 * this.dy / this.dn - 5 * this.dpy1)));
            }
        } else if (this.symbolType === 2) {
            this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1, 10);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            let ps3x: number = toInt((this.point2.x + 10 * this.dx / this.dn));
            let ps3y: number = toInt((this.point2.y + 10 * this.dy / this.dn));
            CircuitElm.drawThickLine$5(g, CircuitElm.ps1.x, CircuitElm.ps1.y, ps3x, ps3y);
            CircuitElm.drawThickLine$5(g, CircuitElm.ps2.x, CircuitElm.ps2.y, ps3x, ps3y);
        } else {
            this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1, 10);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
        }
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, CircuitElm.ps2, 1 + 11. / this.dn);
        this.doDots(g);
        this.setBbox$3(this.point1, CircuitElm.ps2, 11);
        this.drawPosts(g);
    }
    setCurrent(x: number, c: number): void {
        this.current = -c;
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(0, this.nodes[0], this.voltSource, 0);
    }
    getVoltageDiff(): number {
        return 0;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getInfo(arr: string[]): void {
        arr[0] = "ground";
        arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    }
    hasGroundConnection(n1: number): boolean {
        return true;
    }
    getShortcut(): number {
        return 103;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Symbol", 0);
            ei.choice = new Choice();
            ei.choice.add("Earth");
            ei.choice.add("Chassis");
            ei.choice.add("Signal");
            ei.choice.add("Common");
            ei.choice.select(this.symbolType);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            GroundElm.lastSymbolType = this.symbolType = ei.choice.getSelectedIndex();
        }
    }
    getCurrentIntoNode(n: number): number {
        return -this.current;
    }
}
Object.assign(GroundElm.prototype, { "symbolType": 0 });
