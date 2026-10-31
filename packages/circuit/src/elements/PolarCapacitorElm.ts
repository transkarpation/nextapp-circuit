// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from PolarCapacitorElm.java to TypeScript.
/* eslint-disable */
import { CapacitorElm, CircuitElm, Color, EditInfo, Graphics, Point, StringTokenizer, idiv, parseJDouble, toInt } from '../core/internal';

export class PolarCapacitorElm extends CapacitorElm {
    declare maxNegativeVoltage: number;
    init$2(xx: number, yy: number): this {
        CapacitorElm.prototype.init$2.call(this, xx, yy);
        this.maxNegativeVoltage = 1;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CapacitorElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.maxNegativeVoltage = parseJDouble(st.nextToken$0());
        return this;
    }
    getDumpType(): number {
        return 209;
    }
    dump(): string {
        return super.dump() + " " + this.maxNegativeVoltage;
    }
    declare plusPoint: Point;
    setPoints(): void {
        super.setPoints();
        let f: number = (this.dn / 2 - 4) / this.dn;
        let i: number = 0;
        this.platePoints = this.newPointArray(8);
        for (i = 0; i <= 7; i++) {
            let q: number = (i - 3.5) / 3.5;
            this.platePoints[i] = this.interpPoint$Point_Point_dbl_dbl(this.plate2[0], this.plate2[1], i / 7., 5 * (1 - Math.sqrt(1 - q * q)));
        }
        this.plusPoint = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, f - 8 / this.dn, -10 * this.dsign);
        if (this.y2 > this.y) {
            this.plusPoint.y += 4;
        }
        if (this.y > this.y2) {
            this.plusPoint.y += 3;
        }
    }
    draw(g: Graphics): void {
        super.draw(g);
        g.setColor(Color.white);
        g.setFont(CircuitElm.unitsFont);
        let w: number = toInt(g.context.measureText("+").getWidth());
        g.drawString("+", this.plusPoint.x - idiv(w, 2), this.plusPoint.y);
    }
    getInfo(arr: string[]): void {
        super.getInfo(arr);
        arr[0] = "capacitor (polarized)";
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            return new EditInfo("Max Reverse Voltage", this.maxNegativeVoltage, 0, 0);
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2 && ei.value >= 0) {
            this.maxNegativeVoltage = ei.value;
        }
        super.setEditValue(n, ei);
    }
    stepFinished(): void {
        if (this.getVoltageDiff() < 0 && this.getVoltageDiff() < -this.maxNegativeVoltage) {
            CircuitElm.sim.stop("capacitor exceeded max reverse voltage", this);
        }
    }
    getShortcut(): number {
        return 67;
    }
}
Object.assign(PolarCapacitorElm.prototype, { "maxNegativeVoltage": 0, "plusPoint": null });
