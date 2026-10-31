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

// Changed 2026-10-31: converted from LogicOutputElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, EditInfo, Font, Graphics, StringTokenizer, parseJDouble } from '../core/internal';

export class LogicOutputElm extends CircuitElm {
    declare FLAG_TERNARY: number;
    declare FLAG_NUMERIC: number;
    declare FLAG_PULLDOWN: number;
    declare threshold: number;
    declare value: string;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.threshold = 2.5;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        try {
            this.threshold = parseJDouble(st.nextToken$0());
        } catch (e) {
            this.threshold = 2.5;
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.threshold;
    }
    getDumpType(): number {
        return 77;
    }
    getPostCount(): number {
        return 1;
    }
    isTernary(): boolean {
        return (this.flags & this.FLAG_TERNARY) !== 0;
    }
    isNumeric(): boolean {
        return (this.flags & (this.FLAG_TERNARY | this.FLAG_NUMERIC)) !== 0;
    }
    needsPullDown(): boolean {
        return (this.flags & this.FLAG_PULLDOWN) !== 0;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = this.interpPoint$3(this.point1, this.point2, 1 - 12 / this.dn);
    }
    draw(g: Graphics): void {
        let oldf: Font = g.getFont();
        let f: Font = new Font().init$3("SansSerif", Font.BOLD, 20);
        g.setFont(f);
        //g.setColor(needsHighlight() ? selectColor : lightGrayColor);
        g.setColor(CircuitElm.lightGrayColor);
        let s: string = (this.volts[0] < this.threshold) ? "L" : "H";
        if (this.isTernary()) {
            if (this.volts[0] > 3.75) {
                s = "2";
            } else if (this.volts[0] > 1.25) {
                s = "1";
            } else {
                s = "0";
            }
        } else if (this.isNumeric()) {
            s = (this.volts[0] < this.threshold) ? "0" : "1";
        }
        this.value = s;
        this.setBbox$3(this.point1, this.lead1, 0);
        this.drawCenteredText(g, s, this.x2, this.y2, true);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.drawPosts(g);
        g.setFont(oldf);
    }
    stamp(): void {
        if (this.needsPullDown()) {
            CircuitElm.sim.stampResistor(this.nodes[0], 0, 1e6);
        }
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "logic output";
        arr[1] = (this.volts[0] < this.threshold) ? "low" : "high";
        if (this.isNumeric()) {
            arr[1] = this.value;
        }
        arr[2] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Threshold", this.threshold, 10, -10);
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Current Required", this.needsPullDown());
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, 0, 0);
            ei.checkbox = new Checkbox("Numeric", this.isNumeric());
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, 0, 0);
            ei.checkbox = new Checkbox("Ternary", this.isTernary());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.threshold = ei.value;
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.flags = this.FLAG_PULLDOWN;
            } else {
                this.flags &= ~this.FLAG_PULLDOWN;
            }
        }
        if (n === 2) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_NUMERIC;
            } else {
                this.flags &= ~this.FLAG_NUMERIC;
            }
        }
        if (n === 3) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_TERNARY;
            } else {
                this.flags &= ~this.FLAG_TERNARY;
            }
        }
    }
    getShortcut(): number {
        return 111;
    }
    //    void drawHandles(Graphics g, Color c) {
    //    	g.setColor(c);
    //		g.fillRect(x-3, y-3, 7, 7);
    //    }
}
Object.assign(LogicOutputElm.prototype, { "FLAG_TERNARY": 1, "FLAG_NUMERIC": 2, "FLAG_PULLDOWN": 4, "threshold": 0, "value": null });
