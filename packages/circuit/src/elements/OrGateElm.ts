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

// Changed 2026-10-31: converted from OrGateElm.java to TypeScript.
/* eslint-disable */
import { GateElm, Point, StringTokenizer, XorGateElm, boolOp, newArray } from '../core/internal';

export class OrGateElm extends GateElm {
    init$2(xx: number, yy: number): this {
        GateElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        GateElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getGateName(): string {
        return "OR gate";
    }
    setPoints(): void {
        super.setPoints();
        if (GateElm.useEuroGates()) {
            this.createEuroGatePolygon();
            this.linePoints = null;
        } else {
            // 0-15 = top curve, 16 = right, 17-32=bottom curve,
            // 33-37 = left curve
            let triPoints: Point[] = this.newPointArray(38);
            if (this instanceof XorGateElm) {
                this.linePoints = newArray(null, 5);
            }
            let i: number = 0;
            for (i = 0; i !== 16; i++) {
                let a: number = i / 16.;
                let b: number = 1 - a * a;
                this.interpPoint2(this.lead1, this.lead2, triPoints[i], triPoints[32 - i], .5 + a / 2, b * this.hs2);
            }
            let ww2: number = (this.ww === 0) ? this.dn * 2 : this.ww * 2;
            for (i = 0; i !== 5; i++) {
                let a: number = (i - 2) / 2.;
                let b: number = 4 * (1 - a * a) - 2;
                this.interpPoint$5(this.lead1, this.lead2, triPoints[33 + i], b / (ww2), a * this.hs2);
                if (this instanceof XorGateElm) {
                    this.linePoints[i] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, (b - 5) / (ww2), a * this.hs2);
                }
            }
            triPoints[16] = new Point().init$1(this.lead2);
            this.gatePoly = this.createPolygon$1(triPoints);
        }
        if (this.isInverting()) {
            this.pcircle = this.interpPoint$3(this.point1, this.point2, .5 + (this.ww + 4) / this.dn);
            this.lead2 = this.interpPoint$3(this.point1, this.point2, .5 + (this.ww + 8) / this.dn);
        }
    }
    getGateText(): string {
        return "\u22651";
    }
    calcFunction(): boolean {
        let i: number = 0;
        let f: boolean = false;
        for (i = 0; i !== this.inputCount; i++) {
            f = boolOp('|', f, this.getInput(i));
        }
        return f;
    }
    getDumpType(): number {
        return 152;
    }
    getShortcut(): number {
        return 51;
    }
}
