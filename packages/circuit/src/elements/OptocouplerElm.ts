// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from OptocouplerElm.java to TypeScript.
/* eslint-disable */
import { CCCSElm, CircuitElm, CompositeElm, DiodeElm, Graphics, Point, Polygon, StringTokenizer, TransistorElm, idiv, newArray } from '../core/internal';

export class OptocouplerElm extends CompositeElm {
    declare csize: number;
    declare cspc: number;
    declare cspc2: number;
    declare rectPointsX: number[];
    declare rectPointsY: number[];
    declare curCounts: number[];
    static modelString: string = "DiodeElm 6 1\rCCCSElm 1 2 3 4\rNTransistorElm 3 4 5";
    static modelExternalNodes: number[] = [6, 2, 4, 5];
    declare diode: DiodeElm;
    declare transistor: TransistorElm;
    init$2(xx: number, yy: number): this {
        CompositeElm.prototype.init$4.call(this, xx, yy, OptocouplerElm.modelString, OptocouplerElm.modelExternalNodes);
        this.noDiagonal = true;
        this.initOptocoupler();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CompositeElm.prototype.init$8.call(this, xa, ya, xb, yb, f, null, OptocouplerElm.modelString, OptocouplerElm.modelExternalNodes);
        // pass st=null since we don't need to undump any of the sub-elements
        this.noDiagonal = true;
        this.initOptocoupler();
        return this;
    }
    dump(): string {
        return this.dumpWithMask(0);
    }
    initOptocoupler(): void {
        this.csize = 2;
        this.cspc = 8 * 2;
        this.cspc2 = this.cspc * 2;
        this.diode = (this.compElmList.get(0) as any as DiodeElm);
        let cccs: CCCSElm = (this.compElmList.get(1) as any as CCCSElm);
        // from http://www.cel.com/pdf/appnotes/an3017.pdf
        cccs.setExpr("max(0,min(.0001, select(i-.003, (-80000000000*(i)^5+800000000*(i)^4-3000000*(i)^3+5177.2*(i)^2+.2453*(i)-.00005)*1.04/700, (9000000*(i)^5-998113*(i)^4+42174*(i)^3-861.32*(i)^2+9.0836*(i)-.0078)*.945/700)))");
        this.transistor = (this.compElmList.get(2) as any as TransistorElm);
        this.transistor.setBeta(700);
        this.curCounts = newArray(0, 4);
    }
    reset(): void {
        super.reset();
        this.curCounts = newArray(0, 4);
    }
    getConnection(n1: number, n2: number): boolean {
        return idiv(n1, 2) === idiv(n2, 2);
    }
    draw(g: Graphics): void {
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        CircuitElm.drawThickPolygon$4(g, this.rectPointsX, this.rectPointsY, 4);
        // draw stubs
        let i: number = 0;
        for (i = 0; i !== 4; i++) {
            this.setVoltageColor(g, this.volts[i]);
            let a: Point = this.posts[i];
            let b: Point = this.stubs[i];
            CircuitElm.drawThickLine$3(g, a, b);
            this.curCounts[i] = this.updateDotCount$2(-this.getCurrentIntoNode(i), this.curCounts[i]);
            this.drawDots(g, a, b, this.curCounts[i]);
        }
        this.diode.draw(g);
        this.transistor.draw(g);
        this.drawPosts(g);
        // draw little arrows
        g.setColor(CircuitElm.lightGrayColor);
        let sx: number = this.stubs[0].x + 2;
        let sy: number = idiv((this.stubs[0].y + this.stubs[1].y), 2);
        for (i = 0; i !== 2; i++) {
            let y: number = sy + i * 10 - 5;
            let p1: Point = new Point().init$2(sx, y);
            let p2: Point = new Point().init$2(sx + 20, y);
            let p: Polygon = this.calcArrow(p1, p2, 5, 2);
            g.fillPolygon(p);
            g.drawLine(sx + 10, y, sx + 15, y);
        }
    }
    declare stubs: Point[];
    setPoints(): void {
        super.setPoints();
        // adapted from ChipElm
        let hs: number = this.cspc;
        let x0: number = this.x + this.cspc2;
        let y0: number = this.y;
        let xr: number = x0 - this.cspc;
        let yr: number = y0 - idiv(this.cspc, 2);
        let sizeX: number = 2;
        let sizeY: number = 2;
        let xs: number = sizeX * this.cspc2;
        let ys: number = sizeY * this.cspc2 - this.cspc;
        this.rectPointsX = [xr, xr + xs, xr + xs, xr];
        this.rectPointsY = [yr, yr, yr + ys, yr + ys];
        this.setBbox$4(xr, yr, this.rectPointsX[2], this.rectPointsY[2]);
        this.stubs = newArray(null, 4);
        //        setPin(0, x0, y0, 1, 0, 0, -1, 0, 0);
        //        setPin(1, x0, y0, 1, 0, 0,  1, 0, ys-cspc2);
        //        setPin(2, x0, y0, 1, 0, 0, -1, 0, 0);
        //        setPin(3, x0, y0, 1, 0, 0,  1, 0, ys-cspc2);
        this.setPin$9(0, x0, y0, 0, 1, -1, 0, 0, 0);
        this.setPin$9(1, x0, y0, 0, 1, -1, 0, 0, 0);
        this.setPin$9(2, x0, y0, 0, 1, 1, 0, xs - this.cspc2, 0);
        this.setPin$9(3, x0, y0, 0, 1, 1, 0, xs - this.cspc2, 0);
        this.diode.setPosition(this.posts[0].x + 32, this.posts[0].y, this.posts[1].x + 32, this.posts[1].y);
        this.stubs[0] = this.diode.getPost(0);
        this.stubs[1] = this.diode.getPost(1);
        let midp: number = idiv((this.posts[2].y + this.posts[3].y), 2);
        this.transistor.setPosition(this.posts[2].x - 40, midp, this.posts[2].x - 24, midp);
        this.stubs[2] = this.transistor.getPost(1);
        this.stubs[3] = this.transistor.getPost(2);
    }
    setPin$9(n: number, px: number, py: number, dx: number, dy: number, dax: number, day: number, sx: number, sy: number): void {
        let pos: number = n % 2;
        //		(n < 2) ? 0 : 1;
        let xa: number = px + this.cspc2 * dx * pos + sx;
        let ya: number = py + this.cspc2 * dy * pos + sy;
        this.setPost$2(n, new Point().init$2(xa + dax * this.cspc2, ya + day * this.cspc2));
        this.stubs[n] = new Point().init$2(xa + dax * this.cspc, ya + day * this.cspc);
    }
    getDumpType(): number {
        return 407;
    }
    getInfo(arr: string[]): void {
        arr[0] = "optocoupler";
        arr[1] = "Iin = " + CircuitElm.getCurrentText(this.getCurrentIntoNode(0));
        arr[2] = "Iout = " + CircuitElm.getCurrentText(this.getCurrentIntoNode(2));
    }
}
Object.assign(OptocouplerElm.prototype, { "csize": 0, "cspc": 0, "cspc2": 0, "rectPointsX": null, "rectPointsY": null, "curCounts": null, "diode": null, "transistor": null, "stubs": null });
