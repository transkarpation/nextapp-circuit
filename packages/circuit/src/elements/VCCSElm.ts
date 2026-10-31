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

// Changed 2026-10-31: converted from VCCSElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, CustomLogicModel, EditInfo, Expr, ExprParser, ExprState, Graphics, StringTokenizer, newArray, parseJInt, toChar, toInt } from '../core/internal';

export class VCCSElm extends ChipElm {
    declare gain: number;
    declare inputCount: number;
    declare expr: Expr;
    declare exprState: ExprState;
    declare exprString: string;
    declare broken: boolean;
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.inputCount = parseJInt(st.nextToken$0());
        this.exprString = CustomLogicModel.unescape(st.nextToken$0());
        this.parseExpr();
        this.setupPins();
        return this;
    }
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.inputCount = 2;
        this.exprString = ".1*(a-b)";
        this.parseExpr();
        this.setupPins();
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.inputCount + " " + CustomLogicModel.escape(this.exprString);
    }
    declare lastVolts: number[];
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = this.inputCount > 2 ? this.inputCount : 2;
        this.pins = newArray(null, this.inputCount + 2);
        let i: number = 0;
        for (i = 0; i !== this.inputCount; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_W, String.fromCharCode(toChar((65 + i))));
        }
        this.pins[this.inputCount] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "C+");
        this.pins[this.inputCount + 1] = new ChipElm_Pin().init$3(this, 1, ChipElm.SIDE_E, "C-");
        this.lastVolts = newArray(0, this.inputCount);
        this.exprState = new ExprState().init$1(this.inputCount);
        this.allocNodes();
    }
    getChipName(): string {
        return "VCCS~";
    }
    // ~ is for localization
    nonLinear(): boolean {
        return true;
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[this.inputCount]);
        CircuitElm.sim.stampNonLinear(this.nodes[this.inputCount + 1]);
    }
    sign$2(a: number, b: number): number {
        return a > 0 ? b : -b;
    }
    getConvergeLimit(): number {
        // get maximum change in voltage per step when testing for convergence.  be more lenient over time
        if (CircuitElm.sim.subIterations < 10) {
            return .001;
        }
        if (CircuitElm.sim.subIterations < 200) {
            return .01;
        }
        return .1;
    }
    hasCurrentOutput(): boolean {
        return true;
    }
    getOutputNode(n: number): number {
        return this.nodes[n + this.inputCount];
    }
    doStep(): void {
        let i: number = 0;
        // no current path?  give up
        if (this.broken) {
            this.pins[this.inputCount].current = 0;
            this.pins[this.inputCount + 1].current = 0;
            // avoid singular matrix errors
            CircuitElm.sim.stampResistor(this.nodes[this.inputCount], this.nodes[this.inputCount + 1], 1e8);
            return;
        }
        // converged yet?
        let convergeLimit: number = this.getConvergeLimit();
        for (i = 0; i !== this.inputCount; i++) {
            if (Math.abs(this.volts[i] - this.lastVolts[i]) > convergeLimit) {
                CircuitElm.sim.converged = false;
                //        	    sim.console("vcvs " + nodes + " " + i + " " + volts[i] + " " + lastVolts[i] + " " + sim.subIterations);
            }
            //        	if (Double.isNaN(volts[i]))
            //        	    volts[i] = 0;
        }
        if (this.expr != null) {
            // calculate output
            for (i = 0; i !== this.inputCount; i++) {
                this.exprState.values[i] = this.volts[i];
            }
            this.exprState.t = CircuitElm.sim.t;
            let v0: number = -this.expr.eval(this.exprState);
            //        	if (Math.abs(volts[inputCount]-v0) > Math.abs(v0)*.01 && sim.subIterations < 100)
            //        	    sim.converged = false;
            let rs: number = v0;
            // calculate and stamp output derivatives
            for (i = 0; i !== this.inputCount; i++) {
                let dv: number = this.volts[i] - this.lastVolts[i];
                if (Math.abs(dv) < 1e-6) {
                    dv = 1e-6;
                }
                this.exprState.values[i] = this.volts[i];
                let v: number = -this.expr.eval(this.exprState);
                this.exprState.values[i] = this.volts[i] - dv;
                let v2: number = -this.expr.eval(this.exprState);
                let dx: number = (v - v2) / dv;
                if (Math.abs(dx) < 1e-6) {
                    dx = this.sign$2(dx, 1e-6);
                }
                CircuitElm.sim.stampVCCurrentSource(this.nodes[this.inputCount], this.nodes[this.inputCount + 1], this.nodes[i], 0, dx);
                //if (sim.subIterations > 1)
                //sim.console("ccedx " + i + " " + dx + " " + sim.subIterations + " " + sim.t);
                // adjust right side
                rs -= dx * this.volts[i];
                this.exprState.values[i] = this.volts[i];
            }
            //        	sim.console("ccers " + rs);
            CircuitElm.sim.stampCurrentSource(this.nodes[this.inputCount], this.nodes[this.inputCount + 1], rs);
            this.pins[this.inputCount].current = -v0;
            this.pins[this.inputCount + 1].current = v0;
        }
        for (i = 0; i !== this.inputCount; i++) {
            this.lastVolts[i] = this.volts[i];
        }
    }
    draw(g: Graphics): void {
        this.drawChip(g);
    }
    getPostCount(): number {
        return this.inputCount + 2;
    }
    getVoltageSourceCount(): number {
        return 0;
    }
    getDumpType(): number {
        return 213;
    }
    getConnection(n1: number, n2: number): boolean {
        return this.comparePair(this.inputCount, this.inputCount + 1, n1, n2);
    }
    hasGroundConnection(n1: number): boolean {
        return false;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo(EditInfo.makeLink("customfunction.html", "Output Function"), 0, -1, -1);
            ei.text = this.exprString;
            ei.disallowSliders();
            return ei;
        }
        if (n === 1) {
            return new EditInfo("# of Inputs", this.inputCount, 1, 8).setDimensionless();
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.exprString = ei.textf.getText();
            this.parseExpr();
            return;
        }
        if (n === 1) {
            if (ei.value < 0 || ei.value > 8) {
                return;
            }
            this.inputCount = toInt(ei.value);
            this.setupPins();
            this.allocNodes();
            this.setPoints();
        }
    }
    setExpr(expr: string): void {
        this.exprString = expr;
        this.parseExpr();
    }
    parseExpr(): void {
        let parser: ExprParser = new ExprParser().init$1(this.exprString);
        this.expr = parser.parseExpression();
    }
    getInfo(arr: string[]): void {
        super.getInfo(arr);
        let i: number = 0;
        for (i = 0; arr[i] != null; i++) {
null
        }
        arr[i] = "I = " + CircuitElm.getCurrentText(this.pins[this.inputCount].current);
    }
}
Object.assign(VCCSElm.prototype, { "gain": 0, "inputCount": 0, "expr": null, "exprState": null, "exprString": null, "broken": false, "lastVolts": null });
