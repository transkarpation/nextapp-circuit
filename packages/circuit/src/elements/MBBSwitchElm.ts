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

// Changed 2026-10-31: converted from MBBSwitchElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, Graphics, Point, Rectangle, StringTokenizer, SwitchElm, idiv, newArray, parseJInt, toInt } from '../core/internal';

export class MBBSwitchElm extends SwitchElm {
    declare link: number;
    declare voltSources: number[];
    declare currents: number[];
    declare curcounts: number[];
    declare both: boolean;
    init$2(xx: number, yy: number): this {
        SwitchElm.prototype.init$3.call(this, xx, yy, false);
        this.setup();
        return this;
    }
    setup(): void {
        this.noDiagonal = true;
        this.voltSources = newArray(0, 2);
        this.currents = newArray(0, 2);
        this.curcounts = newArray(0, 3);
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        SwitchElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.link = parseJInt(st.nextToken$0());
        this.setup();
        return this;
    }
    getDumpType(): number {
        return 416;
    }
    dump(): string {
        return super.dump() + " " + this.link;
    }
    declare openhs$MBBSwitchElm: number;
    declare swposts: Point[];
    declare swpoles: Point[];
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.swposts = this.newPointArray(2);
        this.swpoles = this.newPointArray(2 + 2);
        let i: number = 0;
        for (i = 0; i !== 2; i++) {
            let hs: number = -this.openhs$MBBSwitchElm * (i - idiv((2 - 1), 2));
            if (i === 0) {
                hs = this.openhs$MBBSwitchElm;
            }
            this.interpPoint$5(this.lead1, this.lead2, this.swpoles[i], 1, hs);
            this.interpPoint$5(this.point1, this.point2, this.swposts[i], 1, hs);
        }
        // 4 positions (pole 1, both, pole 2, both)
        this.posCount = 4;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.openhs$MBBSwitchElm);
        this.adjustBbox$2(this.swposts[0], this.swposts[1]);
        // draw first lead
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        // draw other leads
        let i: number = 0;
        for (i = 0; i !== 2; i++) {
            this.setVoltageColor(g, this.volts[i + 1]);
            CircuitElm.drawThickLine$3(g, this.swpoles[i], this.swposts[i]);
        }
        // draw switch
        if (!this.needsHighlight()) {
            g.setColor(CircuitElm.whiteColor);
        }
        if (this.both || this.position === 0) {
            CircuitElm.drawThickLine$3(g, this.lead1, this.swpoles[0]);
        }
        if (this.both || this.position === 2) {
            CircuitElm.drawThickLine$3(g, this.lead1, this.swpoles[1]);
        }
        // draw current
        for (i = 0; i !== 2; i++) {
            this.curcounts[i] = this.updateDotCount$2(this.currents[i], this.curcounts[i]);
            this.drawDots(g, this.swpoles[i], this.swposts[i], this.curcounts[i]);
        }
        this.curcounts[2] = this.updateDotCount$2(this.currents[0] + this.currents[1], this.curcounts[2]);
        this.drawDots(g, this.point1, this.lead1, this.curcounts[2]);
        this.drawPosts(g);
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.currents[0] - this.currents[1];
        }
        return this.currents[n - 1];
    }
    getSwitchRect(): Rectangle {
        return new Rectangle().init$Point(this.lead1).union(new Rectangle().init$Point(this.swpoles[0])).union(new Rectangle().init$Point(this.swpoles[1]));
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : this.swposts[n - 1];
    }
    getPostCount(): number {
        return 3;
    }
    setCurrent(vn: number, c: number): void {
        // set current for voltage source vn to c
        if (vn === this.voltSources[0]) {
            this.currents[this.both ? 0 : idiv(this.position, 2)] = c;
        } else if (vn === this.voltSources[1]) {
            this.currents[1] = c;
        }
    }
    calculateCurrent(): void {
        // make sure current of unconnected pole is zero
        if (!this.both) {
            this.currents[1 - (idiv(this.position, 2))] = 0;
        }
    }
    setVoltageSource(n: number, v: number): void {
        this.voltSources[n] = v;
    }
    stamp(): void {
        let vs: number = 0;
        if (this.both || this.position === 0) {
            CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSources[vs++], 0);
        }
        if (this.both || this.position === 2) {
            CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[2], this.voltSources[vs++], 0);
        }
    }
    // connection is implemented by voltage source with voltage = 0.
    // need two for both loads connected, otherwise one.
    getVoltageSourceCount(): number {
        this.both = (this.position === 1 || this.position === 3);
        return (this.both) ? 2 : 1;
    }
    toggle(): void {
        super.toggle();
        if (this.link !== 0) {
            let i: number = 0;
            for (i = 0; i !== CircuitElm.sim.elmList.size(); i++) {
                let o: any = CircuitElm.sim.elmList.get(i);
                if (o instanceof MBBSwitchElm) {
                    let s2: MBBSwitchElm = (o as any as MBBSwitchElm);
                    if (s2.link === this.link) {
                        s2.position = this.position;
                    }
                }
            }
        }
    }
    getConnection(n1: number, n2: number): boolean {
        if (this.both) {
            return true;
        }
        return this.comparePair(n1, n2, 0, 1 + idiv(this.position, 2));
    }
    isWire(): boolean {
        return true;
    }
    getInfo(arr: string[]): void {
        arr[0] = "switch (" + (this.link === 0 ? "S" : "D") + "PDT, MBB)";
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    }
    getEditInfo(n: number): EditInfo {
        if (n === 1) {
            return new EditInfo("Switch Group", this.link, 0, 100).setDimensionless();
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 1) {
            this.link = toInt(ei.value);
        } else {
            super.setEditValue(n, ei);
        }
    }
    getShortcut(): number {
        return 0;
    }
}
Object.assign(MBBSwitchElm.prototype, { "link": 0, "voltSources": null, "currents": null, "curcounts": null, "both": false, "openhs$MBBSwitchElm": 16, "swposts": null, "swpoles": null });
