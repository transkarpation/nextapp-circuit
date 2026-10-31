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

// Changed 2026-10-31: converted from WireElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Graphics, StringTokenizer } from '../core/internal';

export class WireElm extends CircuitElm {
    declare hasWireInfo: boolean;
    // used in CirSim to calculate wire currents
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        return this;
    }
    static FLAG_SHOWCURRENT: number = 1;
    static FLAG_SHOWVOLTAGE: number = 2;
    draw(g: Graphics): void {
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.point2);
        this.doDots(g);
        this.setBbox$3(this.point1, this.point2, 3);
        let s: string = "";
        if (this.mustShowCurrent()) {
            s = CircuitElm.getShortUnitText(Math.abs(this.getCurrent()), "A");
        }
        if (this.mustShowVoltage()) {
            s = (s.length > 0 ? s + " " : "") + CircuitElm.getShortUnitText(this.volts[0], "V");
        }
        this.drawValues$3(g, s, 4);
        this.drawPosts(g);
    }
    stamp(): void {
        //	    sim.stampVoltageSource(nodes[0], nodes[1], voltSource, 0);
    }
    mustShowCurrent(): boolean {
        return (this.flags & WireElm.FLAG_SHOWCURRENT) !== 0;
    }
    mustShowVoltage(): boolean {
        return (this.flags & WireElm.FLAG_SHOWVOLTAGE) !== 0;
    }
    //	int getVoltageSourceCount() { return 1; }
    getInfo(arr: string[]): void {
        arr[0] = "wire";
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
        arr[2] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
    }
    getDumpType(): number {
        return 119;
    }
    getPower(): number {
        return 0;
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    isWire(): boolean {
        return true;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Show Current", this.mustShowCurrent());
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Show Voltage", this.mustShowVoltage());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            if (ei.checkbox.getState()) {
                this.flags |= WireElm.FLAG_SHOWCURRENT;
            } else {
                this.flags &= ~WireElm.FLAG_SHOWCURRENT;
            }
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.flags |= WireElm.FLAG_SHOWVOLTAGE;
            } else {
                this.flags &= ~WireElm.FLAG_SHOWVOLTAGE;
            }
        }
    }
    getShortcut(): number {
        return 119;
    }
}
Object.assign(WireElm.prototype, { "hasWireInfo": false });
