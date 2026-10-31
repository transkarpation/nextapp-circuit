// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from OTAElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, CompositeElm, EditInfo, Font, Graphics, Point, Polygon, RailElm, StringTokenizer, idiv } from '../core/internal';

export class OTAElm extends CompositeElm {
    static modelString: string = "RailElm 4\rRailElm 10\rNTransistorElm 1 2 3\rNTransistorElm 3 1 4\rNTransistorElm 3 3 4\rNTransistorElm 5 6 2\rNTransistorElm 7 8 2\rPTransistorElm 9 6 10\rPTransistorElm 9 9 10\rPTransistorElm 6 12 9\rPTransistorElm 11 8 10\rPTransistorElm 11 11 10\rPTransistorElm 8 13 11\rNTransistorElm 14 14 4\rNTransistorElm 14 12 4\rNTransistorElm 12 13 14\rNTransistorElm 15 15 5\rNTransistorElm 15 15 7";
    static modelExternalNodes: number[] = [7, 5, 15, 1, 13];
    // private static String modelString="NTransistorElm 1 1 2\rNTransistorElm 1
    // 2 3\rNTransistorElm 1 3 4\rNTransistorElm 1 4 5";
    // private static int[] modelExternalNodes = { 1, 2, 3 , 4, 5};
    declare arrowPoly1: Polygon;
    declare arrowPoly2: Polygon;
    declare opsize: number;
    declare opheight: number;
    declare opwidth: number;
    declare circDiam: number;
    declare circOverlap: number;
    declare in1p: Point[];
    declare in2p: Point[];
    declare in3p: Point[];
    declare in4p: Point[];
    declare textp: Point[];
    declare bar1: Point[];
    declare bar2: Point[];
    declare circCent: Point[];
    declare point2bis: Point;
    declare triangle: Polygon;
    declare plusFont: Font;
    declare curCount0: number;
    declare curCount1: number;
    declare curCount2: number;
    declare curCount3: number;
    declare posVolt: number;
    declare negVolt: number;
    init$2(xx: number, yy: number): this {
        CompositeElm.prototype.init$4.call(this, xx, yy, OTAElm.modelString, OTAElm.modelExternalNodes);
        this.curCount0 = 0;
        this.curCount1 = 0;
        this.curCount2 = 0;
        this.curCount3 = 0;
        this.posVolt = 9.0;
        this.negVolt = -9.0;
        this.noDiagonal = true;
        this.initOTA();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CompositeElm.prototype.init$8.call(this, xa, ya, xb, yb, f, st, OTAElm.modelString, OTAElm.modelExternalNodes);
        this.curCount0 = 0;
        this.curCount1 = 0;
        this.curCount2 = 0;
        this.curCount3 = 0;
        this.posVolt = 9.0;
        this.negVolt = -9.0;
        this.noDiagonal = true;
        this.negVolt = ((this.compElmList.get(0) as any as RailElm)).maxVoltage;
        this.posVolt = ((this.compElmList.get(1) as any as RailElm)).maxVoltage;
        return this;
    }
    initOTA(): void {
        ((this.compElmList.get(0) as any as RailElm)).maxVoltage = this.negVolt;
        ((this.compElmList.get(1) as any as RailElm)).maxVoltage = this.posVolt;
    }
    reset(): void {
        super.reset();
        this.curCount0 = this.curCount1 = this.curCount2 = this.curCount3 = 0;
    }
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, idiv(3 * this.opheight, 2));
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.in1p[0], this.in1p[1]);
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.in2p[0], this.in2p[1]);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.in3p[0], this.in3p[1]);
        this.setVoltageColor(g, this.volts[3]);
        CircuitElm.drawThickLine$3(g, this.in4p[0], this.in4p[1]);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickPolygon$2(g, this.triangle);
        g.fillPolygon(this.arrowPoly1);
        g.fillPolygon(this.arrowPoly2);
        CircuitElm.drawThickLine$3(g, this.bar1[0], this.bar1[1]);
        CircuitElm.drawThickLine$3(g, this.bar2[0], this.bar2[1]);
        CircuitElm.drawThickCircle(g, this.circCent[0].x, this.circCent[0].y, idiv(this.circDiam, 2));
        CircuitElm.drawThickCircle(g, this.circCent[1].x, this.circCent[1].y, idiv(this.circDiam, 2));
        g.setFont(this.plusFont);
        this.drawCenteredText(g, "+", this.textp[0].x, this.textp[0].y - 2, true);
        this.drawCenteredText(g, "-", this.textp[1].x, this.textp[1].y, true);
        // setVoltageColor(g, volts[2]);
        // drawThickLine(g, lead2, point2);
        this.curCount0 = this.updateDotCount$2(-this.getCurrentIntoNode(0), this.curCount0);
        this.drawDots(g, this.in1p[0], this.in1p[1], this.curCount0);
        this.curCount1 = this.updateDotCount$2(-this.getCurrentIntoNode(1), this.curCount1);
        this.drawDots(g, this.in2p[0], this.in2p[1], this.curCount0);
        this.curCount2 = this.updateDotCount$2(-this.getCurrentIntoNode(2), this.curCount2);
        this.drawDots(g, this.in3p[0], this.in3p[1], this.curCount2);
        this.curCount3 = this.updateDotCount$2(-this.getCurrentIntoNode(3), this.curCount3);
        this.drawDots(g, this.in4p[0], this.in4p[1], this.curCount3);
        this.drawPosts(g);
    }
    setPoints(): void {
        super.setPoints();
        let ww: number = this.opwidth;
        let wtot: number = ww * 2 + 2 * this.circDiam - this.circOverlap;
        if (this.dn > wtot) {
            this.lead1 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1.0 - wtot / this.dn, 0);
            this.lead2 = this.point2;
            this.point2bis = this.point2;
        } else {
            this.lead1 = this.point1;
            this.lead2 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, wtot / this.dn, 0);
            this.point2bis = this.lead2;
        }
        let hs: number = this.opheight * this.dsign;
        // if ((flags & FLAG_SWAP) != 0)
        // hs = -hs;
        this.in1p = this.newPointArray(2);
        this.in2p = this.newPointArray(2);
        this.in3p = this.newPointArray(2);
        this.in4p = this.newPointArray(2);
        this.textp = this.newPointArray(2);
        this.bar1 = this.newPointArray(2);
        this.bar2 = this.newPointArray(2);
        this.circCent = this.newPointArray(2);
        this.interpPoint2(this.point1, this.point2bis, this.in1p[0], this.in2p[0], 0, hs);
        this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hs);
        this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], .1, hs);
        this.in3p[0] = this.point1;
        this.in3p[1] = this.lead1;
        this.in4p[0] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1.0 - (16.0 / wtot), 32);
        this.in4p[1] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1.0 - (16.0 / wtot), 8);
        // in4p[0].x=sim.snapGrid(in4p[0].x);
        // in4p[0].y=sim.snapGrid(in4p[0].y);
        let tris: Point[] = this.newPointArray(3);
        this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, idiv(3 * hs, 2));
        tris[2] = this.interpPoint$3(this.lead1, this.lead2, (2.0 * ww) / wtot);
        this.triangle = this.createPolygon$3(tris[0], tris[1], tris[2]);
        this.circCent[0] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1.0 - (this.circDiam / (2.0 * wtot)), 0);
        this.circCent[1] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1.0 - (3 * this.circDiam / 2.0 - this.circOverlap) / wtot, 0);
        let d1: Point = null as any, d2: Point = null as any;
        d1 = this.interpPoint$3(this.in3p[1], this.in1p[1], 0.3333);
        d2 = this.interpPoint$3(this.in3p[1], this.in1p[1], 0.6666);
        this.arrowPoly1 = this.calcArrow(d1, d2, 8, 4);
        this.interpPoint2(d1, d2, this.bar1[0], this.bar1[1], 1.0, 4);
        d1 = this.interpPoint$3(this.in3p[1], this.in2p[1], 0.3333);
        d2 = this.interpPoint$3(this.in3p[1], this.in2p[1], 0.6666);
        this.arrowPoly2 = this.calcArrow(d1, d2, 8, 4);
        this.interpPoint2(d1, d2, this.bar2[0], this.bar2[1], 1.0, 4);
        this.plusFont = new Font().init$3("SansSerif", 0, 14);
        this.setPost$2(0, this.in1p[0]);
        this.setPost$2(1, this.in2p[0]);
        this.setPost$2(2, this.in3p[0]);
        this.setPost$2(3, this.in4p[0]);
        this.setPost$2(4, this.point2bis);
    }
    getDumpType(): number {
        return 402;
    }
    getInfo(arr: string[]): void {
        arr[0] = "OTA (LM13700 style)";
        arr[1] = "Iabc = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(3));
        arr[2] = "V+ - V- = " + CircuitElm.getVoltageText(this.volts[0] - this.volts[1]);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Positive Supply Voltage (5-20V)", this.posVolt, 5, 20);
        }
        if (n === 1) {
            return new EditInfo("Negative Supply Voltage (V)", this.negVolt, -20, -5);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.posVolt = ei.value;
        }
        if (n === 1) {
            this.negVolt = ei.value;
        }
        this.initOTA();
    }
}
Object.assign(OTAElm.prototype, { "arrowPoly1": null, "arrowPoly2": null, "opsize": 0, "opheight": 32, "opwidth": 32, "circDiam": 19, "circOverlap": 8, "in1p": null, "in2p": null, "in3p": null, "in4p": null, "textp": null, "bar1": null, "bar2": null, "circCent": null, "point2bis": null, "triangle": null, "plusFont": null, "curCount0": 0, "curCount1": 0, "curCount2": 0, "curCount3": 0, "posVolt": 0, "negVolt": 0 });
