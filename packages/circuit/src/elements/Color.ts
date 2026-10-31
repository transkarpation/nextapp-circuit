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

// Changed 2026-10-31: converted from Color.java to TypeScript.
/* eslint-disable */
import { parseJInt, toInt } from '../core/internal';

export class Color {
    static white: Color = new Color().init$int_int_int(255, 255, 255);
    static lightGray: Color = new Color().init$int_int_int(192, 192, 192);
    static gray: Color = new Color().init$int_int_int(128, 128, 128);
    static GRAY: Color = new Color().init$int_int_int(128, 128, 128);
    static dark_gray: Color = new Color().init$int_int_int(64, 64, 64);
    static darkGray: Color = new Color().init$int_int_int(64, 64, 64);
    static black: Color = new Color().init$int_int_int(0, 0, 0);
    static red: Color = new Color().init$int_int_int(255, 0, 0);
    static pink: Color = new Color().init$int_int_int(255, 175, 175);
    static orange: Color = new Color().init$int_int_int(255, 200, 0);
    static yellow: Color = new Color().init$int_int_int(255, 255, 0);
    static green: Color = new Color().init$int_int_int(0, 255, 0);
    static magenta: Color = new Color().init$int_int_int(255, 0, 255);
    static cyan: Color = new Color().init$int_int_int(0, 255, 255);
    static blue: Color = new Color().init$int_int_int(0, 0, 255);
    static NONE: Color = new Color().init$1("");
    declare r: number;
    declare g: number;
    declare b: number;
    // only for special cases, like no color, or maybe named colors
    declare colorText: string;
    init$1(colorText: string): this {
        this.colorText = null;
        this.colorText = colorText;
        if (colorText.startsWith("#") && colorText.length === 7) {
            let rs: string = colorText.substring(1, 3);
            let gs: string = colorText.substring(3, 5);
            let bs: string = colorText.substring(5, 7);
            this.r = parseJInt(rs, 16);
            this.g = parseJInt(gs, 16);
            this.b = parseJInt(bs, 16);
        }
        return this;
    }
    // create mixture of c1 and c2
    init$Color_Color_dbl(c1: Color, c2: Color, mix: number): this {
        this.colorText = null;
        let m0: number = 1 - mix;
        this.r = toInt((c1.r * m0 + c2.r * mix));
        this.g = toInt((c1.g * m0 + c2.g * mix));
        this.b = toInt((c1.b * m0 + c2.b * mix));
        return this;
    }
    init$int_int_int(r: number, g: number, b: number): this {
        this.colorText = null;
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }
    getRed(): number {
        return this.r;
    }
    getGreen(): number {
        return this.g;
    }
    getBlue(): number {
        return this.b;
    }
    getHexValue(): string {
        if (this.colorText != null) {
            return this.colorText;
        }
        return "#" + this.pad((this.r).toString(16)) + this.pad((this.g).toString(16)) + this.pad((this.b).toString(16));
    }
    pad(in_: string): string {
        if (in_.length === 0) {
            return "00";
        }
        if (in_.length === 1) {
            return "0" + in_;
        }
        return in_;
    }
    toString(): string {
        if (this.colorText != null) {
            return this.colorText;
        }
        return "red=" + this.r + ", green=" + this.g + ", blue=" + this.b;
    }
    constructor() {}
}
Object.assign(Color.prototype, { "r": 0, "g": 0, "b": 0, "colorText": null });
