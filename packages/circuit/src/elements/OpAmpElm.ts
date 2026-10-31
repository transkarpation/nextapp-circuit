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

// Changed 2026-10-31: converted from OpAmpElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, EditInfo, Font, Graphics, Point, Polygon, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class OpAmpElm extends CircuitElm {
    declare opsize: number;
    declare opheight: number;
    declare opwidth: number;
    declare opaddtext: number;
    declare maxOut: number;
    declare minOut: number;
    declare gain: number;
    declare gbw: number;
    declare reset$f: boolean;
    declare FLAG_SWAP: number;
    declare FLAG_SMALL: number;
    declare FLAG_LOWGAIN: number;
    declare FLAG_GAIN: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.noDiagonal = true;
        this.maxOut = 15;
        this.minOut = -15;
        this.gbw = 1e6;
        this.flags = this.FLAG_GAIN;
        // need to do this before setSize()
        this.gain = 100000;
        this.setSize(CircuitElm.sim.smallGridCheckItem.getState() ? 1 : 2);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.maxOut = 15;
        this.minOut = -15;
        // GBW has no effect in this version of the simulator, but we
        // retain it to keep the file format the same
        this.gbw = 1e6;
        try {
            this.maxOut = parseJDouble(st.nextToken$0());
            this.minOut = parseJDouble(st.nextToken$0());
            this.gbw = parseJDouble(st.nextToken$0());
            this.volts[0] = parseJDouble(st.nextToken$0());
            this.volts[1] = parseJDouble(st.nextToken$0());
            this.gain = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.noDiagonal = true;
        this.setSize((f & this.FLAG_SMALL) !== 0 ? 1 : 2);
        this.setGain();
        return this;
    }
    setGain(): void {
        if ((this.flags & this.FLAG_GAIN) !== 0) {
            return;
        }
        // gain of 100000 breaks e-amp-dfdx.txt
        // gain was 1000, but it broke amp-schmitt.txt
        this.gain = ((this.flags & this.FLAG_LOWGAIN) !== 0) ? 1000 : 100000;
    }
    dump(): string {
        this.flags |= this.FLAG_GAIN;
        return super.dump() + " " + this.maxOut + " " + this.minOut + " " + this.gbw + " " + this.volts[0] + " " + this.volts[1] + " " + this.gain;
    }
    nonLinear(): boolean {
        return true;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.opheight * 2);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.in1p[0], this.in1p[1]);
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.in2p[0], this.in2p[1]);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.lead2, this.point2);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickPolygon$2(g, this.triangle);
        g.setFont(this.plusFont);
        this.drawCenteredText(g, "-", this.textp[0].x, this.textp[0].y - 2, true);
        this.drawCenteredText(g, "+", this.textp[1].x, this.textp[1].y, true);
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
        this.drawDots(g, this.point2, this.lead2, this.curcount);
        this.drawPosts(g);
    }
    getPower(): number {
        return this.volts[2] * this.current;
    }
    declare in1p: Point[];
    declare in2p: Point[];
    declare textp: Point[];
    declare triangle: Polygon;
    declare plusFont: Font;
    setSize(s: number): void {
        this.opsize = s;
        this.opheight = 8 * s;
        this.opwidth = 13 * s;
        this.flags = (this.flags & ~this.FLAG_SMALL) | ((s === 1) ? this.FLAG_SMALL : 0);
    }
    setPoints(): void {
        super.setPoints();
        if (this.dn > 150 && this === CircuitElm.sim.dragElm) {
            this.setSize(2);
        }
        let ww: number = this.opwidth;
        if (ww > this.dn / 2) {
            ww = toInt((this.dn / 2));
        }
        this.calcLeads(ww * 2);
        let hs: number = this.opheight * this.dsign;
        if ((this.flags & this.FLAG_SWAP) !== 0) {
            hs = -hs;
        }
        this.in1p = this.newPointArray(2);
        this.in2p = this.newPointArray(2);
        this.textp = this.newPointArray(2);
        this.interpPoint2(this.point1, this.point2, this.in1p[0], this.in2p[0], 0, hs);
        this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hs);
        this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], .2, hs);
        let tris: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, hs * 2);
        this.triangle = this.createPolygon$3(tris[0], tris[1], this.lead2);
        this.plusFont = new Font().init$3("SansSerif", 0, this.opsize === 2 ? 14 : 10);
    }
    getPostCount(): number {
        return 3;
    }
    getPost(n: number): Point {
        return (n === 0) ? this.in1p[0] : (n === 1) ? this.in2p[0] : this.point2;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getInfo(arr: string[]): void {
        arr[0] = "op-amp";
        arr[1] = "V+ = " + CircuitElm.getVoltageText(this.volts[1]);
        arr[2] = "V- = " + CircuitElm.getVoltageText(this.volts[0]);
        // sometimes the voltage goes slightly outside range, to make
        // convergence easier.  so we hide that here.
        let vo: number = Math.max(Math.min(this.volts[2], this.maxOut), this.minOut);
        arr[3] = "Vout = " + CircuitElm.getVoltageText(vo);
        arr[4] = "Iout = " + CircuitElm.getCurrentText(-this.current);
        arr[5] = "range = " + CircuitElm.getVoltageText(this.minOut) + " to " + CircuitElm.getVoltageText(this.maxOut);
    }
    declare lastvd: number;
    stamp(): void {
        let vn: number = CircuitElm.sim.nodeList.size() + this.voltSource;
        CircuitElm.sim.stampNonLinear(vn);
        CircuitElm.sim.stampMatrix(this.nodes[2], vn, 1);
    }
    doStep(): void {
        let vd: number = this.volts[1] - this.volts[0];
        if (Math.abs(this.lastvd - vd) > .1) {
            CircuitElm.sim.converged = false;
        } else if (this.volts[2] > this.maxOut + .1 || this.volts[2] < this.minOut - .1) {
            CircuitElm.sim.converged = false;
        }
        let x: number = 0;
        let vn: number = CircuitElm.sim.nodeList.size() + this.voltSource;
        let dx: number = 0;
        if (vd >= this.maxOut / this.gain && (this.lastvd >= 0 || CircuitElm.sim.getrand(4) === 1)) {
            dx = 1e-4;
            x = this.maxOut - dx * this.maxOut / this.gain;
        } else if (vd <= this.minOut / this.gain && (this.lastvd <= 0 || CircuitElm.sim.getrand(4) === 1)) {
            dx = 1e-4;
            x = this.minOut - dx * this.minOut / this.gain;
        } else {
            dx = this.gain;
        }
        //System.out.println("opamp " + vd + " " + volts[2] + " " + dx + " "  + x + " " + lastvd + " " + sim.converged);
        // newton-raphson
        CircuitElm.sim.stampMatrix(vn, this.nodes[0], dx);
        CircuitElm.sim.stampMatrix(vn, this.nodes[1], -dx);
        CircuitElm.sim.stampMatrix(vn, this.nodes[2], 1);
        CircuitElm.sim.stampRightSide(vn, x);
        this.lastvd = vd;
        /*if (sim.converged)
	      System.out.println((volts[1]-volts[0]) + " " + volts[2] + " " + initvd);*/
    }
    // there is no current path through the op-amp inputs, but there
    // is an indirect path through the output to ground.
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    hasGroundConnection(n1: number): boolean {
        return (n1 === 2);
    }
    getVoltageDiff(): number {
        return this.volts[2] - this.volts[1];
    }
    getDumpType(): number {
        return 97;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Max Output (V)", this.maxOut, 1, 20);
        }
        if (n === 1) {
            return new EditInfo("Min Output (V)", this.minOut, -20, 0);
        }
        if (n === 2) {
            return new EditInfo("Gain", this.gain, 10, 1000000);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.maxOut = ei.value;
        }
        if (n === 1) {
            this.minOut = ei.value;
        }
        if (n === 2 && ei.value > 0) {
            this.gain = ei.value;
        }
    }
    getShortcut(): number {
        return 97;
    }
    getCurrentIntoNode(n: number): number {
        if (n === 2) {
            return -this.current;
        }
        return 0;
    }
}
Object.assign(OpAmpElm.prototype, { "opsize": 0, "opheight": 0, "opwidth": 0, "opaddtext": 0, "maxOut": 0, "minOut": 0, "gain": 0, "gbw": 0, "reset$f": false, "FLAG_SWAP": 1, "FLAG_SMALL": 2, "FLAG_LOWGAIN": 4, "FLAG_GAIN": 8, "in1p": null, "in2p": null, "textp": null, "triangle": null, "plusFont": null, "lastvd": 0 });
