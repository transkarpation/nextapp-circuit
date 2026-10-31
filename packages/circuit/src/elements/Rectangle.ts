//	  Extracted from file
//    Copyright 1995-2006 Sun Microsystems, Inc.  All Rights Reserved
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 2 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
// Via http://grepcode.com/file_/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/awt/Rectangle.java/?v=source

// Changed 2026-10-31: converted from Rectangle.java to TypeScript.
/* eslint-disable */
import { Point } from '../core/internal';

export class Rectangle {
    declare x: number;
    declare y: number;
    declare width: number;
    declare height: number;
    init$0(): this {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        return this;
    }
    init$4(x: number, y: number, width: number, height: number): this {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }
    init$Point(pt: Point): this {
        this.x = pt.x;
        this.y = pt.y;
        this.width = 0;
        this.height = 0;
        return this;
    }
    init$Rectangle(r: Rectangle): this {
        Rectangle.prototype.init$4.call(this, r.x, r.y, r.width, r.height);
        return this;
    }
    setBounds(x: number, y: number, width: number, height: number): void {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    translate(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }
    contains(X: number, Y: number): boolean {
        let w: number = this.width;
        let h: number = this.height;
        if ((w | h) < 0) {
            // At least one of the dimensions is negative...
            return false;
        }
        // Note: if either dimension is zero, tests below must return false...
        let x: number = this.x;
        let y: number = this.y;
        if (X < x || Y < y) {
            return false;
        }
        w += x;
        h += y;
        //    overflow || intersect
        return ((w < x || w > X) && (h < y || h > Y));
    }
    /*
    public void move(int x, int y) {
        this.x = x;
        this.y = y;
    }
    */
    intersects(r: Rectangle): boolean {
        let tw: number = this.width;
        let th: number = this.height;
        let rw: number = r.width;
        let rh: number = r.height;
        if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
            return false;
        }
        let tx: number = this.x;
        let ty: number = this.y;
        let rx: number = r.x;
        let ry: number = r.y;
        rw += rx;
        rh += ry;
        tw += tx;
        th += ty;
        //      overflow || intersect
        return ((rw < rx || rw > tx) && (rh < ry || rh > ty) && (tw < tx || tw > rx) && (th < ty || th > ry));
    }
    union(r: Rectangle): Rectangle {
        let tx2: number = this.width;
        let ty2: number = this.height;
        if ((tx2 | ty2) < 0) {
            // This rectangle has negative dimensions...
            // If r has non-negative dimensions then it is the answer.
            // If r is non-existant (has a negative dimension), then both
            // are non-existant and we can return any non-existant rectangle
            // as an answer.  Thus, returning r meets that criterion.
            // Either way, r is our answer.
            return new Rectangle().init$Rectangle(r);
        }
        let rx2: number = r.width;
        let ry2: number = r.height;
        if ((rx2 | ry2) < 0) {
            return new Rectangle().init$Rectangle(this);
        }
        let tx1: number = this.x;
        let ty1: number = this.y;
        tx2 += tx1;
        ty2 += ty1;
        let rx1: number = r.x;
        let ry1: number = r.y;
        rx2 += rx1;
        ry2 += ry1;
        if (tx1 > rx1) {
            tx1 = rx1;
        }
        if (ty1 > ry1) {
            ty1 = ry1;
        }
        if (tx2 < rx2) {
            tx2 = rx2;
        }
        if (ty2 < ry2) {
            ty2 = ry2;
        }
        tx2 -= tx1;
        ty2 -= ty1;
        // tx2,ty2 will never underflow since both original rectangles
        // were already proven to be non-empty
        // they might overflow, though...
        if (tx2 > 2147483647) {
            tx2 = 2147483647;
        }
        if (ty2 > 2147483647) {
            ty2 = 2147483647;
        }
        return new Rectangle().init$4(tx1, ty1, (tx2 | 0), (ty2 | 0));
    }
    toString(): string {
        return "Rect(" + this.x + "," + this.y + "," + this.width + "," + this.height + ")";
    }
    equals(obj: any): boolean {
        if (obj instanceof Rectangle) {
            let r: Rectangle = (obj as any as Rectangle);
            return ((this.x === r.x) && (this.y === r.y) && (this.width === r.width) && (this.height === r.height));
        }
        return (this === obj);
    }
    constructor() {}
}
Object.assign(Rectangle.prototype, { "x": 0, "y": 0, "width": 0, "height": 0 });
