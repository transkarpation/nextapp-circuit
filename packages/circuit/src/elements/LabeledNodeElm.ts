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

// Changed 2026-10-31: converted from LabeledNodeElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, CustomLogicModel, EditInfo, Graphics, HashMap, StringTokenizer, idiv, toInt } from '../core/internal';

export class LabeledNodeElm extends CircuitElm {
    declare FLAG_ESCAPE: number;
    declare FLAG_INTERNAL: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.text = "label";
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.text = st.nextToken$0();
        if ((this.flags & this.FLAG_ESCAPE) === 0) {
            // old-style dump before escape/unescape
            while (st.hasMoreTokens()) {
                this.text += String.fromCharCode(32) + st.nextToken$0();
            }
        } else {
            // new-style dump
            this.text = CustomLogicModel.unescape(this.text);
        }
        return this;
    }
    dump(): string {
        this.flags |= this.FLAG_ESCAPE;
        return super.dump() + " " + CustomLogicModel.escape(this.text);
    }
    declare text: string;
    static nodeList: HashMap<string,number> = null;
    declare nodeNumber: number;
    isInternal(): boolean {
        return (this.flags & this.FLAG_INTERNAL) !== 0;
    }
    static console(text: string): void {

	    console.log(text);
	
    }
    static resetNodeList(): void {
        LabeledNodeElm.nodeList = new HashMap();
    }
    declare circleSize: number;
    setPoints(): void {
        super.setPoints();
        this.lead1 = this.interpPoint$3(this.point1, this.point2, 1 - this.circleSize / this.dn);
    }
    setNode(p: number, n: number): void {
        super.setNode(p, n);
        if (p === 1) {
            // assign new node
            LabeledNodeElm.nodeList.put(this.text, n);
            this.nodeNumber = n;
        }
    }
    getDumpType(): number {
        return 207;
    }
    getPostCount(): number {
        return 1;
    }
    // this is basically a wire, since it just connects two nodes together
    isWire(): boolean {
        return true;
    }
    // get connection node (which is the same as regular nodes for all elements but this one).
    // node 0 is the terminal, node 1 is the internal node shared by all nodes with same name
    getConnectionNode(n: number): number {
        if (n === 0) {
            return this.nodes[0];
        }
        return this.nodeNumber;
    }
    getConnectionNodeCount(): number {
        return 2;
    }
    getInternalNodeCount(): number {
        // this can happen at startup
        if (LabeledNodeElm.nodeList == null) {
            return 0;
        }
        let nn: number = LabeledNodeElm.nodeList.get(this.text);
        // node assigned already?
        if (nn != null) {
            this.nodeNumber = nn;
            return 0;
        }
        // allocate a new one
        return 1;
    }
    draw(g: Graphics): void {
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
        this.setPowerColor$Graphics_bool(g, false);
        let str: string = this.text;
        let lineOver: boolean = false;
        if (str.startsWith("/")) {
            lineOver = true;
            str = str.substring(1);
        }
        this.drawCenteredText(g, str, this.x2, this.y2, true);
        if (lineOver) {
            let asc: number = g.currentFontSize;
            if (lineOver) {
                let ya: number = this.y2 - asc;
                let sw: number = toInt(g.context.measureText(str).getWidth());
                g.drawLine(this.x2 - idiv(sw, 2), ya, this.x2 + idiv(sw, 2), ya);
            }
        }
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
        this.drawDots(g, this.point1, this.lead1, this.curcount);
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, CircuitElm.ps2, 1 + 11. / this.dn);
        this.setBbox$3(this.point1, CircuitElm.ps2, this.circleSize);
        this.drawPosts(g);
    }
    getCurrentIntoNode(n: number): number {
        return -this.current;
    }
    setCurrent(x: number, c: number): void {
        this.current = -c;
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(this.nodeNumber, this.nodes[0], this.voltSource, 0);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getInfo(arr: string[]): void {
        arr[0] = this.text;
        arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
        arr[2] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Text", 0, -1, -1);
            ei.text = this.text;
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Internal Node", this.isInternal());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.text = ei.textf.getText();
        }
        if (n === 1) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_INTERNAL);
        }
    }
}
Object.assign(LabeledNodeElm.prototype, { "FLAG_ESCAPE": 4, "FLAG_INTERNAL": 1, "text": null, "nodeNumber": 0, "circleSize": 17 });
