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

// Changed 2026-10-31: converted from CustomTransformerElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CirSim, CircuitElm, CustomLogicModel, EditInfo, Graphics, Inductor, Point, StringTokenizer, Window, newArray, parseJDouble, parseJInt } from '../core/internal';

export class CustomTransformerElm extends CircuitElm {
    declare coilCurrents: number[];
    declare coilInductances: number[];
    declare coilCurCounts: number[];
    declare coilCurSourceValues: number[];
    declare coilPolarities: number[];
    declare nodeCurrents: number[];
    declare nodeCurCounts: number[];
    // node number n of first node of each coil (second node = n+1)
    declare coilNodes: number[];
    declare coilCount: number;
    declare nodeCount: number;
    // number of primary coils
    declare primaryCoils: number;
    declare nodePoints: Point[];
    declare nodeTaps: Point[];
    declare ptCore: Point[];
    declare description: string;
    declare inductance: number;
    declare couplingCoef: number;
    declare needDots: boolean;
    declare dots: Point[];
    declare width: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.inductance = 4;
        this.width = 32;
        this.noDiagonal = true;
        this.couplingCoef = .999;
        this.description = "1,1:1";
        this.parseDescription$1(this.description);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.width = 32;
        // max(32, abs(yb-ya));
        this.inductance = parseJDouble(st.nextToken$0());
        this.couplingCoef = parseJDouble(st.nextToken$0());
        let str: string = st.nextToken$0();
        this.description = CustomLogicModel.unescape(str);
        this.coilCount = parseJInt(st.nextToken$0());
        let i: number = 0;
        this.coilCurrents = newArray(0, this.coilCount);
        for (i = 0; i !== this.coilCount; i++) {
            this.coilCurrents[i] = parseJDouble(st.nextToken$0());
        }
        this.noDiagonal = true;
        this.parseDescription$1(this.description);
        return this;
    }
    drag(xx: number, yy: number): void {
        xx = CircuitElm.sim.snapGrid(xx);
        yy = CircuitElm.sim.snapGrid(yy);
        //	    width = max(32, abs(yy-y));
        if (xx === this.x) {
            yy = this.y;
        }
        this.x2 = xx;
        this.y2 = yy;
        this.setPoints();
    }
    getDumpType(): number {
        return 406;
    }
    dump(): string {
        let s: string = super.dump() + " " + this.inductance + " " + this.couplingCoef + " " + CustomLogicModel.escape(this.description) + " " + this.coilCount + " ";
        let i: number = 0;
        for (i = 0; i !== this.coilCount; i++) {
            s += this.coilCurrents[i] + " ";
        }
        return s;
    }
    parseDescription$0(): void {
        this.parseDescription$1(this.description);
    }
    parseDescription$1(desc: string): boolean {
        // a number indicates a coil (number = turns ratio to base inductance coil)
        // (negative number = reverse polarity)
        // : separates primary and secondary
        // , separates two coils
        // + separates two connected coils (tapped)
        let st: StringTokenizer = new StringTokenizer().init$3(desc, ",:+", true);
        // count coils/nodes
        this.coilCount = this.nodeCount = 0;
        while (st.hasMoreTokens()) {
            let s: string = st.nextToken$0();
            if (s === "+") {
                this.nodeCount--;
            }
            if (s === "," || s === "+" || s === ":") {
                continue;
            }
            this.nodeCount += 2;
            this.coilCount++;
        }
        this.coilNodes = newArray(0, this.coilCount);
        this.coilInductances = newArray(0, this.coilCount);
        // save coil currents if possible (needed for undumping)
        if (this.coilCurrents == null || this.coilCurrents.length !== this.coilCount) {
            this.coilCurrents = newArray(0, this.coilCount);
        }
        this.coilCurCounts = newArray(0, this.coilCount);
        this.coilCurSourceValues = newArray(0, this.coilCount);
        this.coilPolarities = newArray(0, this.coilCount);
        this.nodePoints = this.newPointArray(this.nodeCount);
        this.nodeTaps = this.newPointArray(this.nodeCount);
        this.nodeCurrents = newArray(0, this.nodeCount);
        this.nodeCurCounts = newArray(0, this.nodeCount);
        // start over
        st = new StringTokenizer().init$3(desc, ",:+", true);
        let nodeNum: number = 0;
        let coilNum: number = 0;
        this.primaryCoils = 0;
        let secondary: boolean = false;
        this.needDots = false;
        while (true) {
            let tok: string = st.nextToken$0();
            let n: number = 0;
            try {
                n = parseJDouble(tok);
            } catch (e) {
                return false;
            }
            if (n === 0) {
                return false;
            }
            // create new coil
            this.coilNodes[coilNum] = nodeNum;
            this.coilInductances[coilNum] = n * n * this.inductance;
            this.coilPolarities[coilNum] = 1;
            if (n < 0) {
                this.coilPolarities[coilNum] = -1;
                this.needDots = true;
            }
            nodeNum += 2;
            coilNum++;
            if (!secondary) {
                this.primaryCoils = coilNum;
            }
            if (!st.hasMoreTokens()) {
                break;
            }
            tok = st.nextToken$0();
            if (tok === ",") {
                continue;
            }
            if (tok === "+") {
                nodeNum--;
                continue;
            }
            if (tok === ":") {
                // switch to secondary
                if (secondary) {
                    return false;
                }
                secondary = true;
                continue;
            }
            return false;
        }
        this.allocNodes();
        this.setPoints();
        return true;
    }
    isTrapezoidal(): boolean {
        return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
    }
    draw(g: Graphics): void {
        let i: number = 0;
        // draw taps
        for (i = 0; i !== this.getPostCount(); i++) {
            this.setVoltageColor(g, this.volts[i]);
            CircuitElm.drawThickLine$3(g, this.nodePoints[i], this.nodeTaps[i]);
        }
        // draw coils
        for (i = 0; i !== this.coilCount; i++) {
            let n: number = this.coilNodes[i];
            this.setVoltageColor(g, this.volts[n]);
            this.setPowerColor$Graphics_dbl(g, this.coilCurrents[i] * (this.volts[n] - this.volts[n + 1]));
            this.drawCoil(g, (i >= this.primaryCoils ? -6 : 6), this.nodeTaps[n], this.nodeTaps[n + 1], this.volts[n], this.volts[n + 1]);
            if (this.dots != null) {
                g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
                g.fillOval(this.dots[i].x - 2, this.dots[i].y - 2, 5, 5);
            }
        }
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        // draw core
        for (i = 0; i !== 2; i++) {
            CircuitElm.drawThickLine$3(g, this.ptCore[i], this.ptCore[i + 2]);
        }
        // draw coil currents
        for (i = 0; i !== this.coilCount; i++) {
            this.coilCurCounts[i] = this.updateDotCount$2(this.coilCurrents[i], this.coilCurCounts[i]);
            let ni: number = this.coilNodes[i];
            this.drawDots(g, this.nodeTaps[ni], this.nodeTaps[ni + 1], this.coilCurCounts[i]);
        }
        // draw tap currents
        for (i = 0; i !== this.nodeCount; i++) {
            this.nodeCurCounts[i] = this.updateDotCount$2(this.nodeCurrents[i], this.nodeCurCounts[i]);
            this.drawDots(g, this.nodePoints[i], this.nodeTaps[i], this.nodeCurCounts[i]);
        }
        this.drawPosts(g);
        this.setBbox$3(this.nodePoints[0], this.nodePoints[this.nodeCount - 1], 0);
        this.adjustBbox$2(this.ptCore[0], this.ptCore[3]);
    }
    setPoints(): void {
        super.setPoints();
        this.point2.y = this.point1.y;
        let i: number = 0;
        let primaryNodes: number = (this.primaryCoils === this.coilCount) ? this.nodeCount : this.coilNodes[this.primaryCoils];
        this.dn = Math.abs(this.point1.x - this.point2.x);
        let ce: number = .5 - 12 / this.dn;
        let cd: number = .5 - 2 / this.dn;
        let maxWidth: number = 0;
        let step: number = 0;
        for (step = 0; step !== 2; step++) {
            let c: number = 0;
            let offset: number = 0;
            for (i = 0; i !== this.nodeCount; i++) {
                if (i === primaryNodes) {
                    offset = 0;
                }
                if (step === 1) {
                    if (i === primaryNodes - 1 || i === this.nodeCount - 1) {
                        offset = maxWidth;
                    }
                    this.interpPoint$5(this.point1, this.point2, this.nodePoints[i], i < primaryNodes ? 0 : 1, -offset);
                    this.interpPoint$5(this.point1, this.point2, this.nodeTaps[i], i < primaryNodes ? ce : 1 - ce, -offset);
                }
                maxWidth = Math.max(maxWidth, offset);
                let nn: number = c < this.coilCount ? this.coilNodes[c] : -1;
                if (nn === i) {
                    // this is first node of a coil, make room
                    c++;
                    offset += this.width;
                } else {
                    // this is last node of a coil, make small gap
                    offset += 16;
                }
            }
        }
        this.ptCore = this.newPointArray(4);
        for (i = 0; i !== 4; i += 2) {
            let h: number = (i === 2) ? -maxWidth : 0;
            this.interpPoint$5(this.point1, this.point2, this.ptCore[i], cd, h);
            this.interpPoint$5(this.point1, this.point2, this.ptCore[i + 1], 1 - cd, h);
        }
        if (this.needDots) {
            this.dots = newArray(null, this.coilCount);
            let dotp: number = Math.abs(7. / this.width);
            for (i = 0; i !== this.coilCount; i++) {
                let n: number = this.coilNodes[i];
                this.dots[i] = this.interpPoint$Point_Point_dbl_dbl(this.nodeTaps[n], this.nodeTaps[n + 1], this.coilPolarities[i] > 0 ? dotp : 1 - dotp, i < this.primaryCoils ? -7 : 7);
            }
        } else {
            this.dots = null;
        }
    }
    getPost(n: number): Point {
        return this.nodePoints[n];
    }
    getPostCount(): number {
        return this.nodeCount;
    }
    reset(): void {
        let i: number = 0;
        for (i = 0; i !== this.coilCount; i++) {
            this.coilCurrents[i] = this.coilCurSourceValues[i] = this.coilCurCounts[i] = 0;
        }
        for (i = 0; i !== this.nodeCount; i++) {
            this.volts[i] = this.nodeCurrents[i] = this.nodeCurCounts[i] = 0;
        }
    }
    declare xformMatrix: number[][];
    stamp(): void {
        // equations for transformer:
        //   v1 = L1  di1/dt + M12  di2/dt + M13 di3/dt + ...
        //   v2 = M21 di1/dt + L2 di2/dt   + M23 di3/dt + ...
        //   v3 = ... (one row for each coil)
        // we invert that to get:
        //   di1/dt = a1 v1 + a2 v2 + ...
        //   di2/dt = a3 v1 + a4 v2 + ...
        // integrate di1/dt using trapezoidal approx and we get:
        //   i1(t2) = i1(t1) + dt/2 (i1(t1) + i1(t2))
        //          = i1(t1) + a1 dt/2 v1(t1) + a2 dt/2 v2(t1) + ... +
        //                     a1 dt/2 v1(t2) + a2 dt/2 v2(t2) + ...
        // the norton equivalent of this for i1 is:
        //  a. current source, I = i1(t1) + a1 dt/2 v1(t1) + a2 dt/2 v2(t1) + ...
        //  b. resistor, G = a1 dt/2
        //  c. current source controlled by voltage v2, G = a2 dt/2
        // and for i2:
        //  a. current source, I = i2(t1) + a3 dt/2 v1(t1) + a4 dt/2 v2(t1) + ...
        //  b. resistor, G = a3 dt/2
        //  c. current source controlled by voltage v2, G = a4 dt/2
        //
        // For backward euler, the current source value is just i1(t1) and we use
        // dt instead of dt/2 for the resistor and VCCS.
        this.xformMatrix = newArray(0, this.coilCount, this.coilCount);
        let i: number = 0;
        // fill diagonal
        for (i = 0; i !== this.coilCount; i++) {
            this.xformMatrix[i][i] = this.coilInductances[i];
        }
        let j: number = 0;
        // fill off-diagonal
        for (i = 0; i !== this.coilCount; i++) {
            for (j = 0; j !== i; j++) {
                this.xformMatrix[i][j] = this.xformMatrix[j][i] = this.couplingCoef * Math.sqrt(this.coilInductances[i] * this.coilInductances[j]) * this.coilPolarities[i] * this.coilPolarities[j];
            }
        }
        CirSim.invertMatrix(this.xformMatrix, this.coilCount);
        let ts: number = this.isTrapezoidal() ? CircuitElm.sim.timeStep / 2 : CircuitElm.sim.timeStep;
        for (i = 0; i !== this.coilCount; i++) {
            for (j = 0; j !== this.coilCount; j++) {
                // multiply in dt/2 (or dt for backward euler)
                this.xformMatrix[i][j] *= ts;
                let ni: number = this.coilNodes[i];
                let nj: number = this.coilNodes[j];
                if (i === j) {
                    CircuitElm.sim.stampConductance(this.nodes[ni], this.nodes[ni + 1], this.xformMatrix[i][i]);
                } else {
                    CircuitElm.sim.stampVCCurrentSource(this.nodes[ni], this.nodes[ni + 1], this.nodes[nj], this.nodes[nj + 1], this.xformMatrix[i][j]);
                }
            }
        }
        for (i = 0; i !== this.nodeCount; i++) {
            CircuitElm.sim.stampRightSide(this.nodes[i]);
        }
    }
    startIteration(): void {
        let i: number = 0;
        for (i = 0; i !== this.coilCount; i++) {
            let val: number = this.coilCurrents[i];
            if (this.isTrapezoidal()) {
                let j: number = 0;
                for (j = 0; j !== this.coilCount; j++) {
                    let n: number = this.coilNodes[j];
                    let voltdiff: number = this.volts[n] - this.volts[n + 1];
                    val += voltdiff * this.xformMatrix[i][j];
                }
            }
            this.coilCurSourceValues[i] = val;
        }
    }
    doStep(): void {
        let i: number = 0;
        for (i = 0; i !== this.coilCount; i++) {
            let n: number = this.coilNodes[i];
            CircuitElm.sim.stampCurrentSource(this.nodes[n], this.nodes[n + 1], this.coilCurSourceValues[i]);
        }
    }
    calculateCurrent(): void {
        let i: number = 0;
        for (i = 0; i !== this.nodeCount; i++) {
            this.nodeCurrents[i] = 0;
        }
        for (i = 0; i !== this.coilCount; i++) {
            let val: number = this.coilCurSourceValues[i];
            if (this.xformMatrix != null) {
                let j: number = 0;
                for (j = 0; j !== this.coilCount; j++) {
                    let n: number = this.coilNodes[j];
                    let voltdiff: number = this.volts[n] - this.volts[n + 1];
                    val += voltdiff * this.xformMatrix[i][j];
                }
            }
            this.coilCurrents[i] = val;
            let ni: number = this.coilNodes[i];
            this.nodeCurrents[ni] += val;
            this.nodeCurrents[ni + 1] -= val;
        }
    }
    getCurrentIntoNode(n: number): number {
        return -this.nodeCurrents[n];
    }
    getInfo(arr: string[]): void {
        arr[0] = "transformer (custom)";
        arr[1] = "L = " + CircuitElm.getUnitText$2(this.inductance, "H");
        let i: number = 0;
        for (i = 0; i !== this.coilCount; i++) {
            if (2 + i * 2 >= arr.length) {
                break;
            }
            let ni: number = this.coilNodes[i];
            arr[2 + i * 2] = "Vd" + (i + 1) + " = " + CircuitElm.getVoltageText(this.volts[ni] - this.volts[ni + 1]);
            arr[3 + i * 2] = "I" + (i + 1) + " = " + CircuitElm.getCurrentText(this.coilCurrents[i]);
        }
    }
    getConnection(n1: number, n2: number): boolean {
        let i: number = 0;
        for (i = 0; i !== this.coilCount; i++) {
            if (this.comparePair(n1, n2, this.coilNodes[i], this.coilNodes[i] + 1)) {
                return true;
            }
        }
        return false;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Base Inductance (H)", this.inductance, .01, 5);
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo(EditInfo.makeLink("customtransformer.html", "Description"), 0, -1, -1);
            ei.text = this.description;
            ei.disallowSliders();
            return ei;
        }
        if (n === 2) {
            return new EditInfo("Coupling Coefficient", this.couplingCoef, 0, 1).setDimensionless();
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Trapezoidal Approximation", this.isTrapezoidal());
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.inductance = ei.value;
            this.parseDescription$0();
        }
        if (n === 1) {
            let s: string = ei.textf.getText();
            if (s !== this.description) {
                if (!this.parseDescription$1(s)) {
                    this.parseDescription$1(this.description);
                    Window.alert("Parse error in description");
                } else {
                    this.description = s;
                }
                this.setPoints();
            }
        }
        if (n === 2 && ei.value > 0 && ei.value < 1) {
            this.couplingCoef = ei.value;
            this.parseDescription$0();
        }
        if (n === 3) {
            if (ei.checkbox.getState()) {
                this.flags &= ~Inductor.FLAG_BACK_EULER;
            } else {
                this.flags |= Inductor.FLAG_BACK_EULER;
            }
            this.parseDescription$0();
        }
    }
}
Object.assign(CustomTransformerElm.prototype, { "coilCurrents": null, "coilInductances": null, "coilCurCounts": null, "coilCurSourceValues": null, "coilPolarities": null, "nodeCurrents": null, "nodeCurCounts": null, "coilNodes": null, "coilCount": 0, "nodeCount": 0, "primaryCoils": 0, "nodePoints": null, "nodeTaps": null, "ptCore": null, "description": null, "inductance": 0, "couplingCoef": 0, "needDots": false, "dots": null, "width": 0, "xformMatrix": null });
