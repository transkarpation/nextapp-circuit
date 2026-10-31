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

// Changed 2026-10-31: converted from BoxElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Color, EditInfo, GraphicElm, Graphics, StringTokenizer } from '../core/internal';

export class BoxElm extends GraphicElm {
    init$2(xx: number, yy: number): this {
        GraphicElm.prototype.init$2.call(this, xx, yy);
        this.x2 = xx;
        this.y2 = yy;
        this.setBbox$4(this.x, this.y, this.x2, this.y2);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        GraphicElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.x2 = xb;
        this.y2 = yb;
        this.setBbox$4(this.x, this.y, this.x2, this.y2);
        return this;
    }
    dump(): string {
        return super.dump();
    }
    getDumpType(): number {
        return 98;
    }
    drag(xx: number, yy: number): void {
        this.x2 = xx;
        this.y2 = yy;
    }
    creationFailed(): boolean {
        return Math.abs(this.x2 - this.x) < 32 || Math.abs(this.y2 - this.y) < 32;
    }
    draw(g: Graphics): void {
        //g.setColor(needsHighlight() ? selectColor : lightGrayColor);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.GRAY);
        this.setBbox$4(this.x, this.y, this.x2, this.y2);
        g.setLineDash(16, 6);
        if (this.x < this.x2 && this.y < this.y2) {
            g.drawRect(this.x, this.y, this.x2 - this.x, this.y2 - this.y);
        } else if (this.x > this.x2 && this.y < this.y2) {
            g.drawRect(this.x2, this.y, this.x - this.x2, this.y2 - this.y);
        } else if (this.x < this.x2 && this.y > this.y2) {
            g.drawRect(this.x, this.y2, this.x2 - this.x, this.y - this.y2);
        } else {
            g.drawRect(this.x2, this.y2, this.x - this.x2, this.y - this.y2);
        }
        g.setLineDash(0, 0);
    }
    getEditInfo(n: number): EditInfo {
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
    }
    getInfo(arr: string[]): void {
    }
    getShortcut(): number {
        return 0;
    }
}
