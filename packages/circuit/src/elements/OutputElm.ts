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

// Changed 2026-10-31: converted from OutputElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, Choice, CirSim, CircuitElm, EditInfo, Font, Graphics, Point, StringTokenizer, idiv, parseJInt, toInt } from '../core/internal';

export class OutputElm extends CircuitElm {
    declare FLAG_VALUE: number;
    declare scale: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.scale = CircuitElm.SCALE_AUTO;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.scale = CircuitElm.SCALE_AUTO;
        try {
            this.scale = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.scale;
    }
    getDumpType(): number {
        return 79;
    }
    getPostCount(): number {
        return 1;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = new Point().init$0();
    }
    draw(g: Graphics): void {
        let selected: boolean = this.needsHighlight();
        let f: Font = new Font().init$3("SansSerif", selected ? Font.BOLD : 0, 14);
        g.setFont(f);
        g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
        let s: string = (this.flags & this.FLAG_VALUE) !== 0 ? CircuitElm.getUnitTextWithScale(this.volts[0], "V", this.scale) : CirSim.LS("out");
        //	    FontMetrics fm = g.getFontMetrics();
        if (this === CircuitElm.sim.plotXElm) {
            s = "X";
        }
        if (this === CircuitElm.sim.plotYElm) {
            s = "Y";
        }
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.lead1, 1 - (idiv(toInt(g.context.measureText(s).getWidth()), 2) + 8) / this.dn);
        this.setBbox$3(this.point1, this.lead1, 0);
        this.drawCenteredText(g, s, this.x2, this.y2, true);
        this.setVoltageColor(g, this.volts[0]);
        if (selected) {
            g.setColor(CircuitElm.selectColor);
        }
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.drawPosts(g);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "output";
        arr[1] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Show Voltage", (this.flags & this.FLAG_VALUE) !== 0);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("Scale", 0);
            ei.choice = new Choice();
            ei.choice.add("Auto");
            ei.choice.add("V");
            ei.choice.add("mV");
            ei.choice.add(CirSim.muString + "V");
            ei.choice.select(this.scale);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.flags = (ei.checkbox.getState()) ? (this.flags | this.FLAG_VALUE) : (this.flags & ~this.FLAG_VALUE);
        }
        if (n === 1) {
            this.scale = ei.choice.getSelectedIndex();
        }
    }
    //    void drawHandles(Graphics g, Color c) {
    //    	g.setColor(c);
    //		g.fillRect(x-3, y-3, 7, 7);
    //    }
}
Object.assign(OutputElm.prototype, { "FLAG_VALUE": 1, "scale": 0 });
