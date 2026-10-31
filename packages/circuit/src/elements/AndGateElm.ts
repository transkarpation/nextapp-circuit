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

// Changed 2026-10-31: converted from AndGateElm.java to TypeScript.
/* eslint-disable */
import { GateElm, Point, StringTokenizer, boolOp } from '../core/internal';

export class AndGateElm extends GateElm {
    init$2(xx: number, yy: number): this {
        GateElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        GateElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getGateText(): string {
        return "&";
    }
    setPoints(): void {
        super.setPoints();
        if (GateElm.useEuroGates()) {
            this.createEuroGatePolygon();
        } else {
            // 0=topleft, 1-10 = top curve, 11 = right, 12-21=bottom curve,
            // 22 = bottom left
            let triPoints: Point[] = this.newPointArray(23);
            this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[22], 0, this.hs2);
            let i: number = 0;
            for (i = 0; i !== 10; i++) {
                let a: number = i * .1;
                let b: number = Math.sqrt(1 - a * a);
                this.interpPoint2(this.lead1, this.lead2, triPoints[i + 1], triPoints[21 - i], .5 + a / 2, b * this.hs2);
            }
            triPoints[11] = new Point().init$1(this.lead2);
            this.gatePoly = this.createPolygon$1(triPoints);
        }
        if (this.isInverting()) {
            this.pcircle = this.interpPoint$3(this.point1, this.point2, .5 + (this.ww + 4) / this.dn);
            this.lead2 = this.interpPoint$3(this.point1, this.point2, .5 + (this.ww + 8) / this.dn);
        }
    }
    getGateName(): string {
        return "AND gate";
    }
    calcFunction(): boolean {
        let i: number = 0;
        let f: boolean = true;
        for (i = 0; i !== this.inputCount; i++) {
            f = boolOp('&', f, this.getInput(i));
        }
        return f;
    }
    getDumpType(): number {
        return 150;
    }
    getShortcut(): number {
        return 50;
    }
}
