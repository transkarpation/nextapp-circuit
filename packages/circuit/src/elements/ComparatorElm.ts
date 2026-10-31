// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from ComparatorElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, CompositeElm, Font, Graphics, Point, Polygon, StringTokenizer, toInt } from '../core/internal';

export class ComparatorElm extends CompositeElm {
    static modelString: string = "OpAmpElm 1 2 3\rAnalogSwitchElm 4 5 3\rGroundElm 5";
    static modelExternalNodes: number[] = [2, 1, 4];
    declare FLAG_SMALL: number;
    declare opsize: number;
    declare opheight: number;
    declare opwidth: number;
    declare in1p: Point[];
    declare in2p: Point[];
    declare textp: Point[];
    declare triangle: Polygon;
    declare plusFont: Font;
    init$2(xx: number, yy: number): this {
        CompositeElm.prototype.init$4.call(this, xx, yy, ComparatorElm.modelString, ComparatorElm.modelExternalNodes);
        this.noDiagonal = true;
        this.setSize(CircuitElm.sim.smallGridCheckItem.getState() ? 1 : 2);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CompositeElm.prototype.init$8.call(this, xa, ya, xb, yb, f, st, ComparatorElm.modelString, ComparatorElm.modelExternalNodes);
        this.noDiagonal = true;
        this.setSize((f & this.FLAG_SMALL) !== 0 ? 1 : 2);
        return this;
    }
    getDumpType(): number {
        return 401;
    }
    setSize(s: number): void {
        this.opsize = s;
        this.opheight = 8 * s;
        this.opwidth = 13 * s;
        this.flags = (this.flags & ~this.FLAG_SMALL) | ((s === 1) ? this.FLAG_SMALL : 0);
    }
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.opheight * 2);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.in1p[0], this.in1p[1]);
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.in2p[0], this.in2p[1]);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickPolygon$2(g, this.triangle);
        g.setFont(this.plusFont);
        this.drawCenteredText(g, "-", this.textp[0].x, this.textp[0].y - 2, true);
        this.drawCenteredText(g, "+", this.textp[1].x, this.textp[1].y, true);
        this.drawCenteredText(g, "\u2265?", this.textp[2].x, this.textp[2].y, true);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.lead2, this.point2);
        this.curcount = this.updateDotCount$2(-this.getCurrentIntoNode(2), this.curcount);
        this.drawDots(g, this.point2, this.lead2, this.curcount);
        this.drawPosts(g);
    }
    setPoints(): void {
        super.setPoints();
        if (this.dn > 150 && this === CircuitElm.sim.dragElm) {
            this.setSize(2);
        }
        let ww: number = this.opwidth;
        if (ww > this.dn / 2) {
            ww = toInt((this.dn / 2));
        }
        this.calcLeads(ww * 2);
        let hs: number = this.opheight * this.dsign;
        //	    if ((flags & FLAG_SWAP) != 0)
        //		hs = -hs;
        this.in1p = this.newPointArray(2);
        this.in2p = this.newPointArray(2);
        this.textp = this.newPointArray(3);
        this.interpPoint2(this.point1, this.point2, this.in1p[0], this.in2p[0], 0, hs);
        this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hs);
        this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], .2, hs);
        this.interpPoint$5(this.lead1, this.lead2, this.textp[2], 0.5, 0);
        let tris: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, hs * 2);
        this.triangle = this.createPolygon$3(tris[0], tris[1], this.lead2);
        this.plusFont = new Font().init$3("SansSerif", 0, this.opsize === 2 ? 14 : 10);
        this.setPost$2(0, this.in1p[0]);
        this.setPost$2(1, this.in2p[0]);
        this.setPost$2(2, this.point2);
    }
    getInfo(arr: string[]): void {
        arr[0] = "Comparator";
        arr[1] = "V+ = " + CircuitElm.getVoltageText(this.volts[1]);
        arr[2] = "V- = " + CircuitElm.getVoltageText(this.volts[0]);
    }
}
Object.assign(ComparatorElm.prototype, { "FLAG_SMALL": 2, "opsize": 0, "opheight": 0, "opwidth": 0, "in1p": null, "in2p": null, "textp": null, "triangle": null, "plusFont": null });
