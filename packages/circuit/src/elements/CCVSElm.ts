/*    
    Copyright (C) Paul Falstad
    
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

// Changed 2026-10-31: converted from CCVSElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, EditInfo, ExprState, StringTokenizer, VCCSElm, Vector, VoltageElm, idiv, newArray, toChar, toInt } from '../core/internal';

export class CCVSElm extends VCCSElm {
    static FLAG_SPICE: number = 2;
    declare voltageSources: VoltageElm[];
    declare outputVS: number;
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        VCCSElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        //	    exprString = CustomLogicModel.unescape(st.nextToken());
        //	    inputCount = 2;
        //	    parseExpr();
        this.setupPins();
        return this;
    }
    init$2(xx: number, yy: number): this {
        VCCSElm.prototype.init$2.call(this, xx, yy);
        this.exprString = "2*a";
        this.parseExpr();
        //	    setupPins();
        return this;
    }
    declare inputPairCount: number;
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = this.inputCount > 2 ? this.inputCount : 2;
        this.inputPairCount = idiv(this.inputCount, 2);
        this.pins = newArray(null, this.inputCount + 2);
        let i: number = 0;
        for (i = 0; i !== this.inputPairCount; i++) {
            this.pins[i * 2] = new ChipElm_Pin().init$3(this, i * 2, ChipElm.SIDE_W, String.fromCharCode(toChar((65 + i))) + "+");
            this.pins[i * 2 + 1] = new ChipElm_Pin().init$3(this, i * 2 + 1, ChipElm.SIDE_W, String.fromCharCode(toChar((65 + i))) + "-");
            this.pins[i * 2 + 1].output = true;
        }
        this.pins[i * 2] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "V+");
        this.pins[i * 2].output = true;
        this.pins[i * 2 + 1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "V-");
        this.exprState = new ExprState().init$1(this.inputPairCount);
        this.lastCurrents = newArray(0, this.inputPairCount);
        this.allocNodes();
    }
    getChipName(): string {
        return "CCVS";
    }
    stamp(): void {
        let i: number = 0;
        if (this.isSpiceStyle()) {
            for (i = 0; i !== this.inputCount; i += 2) {
                this.pins[i + 1].voltSource = this.voltageSources[idiv(i, 2)].getVoltageSource();
            }
        } else {
            // voltage source (0V) between C+ and C- so we can measure current
            for (i = 0; i !== this.inputCount; i += 2) {
                let vn1: number = this.pins[i + 1].voltSource;
                CircuitElm.sim.stampVoltageSource(this.nodes[i], this.nodes[i + 1], vn1, 0);
            }
        }
        // voltage source for outputs
        let vn2: number = this.pins[this.inputCount].voltSource;
        this.outputVS = vn2;
        CircuitElm.sim.stampNonLinear(vn2 + CircuitElm.sim.nodeList.size());
        CircuitElm.sim.stampVoltageSource(this.nodes[this.inputCount + 1], this.nodes[this.inputCount], vn2);
    }
    declare lastCurrents: number[];
    doStep(): void {
        // converged yet?
        let convergeLimit: number = this.getConvergeLimit() * .1;
        let i: number = 0;
        if (this.isSpiceStyle()) {
            for (i = 0; i !== this.inputPairCount; i++) {
                this.pins[i * 2 + 1].current = this.voltageSources[i].getCurrent();
            }
        }
        for (i = 0; i !== this.inputPairCount; i++) {
            let cur: number = this.pins[i * 2 + 1].current;
            if (Math.abs(cur - this.lastCurrents[i]) > convergeLimit) {
                CircuitElm.sim.converged = false;
            }
        }
        let vno: number = this.outputVS + CircuitElm.sim.nodeList.size();
        if (this.expr != null) {
            // calculate output
            for (i = 0; i !== this.inputPairCount; i++) {
                this.setCurrentExprValue(i, this.pins[i * 2 + 1].current);
            }
            this.exprState.t = CircuitElm.sim.t;
            let v0: number = this.expr.eval(this.exprState);
            let rs: number = v0;
            for (i = 0; i !== this.inputPairCount; i++) {
                let cur: number = this.pins[i * 2 + 1].current;
                let dv: number = cur - this.lastCurrents[i];
                let vni: number = this.pins[i * 2 + 1].voltSource + CircuitElm.sim.nodeList.size();
                if (Math.abs(dv) < 1e-6) {
                    dv = 1e-6;
                }
                this.setCurrentExprValue(i, cur);
                let v: number = this.expr.eval(this.exprState);
                this.setCurrentExprValue(i, cur - dv);
                let v2: number = this.expr.eval(this.exprState);
                let dx: number = (v - v2) / dv;
                if (Math.abs(dx) < 1e-6) {
                    dx = this.sign$2(dx, 1e-6);
                }
                CircuitElm.sim.stampMatrix(vno, vni, -dx);
                // adjust right side
                rs -= dx * cur;
                //if (sim.subIterations > 1)
                //sim.console("ccedx " + i + " " + cur + " " + dx + " " + rs + " " + sim.subIterations + " " + sim.t);
                this.setCurrentExprValue(i, cur);
            }
            CircuitElm.sim.stampRightSide(vno, rs);
        }
        for (i = 0; i !== this.inputPairCount; i++) {
            this.lastCurrents[i] = this.pins[i * 2 + 1].current;
        }
    }
    setCurrentExprValue(n: number, cur: number): void {
        // set i to current for backward compatibility
        if (n === 0 && this.inputPairCount < 9) {
            this.exprState.values[8] = cur;
        }
        this.exprState.values[n] = cur;
    }
    getPostCount(): number {
        return this.inputCount + 2;
    }
    getVoltageSourceCount(): number {
        return this.isSpiceStyle() ? 1 : 1 + this.inputPairCount;
    }
    getDumpType(): number {
        return 214;
    }
    getConnection(n1: number, n2: number): boolean {
        return (idiv(n1, 2) === idiv(n2, 2));
    }
    hasCurrentOutput(): boolean {
        return false;
    }
    isSpiceStyle(): boolean {
        return (this.flags & CCVSElm.FLAG_SPICE) !== 0;
    }
    setCurrent(vn: number, c: number): void {
        let i: number = 0;
        if (!this.isSpiceStyle()) {
            for (i = 0; i !== this.inputCount; i += 2) {
                if (this.pins[i + 1].voltSource === vn) {
                    this.pins[i].current = -c;
                    this.pins[i + 1].current = c;
                    return;
                }
            }
        }
        if (this.pins[i].voltSource === vn) {
            this.pins[i].current = c;
            this.pins[i + 1].current = -c;
        }
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 1) {
            // make sure number of inputs is even
            if (ei.value < 0 || ei.value > 8 || (ei.value % 2) === 1) {
                return;
            }
            this.inputCount = toInt(ei.value);
            this.setupPins();
            this.allocNodes();
            this.setPoints();
        } else {
            super.setEditValue(n, ei);
        }
    }
    setParentList(elmList: Vector<CircuitElm>): void {
        let i: number = 0, j: number = 0;
        if (!this.isSpiceStyle()) {
            return;
        }
        // look for voltage sources across our inputs and use them rather than
        // creating our own.  this is useful for converting spice subcircuits
        this.voltageSources = newArray(null, this.inputPairCount);
        for (i = 0; i !== this.inputCount; i += 2) {
            for (j = 0; j !== elmList.size(); j++) {
                let ce: CircuitElm = elmList.get(j);
                if (!(ce instanceof VoltageElm)) {
                    continue;
                }
                if (ce.getNode(1) === this.nodes[i] && ce.getNode(0) === this.nodes[i + 1]) {
                    this.voltageSources[idiv(i, 2)] = (ce as any as VoltageElm);
                }
            }
        }
    }
    setVoltageSource(j: number, vs: number): void {
        if (this.isSpiceStyle()) {
            this.pins[this.inputCount].voltSource = vs;
        } else {
            super.setVoltageSource(j, vs);
        }
    }
}
Object.assign(CCVSElm.prototype, { "voltageSources": null, "outputVS": 0, "inputPairCount": 0, "lastCurrents": null });
