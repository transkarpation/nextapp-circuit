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

// Changed 2026-10-31: converted from TransLineElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Color, EditInfo, Graphics, Point, StringTokenizer, System, idiv, newArray, parseJDouble, parseJInt, toInt } from '../core/internal';

export class TransLineElm extends CircuitElm {
    declare delay: number;
    declare imped: number;
    declare voltageL: number[];
    declare voltageR: number[];
    declare lenSteps: number;
    declare ptr: number;
    declare width: number;
    declare lastStepCount: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.delay = 1000 * CircuitElm.sim.maxTimeStep;
        this.imped = 75;
        this.noDiagonal = true;
        this.reset();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.delay = parseJDouble(st.nextToken$0());
        this.imped = parseJDouble(st.nextToken$0());
        this.width = parseJInt(st.nextToken$0());
        // next slot is for resistance (losses), which is not implemented
        st.nextToken$0();
        this.noDiagonal = true;
        this.reset();
        return this;
    }
    getDumpType(): number {
        return 171;
    }
    getPostCount(): number {
        return 4;
    }
    getInternalNodeCount(): number {
        return 2;
    }
    dump(): string {
        return super.dump() + " " + this.delay + " " + this.imped + " " + this.width + " " + 0.;
    }
    drag(xx: number, yy: number): void {
        xx = CircuitElm.sim.snapGrid(xx);
        yy = CircuitElm.sim.snapGrid(yy);
        let w1: number = CircuitElm.max(CircuitElm.sim.gridSize, CircuitElm.abs(yy - this.y));
        let w2: number = CircuitElm.max(CircuitElm.sim.gridSize, CircuitElm.abs(xx - this.x));
        if (w1 > w2) {
            xx = this.x;
            this.width = w2;
        } else {
            yy = this.y;
            this.width = w1;
        }
        this.x2 = xx;
        this.y2 = yy;
        this.setPoints();
    }
    declare posts: Point[];
    declare inner: Point[];
    reset(): void {
        if (CircuitElm.sim.maxTimeStep === 0) {
            return;
        }
        this.lenSteps = toInt((this.delay / CircuitElm.sim.maxTimeStep));
        System.out.println(this.lenSteps + " steps");
        if (this.lenSteps > 100000) {
            this.voltageL = this.voltageR = null;
        } else {
            this.voltageL = newArray(0, this.lenSteps);
            this.voltageR = newArray(0, this.lenSteps);
        }
        this.ptr = 0;
        super.reset();
        this.lastStepCount = 0;
    }
    setPoints(): void {
        super.setPoints();
        let ds: number = (this.dy === 0) ? CircuitElm.sign$1(this.dx) : -CircuitElm.sign$1(this.dy);
        let p3: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 0, -this.width * ds);
        let p4: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1, -this.width * ds);
        let sep: number = idiv(CircuitElm.sim.gridSize, 2);
        let p5: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 0, -(idiv(this.width, 2) - sep) * ds);
        let p6: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1, -(idiv(this.width, 2) - sep) * ds);
        let p7: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 0, -(idiv(this.width, 2) + sep) * ds);
        let p8: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1, -(idiv(this.width, 2) + sep) * ds);
        // we number the posts like this because we want the lower-numbered
        // points to be on the bottom, so that if some of them are unconnected
        // (which is often true) then the bottom ones will get automatically
        // attached to ground.
        this.posts = [p3, p4, this.point1, this.point2];
        this.inner = [p7, p8, p5, p6];
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.posts[0], this.posts[3], 0);
        let segments: number = toInt((this.dn / 2));
        let ix0: number = this.ptr - 1 + this.lenSteps;
        let segf: number = 1. / segments;
        let i: number = 0;
        g.setColor(Color.darkGray);
        g.fillRect(this.inner[2].x, this.inner[2].y, this.inner[1].x - this.inner[2].x + 2, this.inner[1].y - this.inner[2].y + 2);
        for (i = 0; i !== 4; i++) {
            this.setVoltageColor(g, this.volts[i]);
            CircuitElm.drawThickLine$3(g, this.posts[i], this.inner[i]);
        }
        if (this.voltageL != null) {
            for (i = 0; i !== segments; i++) {
                let ix1: number = (ix0 - idiv(this.lenSteps * i, segments)) % this.lenSteps;
                let ix2: number = (ix0 - idiv(this.lenSteps * (segments - 1 - i), segments)) % this.lenSteps;
                let v: number = (this.voltageL[ix1] + this.voltageR[ix2]) / 2;
                this.setVoltageColor(g, v);
                this.interpPoint$Point_Point_Point_dbl(this.inner[0], this.inner[1], CircuitElm.ps1, i * segf);
                this.interpPoint$Point_Point_Point_dbl(this.inner[2], this.inner[3], CircuitElm.ps2, i * segf);
                g.drawLine(CircuitElm.ps1.x, CircuitElm.ps1.y, CircuitElm.ps2.x, CircuitElm.ps2.y);
                this.interpPoint$Point_Point_Point_dbl(this.inner[2], this.inner[3], CircuitElm.ps1, (i + 1) * segf);
                CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            }
        }
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.inner[0], this.inner[1]);
        this.drawPosts(g);
        this.curCount1 = this.updateDotCount$2(-this.current1, this.curCount1);
        this.curCount2 = this.updateDotCount$2(this.current2, this.curCount2);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.posts[0], this.inner[0], this.curCount1);
            this.drawDots(g, this.posts[2], this.inner[2], -this.curCount1);
            this.drawDots(g, this.posts[1], this.inner[1], -this.curCount2);
            this.drawDots(g, this.posts[3], this.inner[3], this.curCount2);
        }
    }
    declare voltSource1: number;
    declare voltSource2: number;
    declare current1: number;
    declare current2: number;
    declare curCount1: number;
    declare curCount2: number;
    setVoltageSource(n: number, v: number): void {
        if (n === 0) {
            this.voltSource1 = v;
        } else {
            this.voltSource2 = v;
        }
    }
    setCurrent(v: number, c: number): void {
        if (v === this.voltSource1) {
            this.current1 = c;
        } else {
            this.current2 = c;
        }
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(this.nodes[4], this.nodes[0], this.voltSource1);
        CircuitElm.sim.stampVoltageSource(this.nodes[5], this.nodes[1], this.voltSource2);
        CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[4], this.imped);
        CircuitElm.sim.stampResistor(this.nodes[3], this.nodes[5], this.imped);
    }
    startIteration(): void {
        // calculate voltages, currents sent over wire
        if (this.voltageL == null) {
            CircuitElm.sim.stop("Transmission line delay too large!", this);
            return;
        }
        this.voltageL[this.ptr] = this.volts[2] - this.volts[0] + this.volts[2] - this.volts[4];
        this.voltageR[this.ptr] = this.volts[3] - this.volts[1] + this.volts[3] - this.volts[5];
        //System.out.println(volts[2] + " " + volts[0] + " " + (volts[2]-volts[0]) + " " + (imped*current1) + " " + voltageL[ptr]);
        /*System.out.println("sending fwd  " + currentL[ptr] + " " + current1);
	  System.out.println("sending back " + currentR[ptr] + " " + current2);*/
        //System.out.println("sending back " + voltageR[ptr]);
    }
    doStep(): void {
        if (this.voltageL == null) {
            CircuitElm.sim.stop("Transmission line delay too large!", this);
            return;
        }
        let nextPtr: number = (this.ptr + 1) % this.lenSteps;
        CircuitElm.sim.updateVoltageSource(this.nodes[4], this.nodes[0], this.voltSource1, -this.voltageR[nextPtr]);
        CircuitElm.sim.updateVoltageSource(this.nodes[5], this.nodes[1], this.voltSource2, -this.voltageL[nextPtr]);
        if (Math.abs(this.volts[0]) > 1e-5 || Math.abs(this.volts[1]) > 1e-5) {
            CircuitElm.sim.stop("Need to ground transmission line!", this);
            return;
        }
    }
    stepFinished(): void {
        if (CircuitElm.sim.timeStepCount === this.lastStepCount) {
            return;
        }
        this.lastStepCount = CircuitElm.sim.timeStepCount;
        this.ptr = (this.ptr + 1) % this.lenSteps;
    }
    getPost(n: number): Point {
        return this.posts[n];
    }
    //double getVoltageDiff() { return volts[0]; }
    getVoltageSourceCount(): number {
        return 2;
    }
    hasGroundConnection(n1: number): boolean {
        return false;
    }
    getConnection(n1: number, n2: number): boolean {
        return false;
        /*if (comparePair(n1, n2, 0, 1))
	  return true;
	  if (comparePair(n1, n2, 2, 3))
	  return true;
	  return false;*/
    }
    getInfo(arr: string[]): void {
        arr[0] = "transmission line";
        arr[1] = CircuitElm.getUnitText$2(this.imped, CirSim.ohmString);
        // use velocity factor for RG-58 cable (65%)
        arr[2] = "length = " + CircuitElm.getUnitText$2(.65 * 2.9979e8 * this.delay, "m");
        arr[3] = "delay = " + CircuitElm.getUnitText$2(this.delay, "s");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Delay (s)", this.delay, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Impedance (ohms)", this.imped, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.delay = ei.value;
            this.reset();
        }
        if (n === 1 && ei.value > 0) {
            this.imped = ei.value;
            this.reset();
        }
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return this.current1;
        }
        if (n === 2) {
            return -this.current1;
        }
        if (n === 3) {
            return -this.current2;
        }
        return this.current2;
    }
}
Object.assign(TransLineElm.prototype, { "delay": 0, "imped": 0, "voltageL": null, "voltageR": null, "lenSteps": 0, "ptr": 0, "width": 0, "lastStepCount": 0, "posts": null, "inner": null, "voltSource1": 0, "voltSource2": 0, "current1": 0, "current2": 0, "curCount1": 0, "curCount2": 0 });
