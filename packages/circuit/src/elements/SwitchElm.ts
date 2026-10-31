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
// SPST switch

// Changed 2026-10-31: converted from SwitchElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Graphics, LogicInputElm, Point, Rectangle, StringTokenizer, compareStrings, javaBoolean, parseJInt } from '../core/internal';

export class SwitchElm extends CircuitElm {
    declare momentary: boolean;
    // position 0 == closed, position 1 == open
    declare position: number;
    declare posCount: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.momentary = false;
        this.position = 0;
        this.posCount = 2;
        return this;
    }
    init$3(xx: number, yy: number, mm: boolean): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.position = (mm) ? 1 : 0;
        this.momentary = mm;
        this.posCount = 2;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        let str: string = st.nextToken$0();
        if (compareStrings(str, "true") === 0) {
            this.position = (this instanceof LogicInputElm) ? 0 : 1;
        } else if (compareStrings(str, "false") === 0) {
            this.position = (this instanceof LogicInputElm) ? 1 : 0;
        } else {
            this.position = parseJInt(str);
        }
        this.momentary = javaBoolean(st.nextToken$0());
        this.posCount = 2;
        return this;
    }
    getDumpType(): number {
        return 115;
    }
    dump(): string {
        return super.dump() + " " + this.position + " " + this.momentary;
    }
    declare ps: Point;
    declare ps2: Point;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.ps = new Point().init$0();
        this.ps2 = new Point().init$0();
    }
    declare openhs: number;
    draw(g: Graphics): void {
        let hs1: number = (this.position === 1) ? 0 : 2;
        let hs2: number = (this.position === 1) ? this.openhs : 2;
        this.setBbox$3(this.point1, this.point2, this.openhs);
        this.draw2Leads(g);
        if (this.position === 0) {
            this.doDots(g);
        }
        if (!this.needsHighlight()) {
            g.setColor(CircuitElm.whiteColor);
        }
        this.interpPoint$5(this.lead1, this.lead2, this.ps, 0, hs1);
        this.interpPoint$5(this.lead1, this.lead2, this.ps2, 1, hs2);
        CircuitElm.drawThickLine$3(g, this.ps, this.ps2);
        this.drawPosts(g);
    }
    getSwitchRect(): Rectangle {
        this.interpPoint$5(this.lead1, this.lead2, this.ps, 0, this.openhs);
        return new Rectangle().init$Point(this.lead1).union(new Rectangle().init$Point(this.lead2)).union(new Rectangle().init$Point(this.ps));
    }
    calculateCurrent(): void {
        if (this.position === 1) {
            this.current = 0;
        }
    }
    stamp(): void {
        if (this.position === 0) {
            CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSource, 0);
        }
    }
    getVoltageSourceCount(): number {
        return (this.position === 1) ? 0 : 1;
    }
    mouseUp(): void {
        if (this.momentary) {
            this.toggle();
        }
    }
    toggle(): void {
        this.position++;
        if (this.position >= this.posCount) {
            this.position = 0;
        }
    }
    getInfo(arr: string[]): void {
        arr[0] = (this.momentary) ? "push switch (SPST)" : "switch (SPST)";
        if (this.position === 1) {
            arr[1] = "open";
            arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
        } else {
            arr[1] = "closed";
            arr[2] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
            arr[3] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
        }
    }
    getConnection(n1: number, n2: number): boolean {
        return this.position === 0;
    }
    isWire(): boolean {
        return this.position === 0;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Momentary Switch", this.momentary);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.momentary = ei.checkbox.getState();
        }
    }
    getShortcut(): number {
        return 115;
    }
}
Object.assign(SwitchElm.prototype, { "momentary": false, "position": 0, "posCount": 0, "ps": null, "ps2": null, "openhs": 16 });
