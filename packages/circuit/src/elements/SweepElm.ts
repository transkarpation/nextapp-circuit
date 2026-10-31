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

// Changed 2026-10-31: converted from SweepElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, Color, EditInfo, Graphics, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class SweepElm extends CircuitElm {
    declare maxV: number;
    declare maxF: number;
    declare minF: number;
    declare sweepTime: number;
    declare frequency: number;
    declare FLAG_LOG: number;
    declare FLAG_BIDIR: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.dir = 1;
        this.minF = 20;
        this.maxF = 4000;
        this.maxV = 5;
        this.sweepTime = .1;
        this.flags = this.FLAG_BIDIR;
        this.reset();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.dir = 1;
        this.minF = parseJDouble(st.nextToken$0());
        this.maxF = parseJDouble(st.nextToken$0());
        this.maxV = parseJDouble(st.nextToken$0());
        this.sweepTime = parseJDouble(st.nextToken$0());
        this.reset();
        return this;
    }
    getDumpType(): number {
        return 170;
    }
    getPostCount(): number {
        return 1;
    }
    declare circleSize: number;
    dump(): string {
        return super.dump() + " " + this.minF + " " + this.maxF + " " + this.maxV + " " + this.sweepTime;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = this.interpPoint$3(this.point1, this.point2, 1 - this.circleSize / this.dn);
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.circleSize);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
        this.setPowerColor$Graphics_bool(g, false);
        let xc: number = this.point2.x;
        let yc: number = this.point2.y;
        CircuitElm.drawThickCircle(g, xc, yc, this.circleSize);
        let wl: number = 8;
        this.adjustBbox$4(xc - this.circleSize, yc - this.circleSize, xc + this.circleSize, yc + this.circleSize);
        let i: number = 0;
        let xl: number = 10;
        let tm: number = Date.now();
        //double w = (this == mouseElm ? 3 : 2);
        tm %= 2000;
        if (tm > 1000) {
            tm = 2000 - tm;
        }
        let w: number = 1 + tm * .002;
        if (CircuitElm.sim.simIsRunning()) {
            w = 1 + 2 * (this.frequency - this.minF) / (this.maxF - this.minF);
        }
        g.context.beginPath();
        g.context.setLineWidth(3.0);
        for (i = -xl; i <= xl; i++) {
            let yy: number = yc + toInt((.95 * Math.sin(i * CircuitElm.pi * w / xl) * wl));
            if (i === -xl) {
                g.context.moveTo(xc + i, yy);
            } else {
                g.context.lineTo(xc + i, yy);
            }
        }
        g.context.stroke();
        g.context.setLineWidth(1.0);
        if (CircuitElm.sim.showValuesCheckItem.getState()) {
            let s: string = CircuitElm.getShortUnitText(this.frequency, "Hz");
            if (this.dx === 0 || this.dy === 0) {
                this.drawValues$3(g, s, this.circleSize);
            }
        }
        this.drawPosts(g);
        this.curcount = this.updateDotCount$2(-this.current, this.curcount);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead1, this.curcount);
        }
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(0, this.nodes[0], this.voltSource);
    }
    declare fadd: number;
    declare fmul: number;
    declare freqTime: number;
    declare savedTimeStep: number;
    declare dir: number;
    setParams(): void {
        if (this.frequency < this.minF || this.frequency > this.maxF) {
            this.frequency = this.minF;
            this.freqTime = 0;
            this.dir = 1;
        }
        if ((this.flags & this.FLAG_LOG) === 0) {
            this.fadd = this.dir * CircuitElm.sim.timeStep * (this.maxF - this.minF) / this.sweepTime;
            this.fmul = 1;
        } else {
            this.fadd = 0;
            this.fmul = Math.pow(this.maxF / this.minF, this.dir * CircuitElm.sim.timeStep / this.sweepTime);
        }
        this.savedTimeStep = CircuitElm.sim.timeStep;
    }
    reset(): void {
        this.frequency = this.minF;
        this.freqTime = 0;
        this.dir = 1;
        this.setParams();
    }
    declare v: number;
    startIteration(): void {
        // has timestep been changed?
        if (CircuitElm.sim.timeStep !== this.savedTimeStep) {
            this.setParams();
        }
        this.v = Math.sin(this.freqTime) * this.maxV;
        this.freqTime += this.frequency * 2 * CircuitElm.pi * CircuitElm.sim.timeStep;
        this.frequency = this.frequency * this.fmul + this.fadd;
        if (this.frequency >= this.maxF && this.dir === 1) {
            if ((this.flags & this.FLAG_BIDIR) !== 0) {
                this.fadd = -this.fadd;
                this.fmul = 1 / this.fmul;
                this.dir = -1;
            } else {
                this.frequency = this.minF;
            }
        }
        if (this.frequency <= this.minF && this.dir === -1) {
            this.fadd = -this.fadd;
            this.fmul = 1 / this.fmul;
            this.dir = 1;
        }
    }
    doStep(): void {
        CircuitElm.sim.updateVoltageSource(0, this.nodes[0], this.voltSource, this.v);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    hasGroundConnection(n1: number): boolean {
        return true;
    }
    getInfo(arr: string[]): void {
        arr[0] = "sweep " + (((this.flags & this.FLAG_LOG) === 0) ? "(linear)" : "(log)");
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
        arr[2] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[3] = "f = " + CircuitElm.getUnitText$2(this.frequency, "Hz");
        arr[4] = "range = " + CircuitElm.getUnitText$2(this.minF, "Hz") + " .. " + CircuitElm.getUnitText$2(this.maxF, "Hz");
        arr[5] = "time = " + CircuitElm.getUnitText$2(this.sweepTime, "s");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Min Frequency (Hz)", this.minF, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Max Frequency (Hz)", this.maxF, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Sweep Time (s)", this.sweepTime, 0, 0);
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Logarithmic", (this.flags & this.FLAG_LOG) !== 0);
            return ei;
        }
        if (n === 4) {
            return new EditInfo("Max Voltage", this.maxV, 0, 0);
        }
        if (n === 5) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Bidirectional", (this.flags & this.FLAG_BIDIR) !== 0);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        let maxfreq: number = 1 / (8 * CircuitElm.sim.timeStep);
        if (n === 0) {
            this.minF = ei.value;
            if (this.minF > maxfreq) {
                this.minF = maxfreq;
            }
        }
        if (n === 1) {
            this.maxF = ei.value;
            if (this.maxF > maxfreq) {
                this.maxF = maxfreq;
            }
        }
        if (n === 2) {
            this.sweepTime = ei.value;
        }
        if (n === 3) {
            this.flags &= ~this.FLAG_LOG;
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_LOG;
            }
        }
        if (n === 4) {
            this.maxV = ei.value;
        }
        if (n === 5) {
            this.flags &= ~this.FLAG_BIDIR;
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_BIDIR;
            }
        }
        this.setParams();
    }
    getPower(): number {
        return -this.getVoltageDiff() * this.current;
    }
}
Object.assign(SweepElm.prototype, { "maxV": 0, "maxF": 0, "minF": 0, "sweepTime": 0, "frequency": 0, "FLAG_LOG": 1, "FLAG_BIDIR": 2, "circleSize": 17, "fadd": 0, "fmul": 0, "freqTime": 0, "savedTimeStep": 0, "dir": 0, "v": 0 });
