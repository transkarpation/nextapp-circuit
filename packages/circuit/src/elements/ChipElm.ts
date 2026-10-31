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

// Changed 2026-10-31: converted from ChipElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, Color, EditInfo, Font, Graphics, Point, RingCounterElm, StringTokenizer, System, compareStrings, idiv, newArray, parseJDouble, parseJInt, toInt } from '../core/internal';

export abstract class ChipElm extends CircuitElm {
    declare csize: number;
    declare cspc: number;
    declare cspc2: number;
    declare bits: number;
    declare FLAG_SMALL: number;
    declare FLAG_FLIP_X: number;
    declare FLAG_FLIP_Y: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        if (this.needsBits()) {
            this.bits = (this instanceof RingCounterElm) ? 10 : 4;
        }
        this.noDiagonal = true;
        this.setupPins();
        this.setSize(CircuitElm.sim.smallGridCheckItem.getState() ? 1 : 2);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        if (this.needsBits()) {
            this.bits = parseJInt(st.nextToken$0());
        }
        this.noDiagonal = true;
        this.setupPins();
        this.setSize((f & this.FLAG_SMALL) !== 0 ? 1 : 2);
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            if (this.pins == null) {
                this.volts[i] = parseJDouble(st.nextToken$0());
            } else if (this.pins[i].state) {
                this.volts[i] = parseJDouble(st.nextToken$0());
                this.pins[i].value = this.volts[i] > 2.5;
            }
        }
        return this;
    }
    needsBits(): boolean {
        return false;
    }
    setSize(s: number): void {
        this.csize = s;
        this.cspc = 8 * s;
        this.cspc2 = this.cspc * 2;
        this.flags &= ~this.FLAG_SMALL;
        this.flags |= (s === 1) ? this.FLAG_SMALL : 0;
    }
    abstract setupPins(): void;
    draw(g: Graphics): void {
        this.drawChip(g);
    }
    drawChip(g: Graphics): void {
        let i: number = 0;
        let oldfont: Font = g.getFont();
        let f: Font = new Font().init$3("SansSerif", 0, 10 * this.csize);
        //	    FontMetrics fm = g.getFontMetrics();
        for (i = 0; i !== this.getPostCount(); i++) {
            g.setFont(f);
            let p: ChipElm_Pin = this.pins[i];
            this.setVoltageColor(g, this.volts[i]);
            let a: Point = p.post;
            let b: Point = p.stub;
            CircuitElm.drawThickLine$3(g, a, b);
            p.curcount = this.updateDotCount$2(p.current, p.curcount);
            this.drawDots(g, b, a, p.curcount);
            if (p.bubble) {
                g.setColor(CircuitElm.sim.printableCheckItem.getState() ? Color.white : Color.black);
                CircuitElm.drawThickCircle(g, p.bubbleX, p.bubbleY, 1);
                g.setColor(CircuitElm.lightGrayColor);
                CircuitElm.drawThickCircle(g, p.bubbleX, p.bubbleY, 3);
            }
            g.setColor(p.selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
            let fsz: number = 10 * this.csize;
            while (true) {
                let sw: number = toInt(g.context.measureText(p.text).getWidth());
                // scale font down if it's too big
                if (sw > 10 * this.csize) {
                    fsz -= 2;
                    let f2: Font = new Font().init$3("SansSerif", 0, fsz);
                    g.setFont(f2);
                    continue;
                }
                let asc: number = g.currentFontSize;
                g.drawString(p.text, p.textloc.x - idiv(sw, 2), p.textloc.y + idiv(asc, 2));
                if (p.lineOver) {
                    let ya: number = p.textloc.y - idiv(asc, 2);
                    g.drawLine(p.textloc.x - idiv(sw, 2), ya, p.textloc.x + idiv(sw, 2), ya);
                }
                break;
            }
        }
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        CircuitElm.drawThickPolygon$4(g, this.rectPointsX, this.rectPointsY, 4);
        if (this.clockPointsX != null) {
            g.drawPolyline(this.clockPointsX, this.clockPointsY, 3);
        }
        this.drawPosts(g);
        g.setFont(oldfont);
    }
    declare rectPointsX: number[];
    declare rectPointsY: number[];
    declare clockPointsX: number[];
    declare clockPointsY: number[];
    declare pins: ChipElm_Pin[];
    declare sizeX: number;
    declare sizeY: number;
    declare lastClock: boolean;
    drag(xx: number, yy: number): void {
        yy = CircuitElm.sim.snapGrid(yy);
        if (xx < this.x) {
            xx = this.x;
            yy = this.y;
        } else {
            this.y = this.y2 = yy;
            this.x2 = CircuitElm.sim.snapGrid(xx);
        }
        this.setPoints();
    }
    setPoints(): void {
        this.clockPointsX = null;
        if (this.x2 - this.x > this.sizeX * this.cspc2 && this === CircuitElm.sim.dragElm) {
            this.setSize(2);
        }
        let hs: number = this.cspc;
        let x0: number = this.x + this.cspc2;
        let y0: number = this.y;
        let xr: number = x0 - this.cspc;
        let yr: number = y0 - this.cspc;
        let xs: number = this.sizeX * this.cspc2;
        let ys: number = this.sizeY * this.cspc2;
        this.rectPointsX = [xr, xr + xs, xr + xs, xr];
        this.rectPointsY = [yr, yr, yr + ys, yr + ys];
        this.setBbox$4(xr, yr, this.rectPointsX[2], this.rectPointsY[2]);
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            switch (p.side) {
                case ChipElm.SIDE_N:
                    p.setPoint(x0, y0, 1, 0, 0, -1, 0, 0);
                    break;
                case ChipElm.SIDE_S:
                    p.setPoint(x0, y0, 1, 0, 0, 1, 0, ys - this.cspc2);
                    break;
                case ChipElm.SIDE_W:
                    p.setPoint(x0, y0, 0, 1, -1, 0, 0, 0);
                    break;
                case ChipElm.SIDE_E:
                    p.setPoint(x0, y0, 0, 1, 1, 0, xs - this.cspc2, 0);
                    break;
            }
        }
    }
    // see if we can move pin to position xp, yp, and return the new position
    getPinPos(xp: number, yp: number, pin: number, pos: number[]): boolean {
        let x0: number = this.x + this.cspc2;
        let y0: number = this.y;
        let xr: number = x0 - this.cspc;
        let yr: number = y0 - this.cspc;
        let xd: number = (xp - xr) / this.cspc2 - .5;
        let yd: number = (yp - yr) / this.cspc2 - .5;
        if (xd < .25 && yd > 0 && yd < this.sizeY - 1) {
            pos[0] = (Math.max(Math.round(yd), 0) | 0);
            pos[1] = ChipElm.SIDE_W;
        } else if (xd > this.sizeX - .75) {
            pos[0] = (Math.min(Math.round(yd), this.sizeY - 1) | 0);
            pos[1] = ChipElm.SIDE_E;
        } else if (yd < .25) {
            pos[0] = (Math.max(Math.round(xd), 0) | 0);
            pos[1] = ChipElm.SIDE_N;
        } else if (yd > this.sizeY - .75) {
            pos[0] = (Math.min(Math.round(xd), this.sizeX - 1) | 0);
            pos[1] = ChipElm.SIDE_S;
        } else {
            return false;
        }
        if (pos[0] < 0) {
            return false;
        }
        if ((pos[1] === ChipElm.SIDE_N || pos[1] === ChipElm.SIDE_S) && pos[0] >= this.sizeX) {
            return false;
        }
        if ((pos[1] === ChipElm.SIDE_W || pos[1] === ChipElm.SIDE_E) && pos[0] >= this.sizeY) {
            return false;
        }
        for (let i: number = 0; i !== this.getPostCount(); i++) {
            if (pin === i) {
                continue;
            }
            if (this.pins[i].overlaps(pos[0], pos[1])) {
                return false;
            }
        }
        return true;
    }
    getPost(n: number): Point {
        return this.pins[n].post;
    }
    abstract getVoltageSourceCount(): number;
    // output count
    setVoltageSource(j: number, vs: number): void {
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (p.output && j-- === 0) {
                p.voltSource = vs;
                return;
            }
        }
        System.out.println("setVoltageSource failed for " + this);
    }
    stamp(): void {
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (p.output) {
                CircuitElm.sim.stampVoltageSource(0, this.nodes[i], p.voltSource);
            }
        }
    }
    execute(): void {
    }
    doStep(): void {
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (!p.output) {
                p.value = this.volts[i] > 2.5;
            }
        }
        this.execute();
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (p.output) {
                CircuitElm.sim.updateVoltageSource(0, this.nodes[i], p.voltSource, p.value ? 5 : 0);
            }
        }
    }
    reset(): void {
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            this.pins[i].value = false;
            this.pins[i].curcount = 0;
            this.volts[i] = 0;
        }
        this.lastClock = false;
    }
    dump(): string {
        let s: string = super.dump();
        if (this.needsBits()) {
            s += " " + this.bits;
        }
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            if (this.pins[i].state) {
                s += " " + this.volts[i];
            }
        }
        return s;
    }
    getInfo(arr: string[]): void {
        arr[0] = this.getChipName();
        let i: number = 0, a: number = 1;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (arr[a] != null) {
                arr[a] += "; ";
            } else {
                arr[a] = "";
            }
            let t: string = p.text;
            if (p.lineOver) {
                t += String.fromCharCode(39);
            }
            if (p.clock) {
                t = "Clk";
            }
            arr[a] += t + " = " + CircuitElm.getVoltageText(this.volts[i]);
            if (i % 2 === 1) {
                a++;
            }
        }
    }
    setCurrent(x: number, c: number): void {
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            if (this.pins[i].output && this.pins[i].voltSource === x) {
                this.pins[i].current = c;
            }
        }
    }
    getChipName(): string {
        return "chip";
    }
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    hasGroundConnection(n1: number): boolean {
        return this.pins[n1].output;
    }
    getCurrentIntoNode(n: number): number {
        return this.pins[n].current;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Flip X", (this.flags & this.FLAG_FLIP_X) !== 0);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Flip Y", (this.flags & this.FLAG_FLIP_Y) !== 0);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_FLIP_X;
            } else {
                this.flags &= ~this.FLAG_FLIP_X;
            }
            this.setPoints();
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_FLIP_Y;
            } else {
                this.flags &= ~this.FLAG_FLIP_Y;
            }
            this.setPoints();
        }
    }
    static SIDE_N: number = 0;
    static SIDE_S: number = 1;
    static SIDE_W: number = 2;
    static SIDE_E: number = 3;
}
Object.assign(ChipElm.prototype, { "csize": 0, "cspc": 0, "cspc2": 0, "bits": 0, "FLAG_SMALL": 1, "FLAG_FLIP_X": 1024, "FLAG_FLIP_Y": 2048, "rectPointsX": null, "rectPointsY": null, "clockPointsX": null, "clockPointsY": null, "pins": null, "sizeX": 0, "sizeY": 0, "lastClock": false });

export class ChipElm_Pin {
    declare $outer: any;
    init$3($outer: any, p: number, s: number, t: string): this {
        this.$outer = $outer;
        this.pos = p;
        this.side = s;
        this.text = t;
        return this;
    }
    declare post: Point;
    declare stub: Point;
    declare textloc: Point;
    declare pos: number;
    declare side: number;
    declare voltSource: number;
    declare bubbleX: number;
    declare bubbleY: number;
    declare text: string;
    declare lineOver: boolean;
    declare bubble: boolean;
    declare clock: boolean;
    declare output: boolean;
    declare value: boolean;
    declare state: boolean;
    declare selected: boolean;
    declare curcount: number;
    declare current: number;
    setPoint(px: number, py: number, dx: number, dy: number, dax: number, day: number, sx: number, sy: number): void {
        if ((this.$outer.flags & this.$outer.FLAG_FLIP_X) !== 0) {
            dx = -dx;
            dax = -dax;
            px += this.$outer.cspc2 * (this.$outer.sizeX - 1);
            sx = -sx;
        }
        if ((this.$outer.flags & this.$outer.FLAG_FLIP_Y) !== 0) {
            dy = -dy;
            day = -day;
            py += this.$outer.cspc2 * (this.$outer.sizeY - 1);
            sy = -sy;
        }
        let xa: number = px + this.$outer.cspc2 * dx * this.pos + sx;
        let ya: number = py + this.$outer.cspc2 * dy * this.pos + sy;
        this.post = new Point().init$2(xa + dax * this.$outer.cspc2, ya + day * this.$outer.cspc2);
        this.stub = new Point().init$2(xa + dax * this.$outer.cspc, ya + day * this.$outer.cspc);
        this.textloc = new Point().init$2(xa, ya);
        if (this.bubble) {
            this.bubbleX = xa + dax * 10 * this.$outer.csize;
            this.bubbleY = ya + day * 10 * this.$outer.csize;
        }
        if (this.clock) {
            this.$outer.clockPointsX = newArray(0, 3);
            this.$outer.clockPointsY = newArray(0, 3);
            this.$outer.clockPointsX[0] = xa + dax * this.$outer.cspc - idiv(dx * this.$outer.cspc, 2);
            this.$outer.clockPointsY[0] = ya + day * this.$outer.cspc - idiv(dy * this.$outer.cspc, 2);
            this.$outer.clockPointsX[1] = xa;
            this.$outer.clockPointsY[1] = ya;
            this.$outer.clockPointsX[2] = xa + dax * this.$outer.cspc + idiv(dx * this.$outer.cspc, 2);
            this.$outer.clockPointsY[2] = ya + day * this.$outer.cspc + idiv(dy * this.$outer.cspc, 2);
        }
    }
    // convert position, side to a grid position (0=top left) so we can detect overlaps
    toGrid(p: number, s: number): number {
        if (s === ChipElm.SIDE_N) {
            return p;
        }
        if (s === ChipElm.SIDE_S) {
            return p + this.$outer.sizeX * (this.$outer.sizeY - 1);
        }
        if (s === ChipElm.SIDE_W) {
            return p * this.$outer.sizeX;
        }
        if (s === ChipElm.SIDE_E) {
            return p * this.$outer.sizeX + this.$outer.sizeX - 1;
        }
        return -1;
    }
    overlaps(p: number, s: number): boolean {
        let g: number = this.toGrid(p, s);
        if (g === -1) {
            return true;
        }
        return this.toGrid(this.pos, this.side) === g;
    }
    fixName(): void {
        if (this.text.startsWith("/")) {
            this.text = this.text.substring(1);
            this.lineOver = true;
        }
        if (compareStrings(this.text.toLowerCase(), ("clk").toLowerCase()) === 0) {
            this.text = "";
            this.clock = true;
        }
    }
    constructor() {}
}
Object.assign(ChipElm_Pin.prototype, { "post": null, "stub": null, "textloc": null, "pos": 0, "side": 0, "voltSource": 0, "bubbleX": 0, "bubbleY": 0, "text": null, "lineOver": false, "bubble": false, "clock": false, "output": false, "value": false, "state": false, "selected": false, "curcount": 0, "current": 0 });
