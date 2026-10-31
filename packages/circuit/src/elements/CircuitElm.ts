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
// circuit element class

// Changed 2026-10-31: converted from CircuitElm.java to TypeScript.
/* eslint-disable */
import { CanvasGradient, CirSim, Color, EditInfo, Font, Graphics, LineCap, NumberFormat, Point, Polygon, RailElm, Rectangle, Scope, ScopeElm, SweepElm, Vector, VoltageElm, idiv, newArray, toChar, toInt } from '../core/internal';

export abstract class CircuitElm {
    static voltageRange: number = 5;
    static colorScaleCount: number = 32;
    static colorScale: Color[] = null;
    static currentMult: number = 0;
    static powerMult: number = 0;
    // scratch points for convenience
    static ps1: Point = null;
    static ps2: Point = null;
    static sim: CirSim = null;
    static whiteColor: Color = null;
    static selectColor: Color = null;
    static lightGrayColor: Color = null;
    static unitsFont: Font = null;
    static showFormat: NumberFormat = null;
    static shortFormat: NumberFormat = null;
    //, noCommaFormat;
    static pi: number = 3.14159265358979323846;
    static mouseElmRef: CircuitElm = null;
    static SCALE_AUTO: number = 0;
    static SCALE_1: number = 1;
    static SCALE_M: number = 2;
    static SCALE_MU: number = 3;
    // initial point where user created element.  For simple two-terminal elements, this is the first node/post.
    declare x: number;
    declare y: number;
    // point to which user dragged out element.  For simple two-terminal elements, this is the second node/post
    declare x2: number;
    declare y2: number;
    declare flags: number;
    declare nodes: number[];
    declare voltSource: number;
    // length along x and y axes, and sign of difference
    declare dx: number;
    declare dy: number;
    declare dsign: number;
    declare lastHandleGrabbed: number;
    // length of element
    declare dn: number;
    declare dpx1: number;
    declare dpy1: number;
    // (x,y) and (x2,y2) as Point objects
    declare point1: Point;
    declare point2: Point;
    // lead points (ends of wire stubs for simple two-terminal elements)
    declare lead1: Point;
    declare lead2: Point;
    // voltages at each node
    declare volts: number[];
    declare current: number;
    declare curcount: number;
    declare boundingBox: Rectangle;
    // if subclasses set this to true, element will be horizontal or vertical only
    declare noDiagonal: boolean;
    declare selected: boolean;
    //    abstract int getDumpType();
    getDumpType(): number {
        throw new Error();
        // Seems necessary to work-around what appears to be a compiler
        // bug affecting OTAElm to make sure this method (which should really be abstract) throws
        // an exception
    }
    // leftover from java, doesn't do anything anymore.
    getDumpClass(): any {
        return this.constructor;
    }
    getDefaultFlags(): number {
        return 0;
    }
    static initClass(s: CirSim): void {
        CircuitElm.unitsFont = new Font().init$3("SansSerif", 0, 12);
        CircuitElm.sim = s;
        CircuitElm.colorScale = newArray(null, CircuitElm.colorScaleCount);
        CircuitElm.ps1 = new Point().init$0();
        CircuitElm.ps2 = new Point().init$0();
        CircuitElm.showFormat = NumberFormat.getFormat("####.###");
        CircuitElm.shortFormat = NumberFormat.getFormat("####.#");
    }
    static positiveColor: Color = null;
    static negativeColor: Color = null;
    static neutralColor: Color = null;
    static setColorScale(): void {
        let i: number = 0;
        if (CircuitElm.positiveColor == null) {
            CircuitElm.positiveColor = Color.green;
        }
        if (CircuitElm.negativeColor == null) {
            CircuitElm.negativeColor = Color.red;
        }
        if (CircuitElm.neutralColor == null) {
            CircuitElm.neutralColor = Color.gray;
        }
        for (i = 0; i !== CircuitElm.colorScaleCount; i++) {
            let v: number = i * 2. / CircuitElm.colorScaleCount - 1;
            if (v < 0) {
                CircuitElm.colorScale[i] = new Color().init$Color_Color_dbl(CircuitElm.neutralColor, CircuitElm.negativeColor, -v);
            } else {
                CircuitElm.colorScale[i] = new Color().init$Color_Color_dbl(CircuitElm.neutralColor, CircuitElm.positiveColor, v);
            }
        }
    }
    // create new element with one post at xx,yy, to be dragged out by user
    init$2(xx: number, yy: number): this {
        this.lastHandleGrabbed = -1;
        this.x = this.x2 = xx;
        this.y = this.y2 = yy;
        this.flags = this.getDefaultFlags();
        this.allocNodes();
        this.initBoundingBox();
        return this;
    }
    // create element between xa,ya and xb,yb from undump
    init$5(xa: number, ya: number, xb: number, yb: number, f: number): this {
        this.lastHandleGrabbed = -1;
        this.x = xa;
        this.y = ya;
        this.x2 = xb;
        this.y2 = yb;
        this.flags = f;
        this.allocNodes();
        this.initBoundingBox();
        return this;
    }
    initBoundingBox(): void {
        this.boundingBox = new Rectangle().init$0();
        this.boundingBox.setBounds(CircuitElm.min(this.x, this.x2), CircuitElm.min(this.y, this.y2), CircuitElm.abs(this.x2 - this.x) + 1, CircuitElm.abs(this.y2 - this.y) + 1);
    }
    // allocate nodes/volts arrays we need
    allocNodes(): void {
        let n: number = this.getPostCount() + this.getInternalNodeCount();
        // preserve voltages if possible
        if (this.nodes == null || this.nodes.length !== n) {
            this.nodes = newArray(0, n);
            this.volts = newArray(0, n);
        }
    }
    // dump component state for export/undo
    dump(): string {
        let t: number = this.getDumpType();
        return (t < 127 ? String.fromCharCode((toChar(t))) + " " : t + " ") + this.x + " " + this.y + " " + this.x2 + " " + this.y2 + " " + this.flags;
    }
    // handle reset button
    reset(): void {
        let i: number = 0;
        for (i = 0; i !== this.getPostCount() + this.getInternalNodeCount(); i++) {
            this.volts[i] = 0;
        }
        this.curcount = 0;
    }
    draw(g: Graphics): void {
    }
    // set current for voltage source vn to c.  vn will be the same value as in a previous call to setVoltageSource(n, vn)
    setCurrent(vn: number, c: number): void {
        this.current = c;
    }
    // get current for one- or two-terminal elements
    getCurrent(): number {
        return this.current;
    }
    setParentList(elmList: Vector<CircuitElm>): void {
    }
    // stamp matrix values for linear elements.
    // for non-linear elements, use this to stamp values that don't change each iteration, and call stampRightSide() or stampNonLinear() as needed
    stamp(): void {
    }
    // stamp matrix values for non-linear elements
    doStep(): void {
    }
    delete(): void {
        if (CircuitElm.mouseElmRef === this) {
            CircuitElm.mouseElmRef = null;
        }
        CircuitElm.sim.deleteSliders(this);
    }
    startIteration(): void {
    }
    // get voltage of x'th node
    getPostVoltage(x: number): number {
        return this.volts[x];
    }
    // set voltage of x'th node, called by simulator logic
    setNodeVoltage(n: number, c: number): void {
        this.volts[n] = c;
        this.calculateCurrent();
    }
    // calculate current in response to node voltages changing
    calculateCurrent(): void {
    }
    // calculate post locations and other convenience values used for drawing.  Called when element is moved
    setPoints(): void {
        this.dx = this.x2 - this.x;
        this.dy = this.y2 - this.y;
        this.dn = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dpx1 = this.dy / this.dn;
        this.dpy1 = -this.dx / this.dn;
        this.dsign = (this.dy === 0) ? CircuitElm.sign$1(this.dx) : CircuitElm.sign$1(this.dy);
        this.point1 = new Point().init$2(this.x, this.y);
        this.point2 = new Point().init$2(this.x2, this.y2);
    }
    // calculate lead points for an element of length len.  Handy for simple two-terminal elements.
    // Posts are where the user connects wires; leads are ends of wire stubs drawn inside the element.
    calcLeads(len: number): void {
        if (this.dn < len || len === 0) {
            this.lead1 = this.point1;
            this.lead2 = this.point2;
            return;
        }
        this.lead1 = this.interpPoint$3(this.point1, this.point2, (this.dn - len) / (2 * this.dn));
        this.lead2 = this.interpPoint$3(this.point1, this.point2, (this.dn + len) / (2 * this.dn));
    }
    // calculate point fraction f between a and b, linearly interpolated
    interpPoint$3(a: Point, b: Point, f: number): Point {
        let p: Point = new Point().init$0();
        this.interpPoint$Point_Point_Point_dbl(a, b, p, f);
        return p;
    }
    // calculate point fraction f between a and b, linearly interpolated, return it in c
    interpPoint$Point_Point_Point_dbl(a: Point, b: Point, c: Point, f: number): void {
        c.x = toInt(Math.floor(a.x * (1 - f) + b.x * f + .48));
        c.y = toInt(Math.floor(a.y * (1 - f) + b.y * f + .48));
    }
    /**
     * Returns a point fraction f along the line between a and b and offset perpendicular by g
     * @param a 1st Point
     * @param b 2nd Point
     * @param f Fraction along line
     * @param g Fraction perpendicular to line
     * Returns interpolated point in c
     */
    interpPoint$5(a: Point, b: Point, c: Point, f: number, g: number): void {
        let gx: number = b.y - a.y;
        let gy: number = a.x - b.x;
        g /= Math.sqrt(gx * gx + gy * gy);
        c.x = toInt(Math.floor(a.x * (1 - f) + b.x * f + g * gx + .48));
        c.y = toInt(Math.floor(a.y * (1 - f) + b.y * f + g * gy + .48));
    }
    /**
     * Returns a point fraction f along the line between a and b and offset perpendicular by g
     * @param a 1st Point
     * @param b 2nd Point
     * @param f Fraction along line
     * @param g Fraction perpendicular to line
     * @return Interpolated point
     */
    interpPoint$Point_Point_dbl_dbl(a: Point, b: Point, f: number, g: number): Point {
        let p: Point = new Point().init$0();
        this.interpPoint$5(a, b, p, f, g);
        return p;
    }
    /**
     * Calculates two points fraction f along the line between a and b and offest perpendicular by +/-g
     * @param a 1st point (In)
     * @param b 2nd point (In)
     * @param c 1st point (Out)
     * @param d 2nd point (Out)
     * @param f Fraction along line
     * @param g Fraction perpendicular to line
     */
    interpPoint2(a: Point, b: Point, c: Point, d: Point, f: number, g: number): void {
        //	int xpd = b.x-a.x;
        //	int ypd = b.y-a.y;
        let gx: number = b.y - a.y;
        let gy: number = a.x - b.x;
        g /= Math.sqrt(gx * gx + gy * gy);
        c.x = toInt(Math.floor(a.x * (1 - f) + b.x * f + g * gx + .48));
        c.y = toInt(Math.floor(a.y * (1 - f) + b.y * f + g * gy + .48));
        d.x = toInt(Math.floor(a.x * (1 - f) + b.x * f - g * gx + .48));
        d.y = toInt(Math.floor(a.y * (1 - f) + b.y * f - g * gy + .48));
    }
    draw2Leads(g: Graphics): void {
        // draw first lead
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        // draw second lead
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.lead2, this.point2);
    }
    newPointArray(n: number): Point[] {
        let a: Point[] = newArray(null, n);
        while (n > 0) {
            a[--n] = new Point().init$0();
        }
        return a;
    }
    // draw current dots from point a to b
    drawDots(g: Graphics, pa: Point, pb: Point, pos: number): void {
        if ((!CircuitElm.sim.simIsRunning()) || pos === 0 || !CircuitElm.sim.dotsCheckItem.getState()) {
            return;
        }
        let dx: number = pb.x - pa.x;
        let dy: number = pb.y - pa.y;
        let dn: number = Math.sqrt(dx * dx + dy * dy);
        g.setColor(CircuitElm.sim.conventionCheckItem.getState() ? Color.yellow : Color.cyan);
        let ds: number = 16;
        pos %= ds;
        if (pos < 0) {
            pos += ds;
        }
        let di: number = 0;
        for (di = pos; di < dn; di += ds) {
            let x0: number = toInt((pa.x + di * dx / dn));
            let y0: number = toInt((pa.y + di * dy / dn));
            g.fillRect(x0 - 2, y0 - 2, 4, 4);
        }
    }
    calcArrow(a: Point, b: Point, al: number, aw: number): Polygon {
        let poly: Polygon = new Polygon().init$0();
        let p1: Point = new Point().init$0();
        let p2: Point = new Point().init$0();
        let adx: number = b.x - a.x;
        let ady: number = b.y - a.y;
        let l: number = Math.sqrt(adx * adx + ady * ady);
        poly.addPoint(b.x, b.y);
        this.interpPoint2(a, b, p1, p2, 1 - al / l, aw);
        poly.addPoint(p1.x, p1.y);
        poly.addPoint(p2.x, p2.y);
        return poly;
    }
    createPolygon$3(a: Point, b: Point, c: Point): Polygon {
        let p: Polygon = new Polygon().init$0();
        p.addPoint(a.x, a.y);
        p.addPoint(b.x, b.y);
        p.addPoint(c.x, c.y);
        return p;
    }
    createPolygon$4(a: Point, b: Point, c: Point, d: Point): Polygon {
        let p: Polygon = new Polygon().init$0();
        p.addPoint(a.x, a.y);
        p.addPoint(b.x, b.y);
        p.addPoint(c.x, c.y);
        p.addPoint(d.x, d.y);
        return p;
    }
    createPolygon$1(a: Point[]): Polygon {
        let p: Polygon = new Polygon().init$0();
        let i: number = 0;
        for (i = 0; i !== a.length; i++) {
            p.addPoint(a[i].x, a[i].y);
        }
        return p;
    }
    // draw second point to xx, yy
    drag(xx: number, yy: number): void {
        xx = CircuitElm.sim.snapGrid(xx);
        yy = CircuitElm.sim.snapGrid(yy);
        if (this.noDiagonal) {
            if (Math.abs(this.x - xx) < Math.abs(this.y - yy)) {
                xx = this.x;
            } else {
                yy = this.y;
            }
        }
        this.x2 = xx;
        this.y2 = yy;
        this.setPoints();
    }
    move(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
        this.x2 += dx;
        this.y2 += dy;
        this.boundingBox.translate(dx, dy);
        this.setPoints();
    }
    // called when an element is done being dragged out; returns true if it's zero size and should be deleted
    creationFailed(): boolean {
        return (this.x === this.x2 && this.y === this.y2);
    }
    // this is used to set the position of an internal element so we can draw it inside the parent
    setPosition(x_: number, y_: number, x2_: number, y2_: number): void {
        this.x = x_;
        this.y = y_;
        this.x2 = x2_;
        this.y2 = y2_;
        this.setPoints();
    }
    // determine if moving this element by (dx,dy) will put it on top of another element
    allowMove(dx: number, dy: number): boolean {
        let nx: number = this.x + dx;
        let ny: number = this.y + dy;
        let nx2: number = this.x2 + dx;
        let ny2: number = this.y2 + dy;
        let i: number = 0;
        for (i = 0; i !== CircuitElm.sim.elmList.size(); i++) {
            let ce: CircuitElm = CircuitElm.sim.getElm(i);
            if (ce.x === nx && ce.y === ny && ce.x2 === nx2 && ce.y2 === ny2) {
                return false;
            }
            if (ce.x === nx2 && ce.y === ny2 && ce.x2 === nx && ce.y2 === ny) {
                return false;
            }
        }
        return true;
    }
    movePoint(n: number, dx: number, dy: number): void {
        // modified by IES to prevent the user dragging points to create zero sized nodes
        // that then render improperly
        let oldx: number = this.x;
        let oldy: number = this.y;
        let oldx2: number = this.x2;
        let oldy2: number = this.y2;
        if (n === 0) {
            this.x += dx;
            this.y += dy;
        } else {
            this.x2 += dx;
            this.y2 += dy;
        }
        if (this.x === this.x2 && this.y === this.y2) {
            this.x = oldx;
            this.y = oldy;
            this.x2 = oldx2;
            this.y2 = oldy2;
        }
        this.setPoints();
    }
    drawPosts(g: Graphics): void {
        // we normally do this in updateCircuit() now because the logic is more complicated.
        // we only handle the case where we have to draw all the posts.  That happens when
        // this element is selected or is being created
        if (CircuitElm.sim.dragElm == null && !this.needsHighlight()) {
            return;
        }
        if (CircuitElm.sim.mouseMode === CirSim.MODE_DRAG_ROW || CircuitElm.sim.mouseMode === CirSim.MODE_DRAG_COLUMN) {
            return;
        }
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: Point = this.getPost(i);
            CircuitElm.drawPost(g, p);
        }
    }
    drawHandles(g: Graphics, c: Color): void {
        g.setColor(c);
        if (this.lastHandleGrabbed === -1) {
            g.fillRect(this.x - 3, this.y - 3, 7, 7);
        } else if (this.lastHandleGrabbed === 0) {
            g.fillRect(this.x - 4, this.y - 4, 9, 9);
        }
        if (this.getPostCount() > 1 || this instanceof ScopeElm) {
            if (this.lastHandleGrabbed === -1) {
                g.fillRect(this.x2 - 3, this.y2 - 3, 7, 7);
            } else if (this.lastHandleGrabbed === 1) {
                g.fillRect(this.x2 - 4, this.y2 - 4, 9, 9);
            }
        }
    }
    getHandleGrabbedClose(xtest: number, ytest: number, deltaSq: number, minSize: number): number {
        this.lastHandleGrabbed = -1;
        if (Graphics.distanceSq(this.x, this.y, this.x2, this.y2) >= minSize) {
            if (Graphics.distanceSq(this.x, this.y, xtest, ytest) <= deltaSq) {
                this.lastHandleGrabbed = 0;
            } else if (Graphics.distanceSq(this.x2, this.y2, xtest, ytest) <= deltaSq) {
                this.lastHandleGrabbed = 1;
            }
        }
        return this.lastHandleGrabbed;
    }
    // number of voltage sources this element needs
    getVoltageSourceCount(): number {
        return 0;
    }
    // number of internal nodes (nodes not visible in UI that are needed for implementation)
    getInternalNodeCount(): number {
        return 0;
    }
    // notify this element that its pth node is n.  This value n can be passed to stampMatrix()
    setNode(p: number, n: number): void {
        this.nodes[p] = n;
    }
    // notify this element that its nth voltage source is v.  This value v can be passed to stampVoltageSource(), etc and will be passed back in calls to setCurrent()
    setVoltageSource(n: number, v: number): void {
        // default implementation only makes sense for subclasses with one voltage source.  If we have 0 this isn't used, if we have >1 this won't work
        this.voltSource = v;
    }
    //    int getVoltageSource() { return voltSource; } // Never used except for debug code which is commented out
    getVoltageDiff(): number {
        return this.volts[0] - this.volts[1];
    }
    nonLinear(): boolean {
        return false;
    }
    getPostCount(): number {
        return 2;
    }
    // get (global) node number of nth node
    getNode(n: number): number {
        return this.nodes[n];
    }
    // get position of nth node
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.point2 : null;
    }
    getNodeAtPoint(xp: number, yp: number): number {
        if (this.getPostCount() === 2) {
            return (this.x === xp && this.y === yp) ? 0 : 1;
        }
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: Point = this.getPost(i);
            if (p.x === xp && p.y === yp) {
                return i;
            }
        }
        return 0;
    }
    /*
    void drawPost(Graphics g, int x0, int y0, int n) {
	if (sim.dragElm == null && !needsHighlight() &&
	    sim.getCircuitNode(n).links.size() == 2)
	    return;
	if (sim.mouseMode == CirSim.MODE_DRAG_ROW ||
	    sim.mouseMode == CirSim.MODE_DRAG_COLUMN)
	    return;
	drawPost(g, x0, y0);
    }
    */
    static drawPost(g: Graphics, pt: Point): void {
        g.setColor(CircuitElm.whiteColor);
        g.fillOval(pt.x - 3, pt.y - 3, 7, 7);
    }
    // set/adjust bounding box used for selecting elements.  getCircuitBounds() does not use this!
    setBbox$4(x1: number, y1: number, x2: number, y2: number): void {
        if (x1 > x2) {
            let q: number = x1;
            x1 = x2;
            x2 = q;
        }
        if (y1 > y2) {
            let q: number = y1;
            y1 = y2;
            y2 = q;
        }
        this.boundingBox.setBounds(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    }
    // set bounding box for an element from p1 to p2 with width w
    setBbox$3(p1: Point, p2: Point, w: number): void {
        this.setBbox$4(p1.x, p1.y, p2.x, p2.y);
        let dpx: number = toInt((this.dpx1 * w));
        let dpy: number = toInt((this.dpy1 * w));
        this.adjustBbox$4(p1.x + dpx, p1.y + dpy, p1.x - dpx, p1.y - dpy);
    }
    // enlarge bbox to contain an additional rectangle
    adjustBbox$4(x1: number, y1: number, x2: number, y2: number): void {
        if (x1 > x2) {
            let q: number = x1;
            x1 = x2;
            x2 = q;
        }
        if (y1 > y2) {
            let q: number = y1;
            y1 = y2;
            y2 = q;
        }
        x1 = CircuitElm.min(this.boundingBox.x, x1);
        y1 = CircuitElm.min(this.boundingBox.y, y1);
        x2 = CircuitElm.max(this.boundingBox.x + this.boundingBox.width, x2);
        y2 = CircuitElm.max(this.boundingBox.y + this.boundingBox.height, y2);
        this.boundingBox.setBounds(x1, y1, x2 - x1, y2 - y1);
    }
    adjustBbox$2(p1: Point, p2: Point): void {
        this.adjustBbox$4(p1.x, p1.y, p2.x, p2.y);
    }
    // needed for calculating circuit bounds (need to special-case centered text elements)
    isCenteredText(): boolean {
        return false;
    }
    drawCenteredText(g: Graphics, s: string, x: number, y: number, cx: boolean): void {
        // FontMetrics fm = g.getFontMetrics();
        //int w = fm.stringWidth(s);
        //    	int w=0;
        //	if (cx)
        //	    x -= w/2;
        //	g.drawString(s, x, y+fm.getAscent()/2);
        //	adjustBbox(x, y-fm.getAscent()/2,
        //		   x+w, y+fm.getAscent()/2+fm.getDescent());
        let w: number = toInt(g.context.measureText(s).getWidth());
        let h2: number = idiv(g.currentFontSize, 2);
        g.context.save();
        g.context.setTextBaseline("middle");
        if (cx) {
            g.context.setTextAlign("center");
            this.adjustBbox$4(x - idiv(w, 2), y - h2, x + idiv(w, 2), y + h2);
        } else {
            this.adjustBbox$4(x, y - h2, x + w, y + h2);
        }
        if (cx) {
            g.context.setTextAlign("center");
        }
        g.drawString(s, x, y);
        g.context.restore();
    }
    // draw component values (number of resistor ohms, etc).  hs = offset
    drawValues$3(g: Graphics, s: string, hs: number): void {
        if (s == null) {
            return;
        }
        g.setFont(CircuitElm.unitsFont);
        //FontMetrics fm = g.getFontMetrics();
        let w: number = toInt(g.context.measureText(s).getWidth());
        g.setColor(CircuitElm.whiteColor);
        let ya: number = idiv(g.currentFontSize, 2);
        let xc: number = 0, yc: number = 0;
        if (this instanceof RailElm || this instanceof SweepElm) {
            xc = this.x2;
            yc = this.y2;
        } else {
            xc = idiv((this.x2 + this.x), 2);
            yc = idiv((this.y2 + this.y), 2);
        }
        let dpx: number = toInt((this.dpx1 * hs));
        let dpy: number = toInt((this.dpy1 * hs));
        if (dpx === 0) {
            g.drawString(s, xc - idiv(w, 2), yc - CircuitElm.abs(dpy) - 2);
        } else {
            let xx: number = xc + CircuitElm.abs(dpx) + 2;
            if (this instanceof VoltageElm || (this.x < this.x2 && this.y > this.y2)) {
                xx = xc - (w + CircuitElm.abs(dpx) + 2);
            }
            g.drawString(s, xx, yc + dpy + ya);
        }
    }
    drawCoil(g: Graphics, hs: number, p1: Point, p2: Point, v1: number, v2: number): void {
        let len: number = CircuitElm.distance(p1, p2);
        g.context.save();
        g.context.setLineWidth(3.0);
        g.context.transform(((p2.x - p1.x)) / len, ((p2.y - p1.y)) / len, -((p2.y - p1.y)) / len, ((p2.x - p1.x)) / len, p1.x, p1.y);
        if (CircuitElm.sim.voltsCheckItem.getState()) {
            let grad: CanvasGradient = g.context.createLinearGradient(0, 0, len, 0);
            grad.addColorStop(0, this.getVoltageColor(g, v1).getHexValue());
            grad.addColorStop(1.0, this.getVoltageColor(g, v2).getHexValue());
            g.context.setStrokeStyle(grad);
        }
        g.context.setLineCap(LineCap.ROUND);
        g.context.scale(1, hs > 0 ? 1 : -1);
        let loop: number = 0;
        // draw more loops for a longer coil
        let loopCt: number = toInt(Math.ceil(len / 11));
        for (loop = 0; loop !== loopCt; loop++) {
            g.context.beginPath();
            let start: number = len * loop / loopCt;
            g.context.moveTo(start, 0);
            g.context.arc(len * (loop + .5) / loopCt, 0, len / (2 * loopCt), Math.PI, Math.PI * 2);
            g.context.lineTo(len * (loop + 1) / loopCt, 0);
            g.context.stroke();
        }
        g.context.restore();
    }
    static drawThickLine$5(g: Graphics, x: number, y: number, x2: number, y2: number): void {
        g.setLineWidth(3.0);
        g.drawLine(x, y, x2, y2);
        g.setLineWidth(1.0);
    }
    static drawThickLine$3(g: Graphics, pa: Point, pb: Point): void {
        g.setLineWidth(3.0);
        g.drawLine(pa.x, pa.y, pb.x, pb.y);
        g.setLineWidth(1.0);
    }
    static drawThickPolygon$4(g: Graphics, xs: number[], ys: number[], c: number): void {
        //	int i;
        //	for (i = 0; i != c-1; i++)
        //	    drawThickLine(g, xs[i], ys[i], xs[i+1], ys[i+1]);
        //	drawThickLine(g, xs[i], ys[i], xs[0], ys[0]);
        g.setLineWidth(3.0);
        g.drawPolyline(xs, ys, c);
        g.setLineWidth(1.0);
    }
    static drawThickPolygon$2(g: Graphics, p: Polygon): void {
        CircuitElm.drawThickPolygon$4(g, p.xpoints, p.ypoints, p.npoints);
    }
    static drawPolygon(g: Graphics, p: Polygon): void {
        g.drawPolyline(p.xpoints, p.ypoints, p.npoints);
        /*	int i;
	int xs[] = p.xpoints;
	int ys[] = p.ypoints;
	int np = p.npoints;
	np -= 3;
	for (i = 0; i != np-1; i++)
	    g.drawLine(xs[i], ys[i], xs[i+1], ys[i+1]);
	g.drawLine(xs[i], ys[i], xs[0], ys[0]);*/
    }
    static drawThickCircle(g: Graphics, cx: number, cy: number, ri: number): void {
        g.setLineWidth(3.0);
        g.context.beginPath();
        g.context.arc(cx, cy, ri * .98, 0, 2 * Math.PI);
        g.context.stroke();
        g.setLineWidth(1.0);
    }
    getSchmittPolygon(gsize: number, ctr: number): Polygon {
        let pts: Point[] = this.newPointArray(6);
        let hs: number = 3 * gsize;
        let h1: number = 3 * gsize;
        let h2: number = h1 * 2;
        let len: number = CircuitElm.distance(this.lead1, this.lead2);
        pts[0] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, ctr - h2 / len, hs);
        pts[1] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, ctr + h1 / len, hs);
        pts[2] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, ctr + h1 / len, -hs);
        pts[3] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, ctr + h2 / len, -hs);
        pts[4] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, ctr - h1 / len, -hs);
        pts[5] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, ctr - h1 / len, hs);
        return this.createPolygon$1(pts);
    }
    static getVoltageDText(v: number): string {
        return CircuitElm.getUnitText$2(Math.abs(v), "V");
    }
    static getVoltageText(v: number): string {
        return CircuitElm.getUnitText$2(v, "V");
    }
    static getTimeText(v: number): string {
        if (v >= 60) {
            let h: number = Math.floor(v / 3600);
            v -= 3600 * h;
            let m: number = Math.floor(v / 60);
            v -= 60 * m;
            if (h === 0) {
                return m + ":" + ((v >= 10) ? "" : "0") + CircuitElm.showFormat.format(v);
            }
            return h + ":" + ((m >= 10) ? "" : "0") + m + ":" + ((v >= 10) ? "" : "0") + CircuitElm.showFormat.format(v);
        }
        return CircuitElm.getUnitText$2(v, "s");
    }
    static format(v: number, sf: boolean): string {
        //	if (sf && Math.abs(v) > 10)
        //	    return shortFormat.format(Math.round(v));
        return (sf ? CircuitElm.shortFormat : CircuitElm.showFormat).format(v);
    }
    static getUnitText$2(v: number, u: string): string {
        return CircuitElm.getUnitText$3(v, u, false);
    }
    static getShortUnitText(v: number, u: string): string {
        return CircuitElm.getUnitText$3(v, u, true);
    }
    static getUnitText$3(v: number, u: string, sf: boolean): string {
        let sp: string = sf ? "" : " ";
        let va: number = Math.abs(v);
        if (va < 1e-14) {
            return "0" + sp + u;
        }
        if (va < 1e-9) {
            return CircuitElm.format(v * 1e12, sf) + sp + "p" + u;
        }
        if (va < 1e-6) {
            return CircuitElm.format(v * 1e9, sf) + sp + "n" + u;
        }
        if (va < 1e-3) {
            return CircuitElm.format(v * 1e6, sf) + sp + CirSim.muString + u;
        }
        if (va < 1) {
            return CircuitElm.format(v * 1e3, sf) + sp + "m" + u;
        }
        if (va < 1e3) {
            return CircuitElm.format(v, sf) + sp + u;
        }
        if (va < 1e6) {
            return CircuitElm.format(v * 1e-3, sf) + sp + "k" + u;
        }
        if (va < 1e9) {
            return CircuitElm.format(v * 1e-6, sf) + sp + "M" + u;
        }
        return CircuitElm.format(v * 1e-9, sf) + sp + "G" + u;
    }
    static getCurrentText(i: number): string {
        return CircuitElm.getUnitText$2(i, "A");
    }
    static getCurrentDText(i: number): string {
        return CircuitElm.getUnitText$2(Math.abs(i), "A");
    }
    static getUnitTextWithScale(val: number, utext: string, scale: number): string {
        if (scale === CircuitElm.SCALE_1) {
            return CircuitElm.showFormat.format(val) + " " + utext;
        }
        if (scale === CircuitElm.SCALE_M) {
            return CircuitElm.showFormat.format(1e3 * val) + " m" + utext;
        }
        if (scale === CircuitElm.SCALE_MU) {
            return CircuitElm.showFormat.format(1e6 * val) + " " + CirSim.muString + utext;
        }
        return CircuitElm.getUnitText$2(val, utext);
    }
    // update dot positions (curcount) for drawing current (simple case for single current)
    updateDotCount$0(): void {
        this.curcount = this.updateDotCount$2(this.current, this.curcount);
    }
    // update dot positions (curcount) for drawing current (general case for multiple currents)
    updateDotCount$2(cur: number, cc: number): number {
        if (!CircuitElm.sim.simIsRunning()) {
            return cc;
        }
        let cadd: number = cur * CircuitElm.currentMult;
        /*if (cur != 0 && cadd <= .05 && cadd >= -.05)
	  cadd = (cadd < 0) ? -.05 : .05;*/
        cadd %= 8;
        /*if (cadd > 8)
	  cadd = 8;
	  if (cadd < -8)
	  cadd = -8;*/
        return cc + cadd;
    }
    // update and draw current for simple two-terminal element
    doDots(g: Graphics): void {
        this.updateDotCount$0();
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.point2, this.curcount);
        }
    }
    doAdjust(): void {
    }
    setupAdjust(): void {
    }
    // get component info for display in lower right
    getInfo(arr: string[]): void {
    }
    getBasicInfo(arr: string[]): number {
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
        arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
        return 3;
    }
    getScopeText(v: number): string {
        let info: string[] = newArray(null, 10);
        this.getInfo(info);
        return info[0];
    }
    getVoltageColor(g: Graphics, volts: number): Color {
        if (this.needsHighlight()) {
            return (CircuitElm.selectColor);
        }
        if (!CircuitElm.sim.voltsCheckItem.getState()) {
            return (CircuitElm.whiteColor);
        }
        let c: number = toInt(((volts + CircuitElm.voltageRange) * (CircuitElm.colorScaleCount - 1) / (CircuitElm.voltageRange * 2)));
        if (c < 0) {
            c = 0;
        }
        if (c >= CircuitElm.colorScaleCount) {
            c = CircuitElm.colorScaleCount - 1;
        }
        return (CircuitElm.colorScale[c]);
    }
    setVoltageColor(g: Graphics, volts: number): void {
        g.setColor(this.getVoltageColor(g, volts));
    }
    // yellow argument is unused, can't remember why it was there
    setPowerColor$Graphics_bool(g: Graphics, yellow: boolean): void {
        /*if (conductanceCheckItem.getState()) {
	  setConductanceColor(g, current/getVoltageDiff());
	  return;
	  }*/
        if (!CircuitElm.sim.powerCheckItem.getState()) {
            return;
        }
        this.setPowerColor$Graphics_dbl(g, this.getPower());
    }
    setPowerColor$Graphics_dbl(g: Graphics, w0: number): void {
        if (!CircuitElm.sim.powerCheckItem.getState()) {
            return;
        }
        if (this.needsHighlight()) {
            g.setColor(CircuitElm.selectColor);
            return;
        }
        w0 *= CircuitElm.powerMult;
        //System.out.println(w);
        let i: number = toInt(((idiv(CircuitElm.colorScaleCount, 2)) + (idiv(CircuitElm.colorScaleCount, 2)) * -w0));
        if (i < 0) {
            i = 0;
        }
        if (i >= CircuitElm.colorScaleCount) {
            i = CircuitElm.colorScaleCount - 1;
        }
        g.setColor(CircuitElm.colorScale[i]);
    }
    setConductanceColor(g: Graphics, w0: number): void {
        w0 *= CircuitElm.powerMult;
        //System.out.println(w);
        let w: number = (w0 < 0) ? -w0 : w0;
        if (w > 1) {
            w = 1;
        }
        let rg: number = toInt((w * 255));
        g.setColor(new Color().init$int_int_int(rg, rg, rg));
    }
    getPower(): number {
        return this.getVoltageDiff() * this.current;
    }
    getScopeValue(x: number): number {
        return (x === Scope.VAL_CURRENT) ? this.getCurrent() : (x === Scope.VAL_POWER) ? this.getPower() : this.getVoltageDiff();
    }
    getScopeUnits(x: number): number {
        return (x === Scope.VAL_CURRENT) ? Scope.UNITS_A : (x === Scope.VAL_POWER) ? Scope.UNITS_W : Scope.UNITS_V;
    }
    getEditInfo(n: number): EditInfo {
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
    }
    // get number of nodes that can be retrieved by getConnectionNode()
    getConnectionNodeCount(): number {
        return this.getPostCount();
    }
    // get nodes that can be passed to getConnection(), to test if this element connects
    // those two nodes; this is the same as getNode() for all but labeled nodes.
    getConnectionNode(n: number): number {
        return this.getNode(n);
    }
    // are n1 and n2 connected by this element?  this is used to determine
    // unconnected nodes, and look for loops
    getConnection(n1: number, n2: number): boolean {
        return true;
    }
    // is n1 connected to ground somehow?
    hasGroundConnection(n1: number): boolean {
        return false;
    }
    // is this a wire or equivalent to a wire?
    isWire(): boolean {
        return false;
    }
    canViewInScope(): boolean {
        return this.getPostCount() <= 2;
    }
    comparePair(x1: number, x2: number, y1: number, y2: number): boolean {
        return ((x1 === y1 && x2 === y2) || (x1 === y2 && x2 === y1));
    }
    needsHighlight(): boolean {
        return CircuitElm.mouseElmRef === this || this.selected || CircuitElm.sim.plotYElm === this || (CircuitElm.mouseElmRef instanceof ScopeElm && ((CircuitElm.mouseElmRef as any as ScopeElm)).elmScope.getElm() === this);
    }
    isSelected(): boolean {
        return this.selected;
    }
    canShowValueInScope(v: number): boolean {
        return false;
    }
    setSelected(x: boolean): void {
        this.selected = x;
    }
    selectRect(r: Rectangle): void {
        this.selected = r.intersects(this.boundingBox);
    }
    static abs(x: number): number {
        return x < 0 ? -x : x;
    }
    static sign$1(x: number): number {
        return (x < 0) ? -1 : (x === 0) ? 0 : 1;
    }
    static min(a: number, b: number): number {
        return (a < b) ? a : b;
    }
    static max(a: number, b: number): number {
        return (a > b) ? a : b;
    }
    static distance(p1: Point, p2: Point): number {
        let x: number = p1.x - p2.x;
        let y: number = p1.y - p2.y;
        return Math.sqrt(x * x + y * y);
    }
    getBoundingBox(): Rectangle {
        return this.boundingBox;
    }
    needsShortcut(): boolean {
        return this.getShortcut() > 0;
    }
    getShortcut(): number {
        return 0;
    }
    isGraphicElmt(): boolean {
        return false;
    }
    setMouseElm(v: boolean): void {
        if (v) {
            CircuitElm.mouseElmRef = this;
        } else if (CircuitElm.mouseElmRef === this) {
            CircuitElm.mouseElmRef = null;
        }
    }
    draggingDone(): void {
    }
    dumpModel(): string {
        return null;
    }
    isMouseElm(): boolean {
        return CircuitElm.mouseElmRef === this;
    }
    updateModels$0(): void {
    }
    stepFinished(): void {
    }
    getCurrentIntoNode(n: number): number {
        // if we take out the getPostCount() == 2 it gives the wrong value for rails
        if (n === 0 && this.getPostCount() === 2) {
            return -this.current;
        } else {
            return this.current;
        }
    }
    flipPosts(): void {
        let oldx: number = this.x;
        let oldy: number = this.y;
        this.x = this.x2;
        this.y = this.y2;
        this.x2 = oldx;
        this.y2 = oldy;
        this.setPoints();
    }
    constructor() {}
}
Object.assign(CircuitElm.prototype, { "x": 0, "y": 0, "x2": 0, "y2": 0, "flags": 0, "nodes": null, "voltSource": 0, "dx": 0, "dy": 0, "dsign": 0, "lastHandleGrabbed": 0, "dn": 0, "dpx1": 0, "dpy1": 0, "point1": null, "point2": null, "lead1": null, "lead2": null, "volts": null, "current": 0, "curcount": 0, "boundingBox": null, "noDiagonal": false, "selected": false });
