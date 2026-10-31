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

// Changed 2026-10-31: converted from ScopeElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Graphics, Rectangle, Scope, StringTokenizer, javaEquals } from '../core/internal';

export class ScopeElm extends CircuitElm {
    declare elmScope: Scope;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.noDiagonal = false;
        this.x2 = this.x + 128;
        this.y2 = this.y + 64;
        this.elmScope = new Scope().init$1(CircuitElm.sim);
        this.setPoints();
        return this;
    }
    setScopeElm(e: CircuitElm): void {
        this.elmScope.setElm(e);
        this.elmScope.resetGraph$0();
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.noDiagonal = false;
        let sStr: string = st.nextToken$0();
        let sst: StringTokenizer = new StringTokenizer().init$2(sStr, "_");
        this.elmScope = new Scope().init$1(CircuitElm.sim);
        this.elmScope.undump(sst);
        this.setPoints();
        this.elmScope.resetGraph$0();
        return this;
    }
    setScopeRect(): void {
        let i1: number = CircuitElm.sim.transformX(CircuitElm.min(this.x, this.x2));
        let i2: number = CircuitElm.sim.transformX(CircuitElm.max(this.x, this.x2));
        let j1: number = CircuitElm.sim.transformY(CircuitElm.min(this.y, this.y2));
        let j2: number = CircuitElm.sim.transformY(CircuitElm.max(this.y, this.y2));
        let r: Rectangle = new Rectangle().init$4(i1, j1, i2 - i1, j2 - j1);
        if (!javaEquals(r, this.elmScope.rect)) {
            this.elmScope.setRect(r);
        }
    }
    setPoints(): void {
        super.setPoints();
        this.setScopeRect();
    }
    setElmScope(s: Scope): void {
        this.elmScope = s;
    }
    stepScope(): void {
        this.elmScope.timeStep();
    }
    reset(): void {
        super.reset();
        this.elmScope.resetGraph$1(true);
    }
    clearElmScope(): void {
        this.elmScope = null;
    }
    canViewInScope(): boolean {
        return false;
    }
    getDumpType(): number {
        return 403;
    }
    dump(): string {
        let dumpStr: string = super.dump();
        let sStr: string = this.elmScope.dump().split(String.fromCharCode(32)).join(String.fromCharCode(95));
        sStr = sStr.replace(new RegExp("o_"), "");
        // remove unused prefix for embedded Scope
        return dumpStr + " " + sStr;
    }
    draw(g: Graphics): void {
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
        g.context.save();
        g.context.setTransform(1, 0, 0, 1, 0, 0);
        this.setScopeRect();
        this.elmScope.draw(g);
        g.context.restore();
        this.setBbox$3(this.point1, this.point2, 0);
        this.drawPosts(g);
    }
    getPostCount(): number {
        return 0;
    }
}
Object.assign(ScopeElm.prototype, { "elmScope": null });
