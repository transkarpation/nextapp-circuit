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

// Changed 2026-10-31: ported from Graphics.java to TypeScript by hand.
// Port of Graphics.java.  Java int division in fillOval is preserved.
import { Color, Context2d, Font, Polygon } from './internal';

export class Graphics {
    context: Context2d;
    currentFontSize = 0;
    currentFont: Font | null = null;
    lastColor: Color | null = null;
    static isFullScreen = false;

    constructor(context: Context2d) { this.context = context; }

    setColor(color: Color | string | null): void {
        if (typeof color === 'string') {
            this.context.setStrokeStyle(color);
            this.context.setFillStyle(color);
            this.lastColor = null;
            return;
        }
        if (color != null) {
            const s = color.getHexValue();
            this.context.setStrokeStyle(s);
            this.context.setFillStyle(s);
        }
        this.lastColor = color;
    }
    clipRect(x: number, y: number, w: number, h: number): void {
        this.context.beginPath();
        this.context.rect(x, y, w, h);
        this.context.clip();
    }
    restore(): void { this.context.restore(); }
    fillRect(x: number, y: number, w: number, h: number): void { this.context.fillRect(x, y, w, h); }
    drawRect(x: number, y: number, w: number, h: number): void { this.context.strokeRect(x, y, w, h); }
    fillOval(x: number, y: number, width: number, _height: number): void {
        const half = (width / 2) | 0;
        this.context.beginPath();
        this.context.arc(x + half, y + half, half, 0, 2.0 * 3.14159);
        this.context.closePath();
        this.context.fill();
    }
    drawString(s: string, x: number, y: number): void { this.context.fillText(s, x, y); }
    measureWidth(s: string): number { return this.context.measureText(s).getWidth(); }
    setLineWidth(w: number): void { this.context.setLineWidth(w); }
    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
    }
    drawPolyline(xs: number[], ys: number[], n: number): void {
        this.context.beginPath();
        for (let i = 0; i < n; i++) {
            if (i === 0) this.context.moveTo(xs[i], ys[i]);
            else this.context.lineTo(xs[i], ys[i]);
        }
        this.context.closePath();
        this.context.stroke();
    }
    fillPolygon(p: Polygon): void {
        this.context.beginPath();
        for (let i = 0; i < p.npoints; i++) {
            if (i === 0) this.context.moveTo(p.xpoints[i], p.ypoints[i]);
            else this.context.lineTo(p.xpoints[i], p.ypoints[i]);
        }
        this.context.closePath();
        this.context.fill();
    }
    setFont(f: Font | null): void {
        if (f != null) {
            this.context.setFont(f.fontname);
            this.currentFontSize = f.size;
            this.currentFont = f;
        }
    }
    getFont(): Font | null { return this.currentFont; }
    drawLock(x: number, y: number): void {
        this.context.save();
        this.setColor(new Color().init$int_int_int(209, 75, 75));
        this.context.setLineWidth(3);
        this.fillRect(x, y, 30, 20);
        this.context.beginPath();
        this.context.moveTo(x + 15 - 10, y);
        this.context.lineTo(x + 15 - 10, y - 4);
        this.context.arc(x + 15, y - 4, 10, -3.1415, 0);
        this.context.lineTo(x + 15 + 10, y);
        this.context.stroke();
        this.context.restore();
    }
    static distanceSq(x1: number, y1: number, x2: number, y2: number): number {
        x2 -= x1;
        y2 -= y1;
        return x2 * x2 + y2 * y2;
    }
    setLineDash(a: number, b: number): void { this.context.setLineDash(a === 0 ? [] : [a, b]); }
}
