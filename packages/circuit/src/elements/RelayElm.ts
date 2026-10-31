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
// 0 = switch
// 1 = switch end 1
// 2 = switch end 2
// ...
// 3n   = coil
// 3n+1 = coil
// 3n+2 = end of coil resistor

// Changed 2026-10-31: converted from RelayElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CircuitElm, Color, EditInfo, Graphics, Inductor, Point, StringTokenizer, idiv, newArray, parseJDouble, parseJInt, toInt } from '../core/internal';

export class RelayElm extends CircuitElm {
    declare inductance: number;
    declare ind: Inductor;
    declare r_on: number;
    declare r_off: number;
    declare onCurrent: number;
    declare coilPosts: Point[];
    declare coilLeads: Point[];
    declare swposts: Point[][];
    declare swpoles: Point[][];
    declare ptSwitch: Point[];
    declare lines: Point[];
    declare coilCurrent: number;
    declare switchCurrent: number[];
    declare coilCurCount: number;
    declare switchCurCount: number[];
    declare d_position: number;
    declare coilR: number;
    declare i_position: number;
    declare poleCount: number;
    declare openhs: number;
    declare nSwitch0: number;
    declare nSwitch1: number;
    declare nSwitch2: number;
    declare nCoil1: number;
    declare nCoil2: number;
    declare nCoil3: number;
    declare FLAG_SWAP_COIL: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.ind = new Inductor().init$1(CircuitElm.sim);
        this.inductance = .2;
        this.ind.setup(this.inductance, 0, Inductor.FLAG_BACK_EULER);
        this.noDiagonal = true;
        this.onCurrent = .02;
        this.r_on = .05;
        this.r_off = 1e6;
        this.coilR = 20;
        this.coilCurrent = this.coilCurCount = 0;
        this.poleCount = 1;
        this.setupPoles();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.poleCount = parseJInt(st.nextToken$0());
        this.inductance = parseJDouble(st.nextToken$0());
        this.coilCurrent = parseJDouble(st.nextToken$0());
        this.r_on = parseJDouble(st.nextToken$0());
        this.r_off = parseJDouble(st.nextToken$0());
        this.onCurrent = parseJDouble(st.nextToken$0());
        this.coilR = parseJDouble(st.nextToken$0());
        this.noDiagonal = true;
        this.ind = new Inductor().init$1(CircuitElm.sim);
        this.ind.setup(this.inductance, this.coilCurrent, Inductor.FLAG_BACK_EULER);
        this.setupPoles();
        return this;
    }
    setupPoles(): void {
        this.nCoil1 = 3 * this.poleCount;
        this.nCoil2 = this.nCoil1 + 1;
        this.nCoil3 = this.nCoil1 + 2;
        if (this.switchCurrent == null || this.switchCurrent.length !== this.poleCount) {
            this.switchCurrent = newArray(0, this.poleCount);
            this.switchCurCount = newArray(0, this.poleCount);
        }
    }
    getDumpType(): number {
        return 178;
    }
    dump(): string {
        return super.dump() + " " + this.poleCount + " " + this.inductance + " " + this.coilCurrent + " " + this.r_on + " " + this.r_off + " " + this.onCurrent + " " + this.coilR;
    }
    draw(g: Graphics): void {
        let i: number = 0, p: number = 0;
        for (i = 0; i !== 2; i++) {
            this.setVoltageColor(g, this.volts[this.nCoil1 + i]);
            CircuitElm.drawThickLine$3(g, this.coilLeads[i], this.coilPosts[i]);
        }
        let x: number = ((this.flags & this.FLAG_SWAP_COIL) !== 0) ? 1 : 0;
        this.setPowerColor$Graphics_dbl(g, this.coilCurrent * (this.volts[this.nCoil1] - this.volts[this.nCoil2]));
        this.drawCoil(g, this.dsign * 6, this.coilLeads[x], this.coilLeads[1 - x], this.volts[this.nCoil1 + x], this.volts[this.nCoil2 - x]);
        // draw lines
        g.setColor(Color.darkGray);
        for (i = 0; i !== this.poleCount; i++) {
            if (i === 0) {
                this.interpPoint$5(this.point1, this.point2, this.lines[i * 2], .5, this.openhs * 2 + 5 * this.dsign - i * this.openhs * 3);
            } else {
                this.interpPoint$5(this.point1, this.point2, this.lines[i * 2], .5, toInt((this.openhs * (-i * 3 + 3 - .5 + this.d_position))) + 5 * this.dsign);
            }
            this.interpPoint$5(this.point1, this.point2, this.lines[i * 2 + 1], .5, toInt((this.openhs * (-i * 3 - .5 + this.d_position))) - 5 * this.dsign);
            g.drawLine(this.lines[i * 2].x, this.lines[i * 2].y, this.lines[i * 2 + 1].x, this.lines[i * 2 + 1].y);
        }
        for (p = 0; p !== this.poleCount; p++) {
            let po: number = p * 3;
            for (i = 0; i !== 3; i++) {
                // draw lead
                this.setVoltageColor(g, this.volts[this.nSwitch0 + po + i]);
                CircuitElm.drawThickLine$3(g, this.swposts[p][i], this.swpoles[p][i]);
            }
            this.interpPoint$Point_Point_Point_dbl(this.swpoles[p][1], this.swpoles[p][2], this.ptSwitch[p], this.d_position);
            //setVoltageColor(g, volts[nSwitch0]);
            g.setColor(Color.lightGray);
            CircuitElm.drawThickLine$3(g, this.swpoles[p][0], this.ptSwitch[p]);
            this.switchCurCount[p] = this.updateDotCount$2(this.switchCurrent[p], this.switchCurCount[p]);
            this.drawDots(g, this.swposts[p][0], this.swpoles[p][0], this.switchCurCount[p]);
            if (this.i_position !== 2) {
                this.drawDots(g, this.swpoles[p][this.i_position + 1], this.swposts[p][this.i_position + 1], this.switchCurCount[p]);
            }
        }
        this.coilCurCount = this.updateDotCount$2(this.coilCurrent, this.coilCurCount);
        this.drawDots(g, this.coilPosts[0], this.coilLeads[0], this.coilCurCount);
        this.drawDots(g, this.coilLeads[0], this.coilLeads[1], this.coilCurCount);
        this.drawDots(g, this.coilLeads[1], this.coilPosts[1], this.coilCurCount);
        this.drawPosts(g);
        this.setBbox$3(this.coilPosts[0], this.coilLeads[1], 0);
        this.adjustBbox$2(this.swpoles[this.poleCount - 1][0], this.swposts[this.poleCount - 1][1]);
        // XXX
    }
    getCurrentIntoNode(n: number): number {
        if (n < 3 * this.poleCount) {
            let p: number = idiv(n, 3);
            let k: number = n % 3;
            if (k === 0) {
                return -this.switchCurrent[p];
            }
            if (k === 1 + this.i_position) {
                return this.switchCurrent[p];
            }
            return 0;
        }
        if (n === 3 * this.poleCount) {
            return -this.coilCurrent;
        }
        return this.coilCurrent;
    }
    setPoints(): void {
        super.setPoints();
        this.setupPoles();
        this.allocNodes();
        this.openhs = -this.dsign * 16;
        // switch
        this.calcLeads(32);
        this.swposts = newArray(null, this.poleCount, 3);
        this.swpoles = newArray(null, this.poleCount, 3);
        let i: number = 0, j: number = 0;
        for (i = 0; i !== this.poleCount; i++) {
            for (j = 0; j !== 3; j++) {
                this.swposts[i][j] = new Point().init$0();
                this.swpoles[i][j] = new Point().init$0();
            }
            this.interpPoint$5(this.lead1, this.lead2, this.swpoles[i][0], 0, -this.openhs * 3 * i);
            this.interpPoint$5(this.lead1, this.lead2, this.swpoles[i][1], 1, -this.openhs * 3 * i - this.openhs);
            this.interpPoint$5(this.lead1, this.lead2, this.swpoles[i][2], 1, -this.openhs * 3 * i + this.openhs);
            this.interpPoint$5(this.point1, this.point2, this.swposts[i][0], 0, -this.openhs * 3 * i);
            this.interpPoint$5(this.point1, this.point2, this.swposts[i][1], 1, -this.openhs * 3 * i - this.openhs);
            this.interpPoint$5(this.point1, this.point2, this.swposts[i][2], 1, -this.openhs * 3 * i + this.openhs);
        }
        // coil
        this.coilPosts = this.newPointArray(2);
        this.coilLeads = this.newPointArray(2);
        this.ptSwitch = this.newPointArray(this.poleCount);
        let x: number = ((this.flags & this.FLAG_SWAP_COIL) !== 0) ? 1 : 0;
        this.interpPoint$5(this.point1, this.point2, this.coilPosts[0], x, this.openhs * 2);
        this.interpPoint$5(this.point1, this.point2, this.coilPosts[1], x, this.openhs * 3);
        this.interpPoint$5(this.point1, this.point2, this.coilLeads[0], .5, this.openhs * 2);
        this.interpPoint$5(this.point1, this.point2, this.coilLeads[1], .5, this.openhs * 3);
        // lines
        this.lines = this.newPointArray(this.poleCount * 2);
    }
    getPost(n: number): Point {
        if (n < 3 * this.poleCount) {
            return this.swposts[idiv(n, 3)][n % 3];
        }
        return this.coilPosts[n - 3 * this.poleCount];
    }
    getPostCount(): number {
        return 2 + this.poleCount * 3;
    }
    getInternalNodeCount(): number {
        return 1;
    }
    reset(): void {
        super.reset();
        this.ind.reset();
        this.coilCurrent = this.coilCurCount = 0;
        let i: number = 0;
        for (i = 0; i !== this.poleCount; i++) {
            this.switchCurrent[i] = this.switchCurCount[i] = 0;
        }
    }
    declare a1: number;
    declare a2: number;
    declare a3: number;
    declare a4: number;
    stamp(): void {
        // inductor from coil post 1 to internal node
        this.ind.stamp(this.nodes[this.nCoil1], this.nodes[this.nCoil3]);
        // resistor from internal node to coil post 2
        CircuitElm.sim.stampResistor(this.nodes[this.nCoil3], this.nodes[this.nCoil2], this.coilR);
        let i: number = 0;
        for (i = 0; i !== this.poleCount * 3; i++) {
            CircuitElm.sim.stampNonLinear(this.nodes[this.nSwitch0 + i]);
        }
    }
    startIteration(): void {
        this.ind.startIteration(this.volts[this.nCoil1] - this.volts[this.nCoil3]);
        // magic value to balance operate speed with reset speed semi-realistically
        let magic: number = 1.3;
        let pmult: number = Math.sqrt(magic + 1);
        let p: number = this.coilCurrent * pmult / this.onCurrent;
        this.d_position = Math.abs(p * p) - 1.3;
        if (this.d_position < 0) {
            this.d_position = 0;
        }
        if (this.d_position > 1) {
            this.d_position = 1;
        }
        if (this.d_position < .1) {
            this.i_position = 0;
        } else if (this.d_position > .9) {
            this.i_position = 1;
        } else {
            this.i_position = 2;
        }
        //System.out.println("ind " + this + " " + current + " " + voltdiff);
    }
    // we need this to be able to change the matrix for each step
    nonLinear(): boolean {
        return true;
    }
    doStep(): void {
        let voltdiff: number = this.volts[this.nCoil1] - this.volts[this.nCoil3];
        this.ind.doStep(voltdiff);
        let p: number = 0;
        for (p = 0; p !== this.poleCount * 3; p += 3) {
            CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch1 + p], this.i_position === 0 ? this.r_on : this.r_off);
            CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch2 + p], this.i_position === 1 ? this.r_on : this.r_off);
        }
    }
    calculateCurrent(): void {
        let voltdiff: number = this.volts[this.nCoil1] - this.volts[this.nCoil3];
        this.coilCurrent = this.ind.calculateCurrent(voltdiff);
        // actually this isn't correct, since there is a small amount
        // of current through the switch when off
        let p: number = 0;
        for (p = 0; p !== this.poleCount; p++) {
            if (this.i_position === 2) {
                this.switchCurrent[p] = 0;
            } else {
                this.switchCurrent[p] = (this.volts[this.nSwitch0 + p * 3] - this.volts[this.nSwitch1 + p * 3 + this.i_position]) / this.r_on;
            }
        }
    }
    getInfo(arr: string[]): void {
        arr[0] = this.i_position === 0 ? "relay (off)" : this.i_position === 1 ? "relay (on)" : "relay";
        let i: number = 0;
        let ln: number = 1;
        for (i = 0; i !== this.poleCount; i++) {
            arr[ln++] = "I" + (i + 1) + " = " + CircuitElm.getCurrentDText(this.switchCurrent[i]);
        }
        arr[ln++] = "coil I = " + CircuitElm.getCurrentDText(this.coilCurrent);
        arr[ln++] = "coil Vd = " + CircuitElm.getVoltageDText(this.volts[this.nCoil1] - this.volts[this.nCoil2]);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Inductance (H)", this.inductance, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("On Current (A)", this.onCurrent, 0, 0);
        }
        if (n === 4) {
            return new EditInfo("Number of Poles", this.poleCount, 1, 4).setDimensionless();
        }
        if (n === 5) {
            return new EditInfo("Coil Resistance (ohms)", this.coilR, 0, 0);
        }
        if (n === 6) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Swap Coil Direction", (this.flags & this.FLAG_SWAP_COIL) !== 0);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.inductance = ei.value;
            this.ind.setup(this.inductance, this.coilCurrent, Inductor.FLAG_BACK_EULER);
        }
        if (n === 1 && ei.value > 0) {
            this.r_on = ei.value;
        }
        if (n === 2 && ei.value > 0) {
            this.r_off = ei.value;
        }
        if (n === 3 && ei.value > 0) {
            this.onCurrent = ei.value;
        }
        if (n === 4 && ei.value >= 1) {
            this.poleCount = toInt(ei.value);
            this.setPoints();
        }
        if (n === 5 && ei.value > 0) {
            this.coilR = ei.value;
        }
        if (n === 6) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_SWAP_COIL;
            } else {
                this.flags &= ~this.FLAG_SWAP_COIL;
            }
            this.setPoints();
        }
    }
    getConnection(n1: number, n2: number): boolean {
        return (idiv(n1, 3) === idiv(n2, 3));
    }
    getShortcut(): number {
        return 82;
    }
}
Object.assign(RelayElm.prototype, { "inductance": 0, "ind": null, "r_on": 0, "r_off": 0, "onCurrent": 0, "coilPosts": null, "coilLeads": null, "swposts": null, "swpoles": null, "ptSwitch": null, "lines": null, "coilCurrent": 0, "switchCurrent": null, "coilCurCount": 0, "switchCurCount": null, "d_position": 0, "coilR": 0, "i_position": 0, "poleCount": 0, "openhs": 0, "nSwitch0": 0, "nSwitch1": 1, "nSwitch2": 2, "nCoil1": 0, "nCoil2": 0, "nCoil3": 0, "FLAG_SWAP_COIL": 1, "a1": 0, "a2": 0, "a3": 0, "a4": 0 });
