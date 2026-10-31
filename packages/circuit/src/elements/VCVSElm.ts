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

// Changed 2026-10-31: converted from VCVSElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, ExprState, StringTokenizer, VCCSElm, newArray, toChar } from '../core/internal';

export class VCVSElm extends VCCSElm {
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        VCCSElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        //	    inputCount = Integer.parseInt(st.nextToken());
        //	    exprString = CustomLogicModel.unescape(st.nextToken());
        //	    parseExpr();
        //	    setupPins();
        return this;
    }
    init$2(xx: number, yy: number): this {
        VCCSElm.prototype.init$2.call(this, xx, yy);
        this.exprString = "2*(a-b)";
        //	    inputCount = 2;
        //	    exprString = "a+b";
        //	    parseExpr();
        //	    setupPins();
        return this;
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = this.inputCount > 2 ? this.inputCount : 2;
        this.pins = newArray(null, this.inputCount + 2);
        let i: number = 0;
        for (i = 0; i !== this.inputCount; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_W, String.fromCharCode(toChar((65 + i))));
        }
        this.pins[this.inputCount] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "V+");
        this.pins[this.inputCount].output = true;
        this.pins[this.inputCount + 1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "V-");
        this.lastVolts = newArray(0, this.inputCount);
        this.exprState = new ExprState().init$1(this.inputCount);
        this.allocNodes();
    }
    getChipName(): string {
        return "VCVS";
    }
    stamp(): void {
        let vn: number = this.pins[this.inputCount].voltSource + CircuitElm.sim.nodeList.size();
        CircuitElm.sim.stampNonLinear(vn);
        CircuitElm.sim.stampVoltageSource(this.nodes[this.inputCount + 1], this.nodes[this.inputCount], this.pins[this.inputCount].voltSource);
    }
    doStep(): void {
        let i: number = 0;
        // converged yet?
        let convergeLimit: number = this.getConvergeLimit();
        for (i = 0; i !== this.inputCount; i++) {
            if (Math.abs(this.volts[i] - this.lastVolts[i]) > convergeLimit) {
                CircuitElm.sim.converged = false;
            }
            //        	if (Double.isNaN(volts[i]))
            //        	    volts[i] = 0;
        }
        let vn: number = this.pins[this.inputCount].voltSource + CircuitElm.sim.nodeList.size();
        if (this.expr != null) {
            // calculate output
            for (i = 0; i !== this.inputCount; i++) {
                this.exprState.values[i] = this.volts[i];
            }
            this.exprState.t = CircuitElm.sim.t;
            let v0: number = this.expr.eval(this.exprState);
            if (Math.abs(this.volts[this.inputCount] - this.volts[this.inputCount + 1] - v0) > Math.abs(v0) * .01 && CircuitElm.sim.subIterations < 100) {
                CircuitElm.sim.converged = false;
            }
            let rs: number = v0;
            // calculate and stamp output derivatives
            for (i = 0; i !== this.inputCount; i++) {
                let dv: number = this.volts[i] - this.lastVolts[i];
                if (Math.abs(dv) < 1e-6) {
                    dv = 1e-6;
                }
                this.exprState.values[i] = this.volts[i];
                let v: number = this.expr.eval(this.exprState);
                this.exprState.values[i] = this.volts[i] - dv;
                let v2: number = this.expr.eval(this.exprState);
                let dx: number = (v - v2) / dv;
                if (Math.abs(dx) < 1e-6) {
                    dx = this.sign$2(dx, 1e-6);
                }
                //        	    if (sim.subIterations > 1)
                //        		sim.console("ccedx " + i + " " + dx + " v " + v + " v2 " + v2 + " dv " + dv + " lv " + lastVolts[i] + " " + volts[i] + " " + sim.subIterations + " " + sim.t);
                CircuitElm.sim.stampMatrix(vn, this.nodes[i], -dx);
                // adjust right side
                rs -= dx * this.volts[i];
                this.exprState.values[i] = this.volts[i];
            }
            CircuitElm.sim.stampRightSide(vn, rs);
        }
        for (i = 0; i !== this.inputCount; i++) {
            this.lastVolts[i] = this.volts[i];
        }
    }
    getPostCount(): number {
        return this.inputCount + 2;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getDumpType(): number {
        return 212;
    }
    hasCurrentOutput(): boolean {
        return false;
    }
    setCurrent(vn: number, c: number): void {
        if (this.pins[this.inputCount].voltSource === vn) {
            this.pins[this.inputCount].current = c;
            this.pins[this.inputCount + 1].current = -c;
        }
    }
}
