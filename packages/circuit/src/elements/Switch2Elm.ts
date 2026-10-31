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
// SPDT switch

// Changed 2026-10-31: converted from Switch2Elm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, Graphics, Point, Rectangle, StringTokenizer, SwitchElm, idiv, parseJInt, toInt } from '../core/internal';

export class Switch2Elm extends SwitchElm {
    declare link: number;
    declare throwCount: number;
    static FLAG_CENTER_OFF: number = 1;
    init$2(xx: number, yy: number): this {
        SwitchElm.prototype.init$3.call(this, xx, yy, false);
        this.noDiagonal = true;
        this.throwCount = 2;
        return this;
    }
    init$3(xx: number, yy: number, mm: boolean): this {
        SwitchElm.prototype.init$3.call(this, xx, yy, mm);
        this.noDiagonal = true;
        this.throwCount = 2;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        SwitchElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.link = parseJInt(st.nextToken$0());
        this.throwCount = 2;
        try {
            this.throwCount = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        this.noDiagonal = true;
        return this;
    }
    getDumpType(): number {
        return 83;
    }
    dump(): string {
        return super.dump() + " " + this.link + " " + this.throwCount;
    }
    declare openhs$Switch2Elm: number;
    declare swposts: Point[];
    declare swpoles: Point[];
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.swposts = this.newPointArray(this.throwCount);
        this.swpoles = this.newPointArray(2 + this.throwCount);
        let i: number = 0;
        for (i = 0; i !== this.throwCount; i++) {
            let hs: number = -this.openhs$Switch2Elm * (i - idiv((this.throwCount - 1), 2));
            if (this.throwCount === 2 && i === 0) {
                hs = this.openhs$Switch2Elm;
            }
            this.interpPoint$5(this.lead1, this.lead2, this.swpoles[i], 1, hs);
            this.interpPoint$5(this.point1, this.point2, this.swposts[i], 1, hs);
        }
        this.swpoles[i] = this.lead2;
        // for center off
        this.posCount = this.hasCenterOff() ? 3 : this.throwCount;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.openhs$Switch2Elm);
        this.adjustBbox$2(this.swposts[0], this.swposts[this.throwCount - 1]);
        // draw first lead
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        // draw other leads
        let i: number = 0;
        for (i = 0; i !== this.throwCount; i++) {
            this.setVoltageColor(g, this.volts[i + 1]);
            CircuitElm.drawThickLine$3(g, this.swpoles[i], this.swposts[i]);
        }
        // draw switch
        if (!this.needsHighlight()) {
            g.setColor(CircuitElm.whiteColor);
        }
        CircuitElm.drawThickLine$3(g, this.lead1, this.swpoles[this.position]);
        this.updateDotCount$0();
        this.drawDots(g, this.point1, this.lead1, this.curcount);
        if (this.position !== 2) {
            this.drawDots(g, this.swpoles[this.position], this.swposts[this.position], this.curcount);
        }
        this.drawPosts(g);
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.current;
        }
        if (n === this.position + 1) {
            return this.current;
        }
        return 0;
    }
    getSwitchRect(): Rectangle {
        return new Rectangle().init$Point(this.lead1).union(new Rectangle().init$Point(this.swpoles[0])).union(new Rectangle().init$Point(this.swpoles[this.throwCount - 1]));
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : this.swposts[n - 1];
    }
    getPostCount(): number {
        return 1 + this.throwCount;
    }
    calculateCurrent(): void {
        if (this.position === 2 && this.hasCenterOff()) {
            this.current = 0;
        }
    }
    stamp(): void {
        if (this.position === 2 && this.hasCenterOff()) {
            return;
        }
        CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[this.position + 1], this.voltSource, 0);
    }
    getVoltageSourceCount(): number {
        return (this.position === 2 && this.hasCenterOff()) ? 0 : 1;
    }
    toggle(): void {
        super.toggle();
        if (this.link !== 0) {
            let i: number = 0;
            for (i = 0; i !== CircuitElm.sim.elmList.size(); i++) {
                let o: any = CircuitElm.sim.elmList.get(i);
                if (o instanceof Switch2Elm) {
                    let s2: Switch2Elm = (o as any as Switch2Elm);
                    if (s2.link === this.link) {
                        s2.position = this.position;
                    }
                }
            }
        }
    }
    getConnection(n1: number, n2: number): boolean {
        if (this.position === 2 && this.hasCenterOff()) {
            return false;
        }
        return this.comparePair(n1, n2, 0, 1 + this.position);
    }
    isWire(): boolean {
        return true;
    }
    getInfo(arr: string[]): void {
        arr[0] = "switch (" + (this.link === 0 ? "S" : "D") + "P" + ((this.throwCount > 2) ? this.throwCount + "T)" : "DT)");
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    }
    getEditInfo(n: number): EditInfo {
        /*if (n == 1) {
	    	EditInfo ei = new EditInfo("", 0, -1, -1);
	    	ei.checkbox = new Checkbox("Center Off", hasCenterOff());
	    	return ei;
	    }*/
        if (n === 1) {
            return new EditInfo("Switch Group", this.link, 0, 100).setDimensionless();
        }
        if (n === 2) {
            return new EditInfo("# of Throws", this.throwCount, 2, 10).setDimensionless();
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        /*if (n == 1) {
	    	flags &= ~FLAG_CENTER_OFF;
	    	if (ei.checkbox.getState())
	    		flags |= FLAG_CENTER_OFF;
	    	if (hasCenterOff())
	    		momentary = false;
	    	setPoints();
	    } else*/
        if (n === 1) {
            this.link = toInt(ei.value);
        } else if (n === 2) {
            if (ei.value >= 2) {
                this.throwCount = toInt(ei.value);
            }
            if (this.throwCount > 2) {
                this.momentary = false;
            }
            this.allocNodes();
            this.setPoints();
        } else {
            super.setEditValue(n, ei);
        }
    }
    // this is for backwards compatibility only.  we only support it if throwCount = 2
    hasCenterOff(): boolean {
        return (this.flags & Switch2Elm.FLAG_CENTER_OFF) !== 0 && this.throwCount === 2;
    }
    getShortcut(): number {
        return 83;
    }
}
Object.assign(Switch2Elm.prototype, { "link": 0, "throwCount": 0, "openhs$Switch2Elm": 16, "swposts": null, "swpoles": null });
