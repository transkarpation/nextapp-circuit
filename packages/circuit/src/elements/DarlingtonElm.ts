// Test element to evaluate if constructing compound elements from individual transistors is feasible
// Iain Sharp, Feb 2017

// Changed 2026-10-31: converted from DarlingtonElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Color, CompositeElm, Graphics, Point, Polygon, StringTokenizer, TransistorElm, parseJInt } from '../core/internal';

export class DarlingtonElm extends CompositeElm {
    declare rectPoly: Polygon;
    declare arrowPoly: Polygon;
    declare rect: Point[];
    declare coll: Point[];
    declare emit: Point[];
    declare base: Point;
    declare coll2: Point[];
    declare pnp: number;
    // +1 for NPN, -1 for PNP;
    declare curcount_c: number;
    declare curcount_e: number;
    declare curcount_b: number;
    static modelString: string = "NTransistorElm 1 2 4\rNTransistorElm 4 2 3";
    static modelExternalNodes: number[] = [1, 2, 3];
    init$3(xx: number, yy: number, pnpflag: boolean): this {
        CompositeElm.prototype.init$4.call(this, xx, yy, DarlingtonElm.modelString, DarlingtonElm.modelExternalNodes);
        this.pnp = (pnpflag) ? -1 : 1;
        ((this.compElmList.get(0) as any as TransistorElm)).pnp = this.pnp;
        ((this.compElmList.get(1) as any as TransistorElm)).pnp = this.pnp;
        this.noDiagonal = true;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CompositeElm.prototype.init$8.call(this, xa, ya, xb, yb, f, st, DarlingtonElm.modelString, DarlingtonElm.modelExternalNodes);
        this.pnp = parseJInt(st.nextToken$0());
        this.noDiagonal = true;
        return this;
    }
    reset(): void {
        super.reset();
        this.curcount_c = this.curcount_e = this.curcount_b = 0;
    }
    getDumpType(): number {
        return 400;
    }
    dump(): string {
        return super.dump() + " " + this.pnp;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, 16);
        this.setPowerColor$Graphics_bool(g, true);
        // draw collector
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.coll[0], this.coll[1]);
        CircuitElm.drawThickLine$3(g, this.coll2[0], this.coll2[1]);
        CircuitElm.drawThickLine$3(g, this.coll[0], this.coll2[0]);
        // draw emitter
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.emit[0], this.emit[1]);
        // draw arrow
        g.setColor(CircuitElm.lightGrayColor);
        g.fillPolygon(this.arrowPoly);
        // draw base
        this.setVoltageColor(g, this.volts[0]);
        if (CircuitElm.sim.powerCheckItem.getState()) {
            g.setColor(Color.gray);
        }
        CircuitElm.drawThickLine$3(g, this.point1, this.base);
        // draw dots
        this.curcount_b = this.updateDotCount$2(this.getCurrentIntoNode(0), this.curcount_b);
        this.drawDots(g, this.base, this.point1, this.curcount_b);
        this.curcount_c = this.updateDotCount$2(this.getCurrentIntoNode(1), this.curcount_c);
        this.drawDots(g, this.coll[1], this.coll[0], this.curcount_c);
        this.curcount_e = this.updateDotCount$2(this.getCurrentIntoNode(2), this.curcount_e);
        this.drawDots(g, this.emit[1], this.emit[0], this.curcount_e);
        // draw base rectangle
        this.setVoltageColor(g, this.volts[0]);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.rectPoly);
        if ((this.needsHighlight() || CircuitElm.sim.dragElm === this) && this.dy === 0) {
            g.setColor(Color.white);
            // IES
            // g.setFont(unitsFont);
            let ds: number = CircuitElm.sign$1(this.dx);
            g.drawString("B", this.base.x - 10 * ds, this.base.y - 5);
            g.drawString("C", this.coll[0].x - 3 + 9 * ds, this.coll[0].y + 4);
            // x+6 if
            // ds=1,
            // -12 if
            // -1
            g.drawString("E", this.emit[0].x - 3 + 9 * ds, this.emit[0].y + 4);
        }
        this.drawPosts(g);
    }
    getInfo(arr: string[]): void {
        arr[0] = CirSim.LS("darlington pair") + " (" + ((this.pnp === -1) ? "PNP)" : "NPN)");
        let vbc: number = this.volts[0] - this.volts[1];
        let vbe: number = this.volts[0] - this.volts[2];
        let vce: number = this.volts[1] - this.volts[2];
        arr[1] = "Ic = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(1));
        arr[2] = "Ib = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(0));
        arr[3] = "Vbe = " + CircuitElm.getVoltageText(vbe);
        arr[4] = "Vbc = " + CircuitElm.getVoltageText(vbc);
        arr[5] = "Vce = " + CircuitElm.getVoltageText(vce);
    }
    setPoints(): void {
        super.setPoints();
        let hs: number = 16;
        let hs2: number = hs * this.dsign * this.pnp;
        // calc collector, emitter posts
        this.coll = this.newPointArray(2);
        this.coll2 = this.newPointArray(2);
        this.emit = this.newPointArray(2);
        this.interpPoint2(this.point1, this.point2, this.coll[0], this.emit[0], 1, hs2);
        this.coll2[0] = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1, hs2 - 5 * this.dsign * this.pnp);
        // calc rectangle edges
        this.rect = this.newPointArray(4);
        this.interpPoint2(this.point1, this.point2, this.rect[0], this.rect[1], 1 - 16 / this.dn, hs);
        this.interpPoint2(this.point1, this.point2, this.rect[2], this.rect[3], 1 - 13 / this.dn, hs);
        // calc points where collector/emitter leads contact rectangle
        this.interpPoint2(this.point1, this.point2, this.coll[1], this.emit[1], 1 - 13 / this.dn, 6 * this.dsign * this.pnp);
        this.coll2[1] = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1 - 13 / this.dn, this.dsign * this.pnp);
        // calc point where base lead contacts rectangle
        this.base = new Point().init$0();
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.base, 1 - 16 / this.dn);
        // rectangle
        this.rectPoly = this.createPolygon$4(this.rect[0], this.rect[2], this.rect[3], this.rect[1]);
        // arrow
        if (this.pnp === 1) {
            this.arrowPoly = this.calcArrow(this.emit[1], this.emit[0], 8, 4);
        } else {
            let pt: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1 - 11 / this.dn, -5 * this.dsign * this.pnp);
            this.arrowPoly = this.calcArrow(this.emit[0], pt, 8, 4);
        }
        this.setPost$2(0, this.point1);
        this.setPost$2(1, this.coll[0]);
        this.setPost$2(2, this.emit[0]);
    }
}
Object.assign(DarlingtonElm.prototype, { "rectPoly": null, "arrowPoly": null, "rect": null, "coll": null, "emit": null, "base": null, "coll2": null, "pnp": 0, "curcount_c": 0, "curcount_e": 0, "curcount_b": 0 });
