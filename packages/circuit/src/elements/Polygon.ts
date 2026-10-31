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
// via http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/awt/Polygon.java

// Changed 2026-10-31: converted from Polygon.java to TypeScript.
/* eslint-disable */
import { highestOneBit, newArray } from '../core/internal';

export class Polygon {
    //	ArrayList<Point> poly;
    static MIN_LENGTH: number = 4;
    declare npoints: number;
    declare xpoints: number[];
    declare ypoints: number[];
    init$0(): this {
        //		poly = new ArrayList<Point>();
        this.xpoints = newArray(0, Polygon.MIN_LENGTH);
        this.ypoints = newArray(0, Polygon.MIN_LENGTH);
        return this;
    }
    //	public void addPoint(int x, int y){
    //		poly.add(new Point(x,y));
    //	}
    addPoint(x: number, y: number): void {
        if (this.npoints >= this.xpoints.length || this.npoints >= this.ypoints.length) {
            let newLength: number = this.npoints * 2;
            // Make sure that newLength will be greater than MIN_LENGTH and
            // aligned to the power of 2
            if (newLength < Polygon.MIN_LENGTH) {
                newLength = Polygon.MIN_LENGTH;
            } else if ((newLength & (newLength - 1)) !== 0) {
                newLength = highestOneBit(newLength);
            }
            this.xpoints = this.expand(this.xpoints, newLength);
            this.ypoints = this.expand(this.ypoints, newLength);
        }
        this.xpoints[this.npoints] = x;
        this.ypoints[this.npoints] = y;
        this.npoints++;
        //        if (bounds != null) {
        //            updateBounds(x, y);
        //        }
    }
    expand(in_: number[], newlen: number): number[] {
        let out: number[] = newArray(0, newlen);
        for (let i: number = 0; i < in_.length; i++) {
            out[i] = in_[i];
        }
        return out;
    }
    constructor() {}
}
Object.assign(Polygon.prototype, { "npoints": 0, "xpoints": null, "ypoints": null });
