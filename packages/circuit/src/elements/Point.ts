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

// Changed 2026-10-31: converted from Point.java to TypeScript.
/* eslint-disable */

export class Point {
    declare x: number;
    declare y: number;
    init$2(i: number, j: number): this {
        this.x = i;
        this.y = j;
        return this;
    }
    init$1(p: Point): this {
        this.x = p.x;
        this.y = p.y;
        return this;
    }
    init$0(): this {
        this.x = 0;
        this.y = 0;
        return this;
    }
    setLocation(p: Point): void {
        this.x = p.x;
        this.y = p.y;
    }
    toString(): string {
        return "Point(" + this.x + "," + this.y + ")";
    }
    equals(other: any): boolean {
        let result: boolean = false;
        if (other instanceof Point) {
            let that: Point = (other as any as Point);
            result = (this.x === that.x && this.y === that.y);
        }
        return result;
    }
    hashCode(): number {
        return (41 * (41 + this.x) + this.y);
    }
    constructor() {}
}
Object.assign(Point.prototype, { "x": 0, "y": 0 });
