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

// Changed 2026-10-31: converted from LogicInputElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Font, Graphics, Rectangle, StringTokenizer, SwitchElm, parseJDouble } from '../core/internal';

export class LogicInputElm extends SwitchElm {
    declare FLAG_TERNARY: number;
    declare FLAG_NUMERIC: number;
    declare hiV: number;
    declare loV: number;
    init$2(xx: number, yy: number): this {
        SwitchElm.prototype.init$3.call(this, xx, yy, false);
        this.hiV = 5;
        this.loV = 0;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        SwitchElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        try {
            this.hiV = parseJDouble(st.nextToken$0());
            this.loV = parseJDouble(st.nextToken$0());
        } catch (e) {
            this.hiV = 5;
            this.loV = 0;
        }
        if (this.isTernary()) {
            this.posCount = 3;
        }
        return this;
    }
    isTernary(): boolean {
        return (this.flags & this.FLAG_TERNARY) !== 0;
    }
    isNumeric(): boolean {
        return (this.flags & (this.FLAG_TERNARY | this.FLAG_NUMERIC)) !== 0;
    }
    getDumpType(): number {
        return 76;
    }
    dump(): string {
        return super.dump() + " " + this.hiV + " " + this.loV;
    }
    getPostCount(): number {
        return 1;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = this.interpPoint$3(this.point1, this.point2, 1 - 12 / this.dn);
    }
    draw(g: Graphics): void {
        let oldf: Font = g.getFont();
        let f: Font = new Font().init$3("SansSerif", Font.BOLD, 20);
        g.setFont(f);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
        let s: string = this.position === 0 ? "L" : "H";
        if (this.isNumeric()) {
            s = "" + this.position;
        }
        this.setBbox$3(this.point1, this.lead1, 0);
        this.drawCenteredText(g, s, this.x2, this.y2, true);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.updateDotCount$0();
        this.drawDots(g, this.point1, this.lead1, -this.curcount);
        this.drawPosts(g);
        g.setFont(oldf);
    }
    getSwitchRect(): Rectangle {
        return new Rectangle().init$4(this.x2 - 10, this.y2 - 10, 20, 20);
    }
    setCurrent(vs: number, c: number): void {
        this.current = c;
    }
    stamp(): void {
        let v: number = (this.position === 0) ? this.loV : this.hiV;
        if (this.isTernary()) {
            v = this.position * 2.5;
        }
        CircuitElm.sim.stampVoltageSource(0, this.nodes[0], this.voltSource, v);
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "logic input";
        arr[1] = (this.position === 0) ? "low" : "high";
        if (this.isNumeric()) {
            arr[1] = "" + this.position;
        }
        arr[1] += " (" + CircuitElm.getVoltageText(this.volts[0]) + ")";
        arr[2] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    }
    hasGroundConnection(n1: number): boolean {
        return true;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, 0, 0);
            ei.checkbox = new Checkbox("Momentary Switch", this.momentary);
            return ei;
        }
        if (n === 1) {
            return new EditInfo("High Voltage", this.hiV, 10, -10);
        }
        if (n === 2) {
            return new EditInfo("Low Voltage", this.loV, 10, -10);
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, 0, 0);
            ei.checkbox = new Checkbox("Numeric", this.isNumeric());
            return ei;
        }
        if (n === 4) {
            let ei: EditInfo = new EditInfo("", 0, 0, 0);
            ei.checkbox = new Checkbox("Ternary", this.isTernary());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.momentary = ei.checkbox.getState();
        }
        if (n === 1) {
            this.hiV = ei.value;
        }
        if (n === 2) {
            this.loV = ei.value;
        }
        if (n === 3) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_NUMERIC;
            } else {
                this.flags &= ~this.FLAG_NUMERIC;
            }
        }
        if (n === 4) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_TERNARY;
            } else {
                this.flags &= ~this.FLAG_TERNARY;
            }
            this.posCount = (this.isTernary()) ? 3 : 2;
        }
    }
    getShortcut(): number {
        return 105;
    }
    getCurrentIntoNode(n: number): number {
        return this.current;
    }
}
Object.assign(LogicInputElm.prototype, { "FLAG_TERNARY": 1, "FLAG_NUMERIC": 2, "hiV": 0, "loV": 0 });
