// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from OpAmpRealElm.java to TypeScript.
/* eslint-disable */
import { CapacitorElm, Checkbox, Choice, CircuitElm, CompositeElm, EditInfo, Font, Graphics, Point, Polygon, ResistorElm, StringTokenizer, TransistorElm, newArray, parseJDouble, parseJInt, toInt } from '../core/internal';

export class OpAmpRealElm extends CompositeElm {
    // from https://commons.wikimedia.org/wiki/File:OpAmpTransistorLevel_Colored_Labeled.svg
    static model741String: string = "NTransistorElm 3 8 9\rNTransistorElm 2 8 10\rPTransistorElm 11 12 9\rPTransistorElm 11 13 10\rNTransistorElm 14 12 1\r" + "NTransistorElm 14 13 5\rNTransistorElm 12 7 14\rPTransistorElm 8 8 7\rPTransistorElm 8 11 7\rNTransistorElm 17 11 16\r" + "NTransistorElm 17 17 4\rPTransistorElm 18 18 7\rPTransistorElm 18 20 7\rNTransistorElm 20 7 25\rNTransistorElm 13 22 24\r" + "NTransistorElm 21 20 22\rNTransistorElm 25 20 6\rNTransistorElm 24 22 23\rPTransistorElm 22 4 15\rNTransistorElm 23 13 4\r" + "CapacitorElm 13 20\r" + "ResistorElm 15 6\rResistorElm 6 25\r" + "ResistorElm 4 1\rResistorElm 4 14\rResistorElm 4 5\rResistorElm 4 16\rResistorElm 4 24\rResistorElm 4 23\rResistorElm 17 18\r" + "ResistorElm 22 21\rResistorElm 21 20\r";
    static model741ExternalNodes: number[] = [2, 3, 6, 7, 4];
    // , 1, 5 };
    // 0 = input -, 1 = input +, 2 = output, 3 = V+, 4 = V-, 5, 6 = offset null
    static lm324ModelString: string = "TransistorElm 1 2 3\rCurrentElm 4 3\rTransistorElm 2 2 5\rTransistorElm 2 6 5\rCapacitorElm 6 7\rCurrentElm 4 8\rCurrentElm 4 7\rTransistorElm 8 4 9\r" + "TransistorElm 7 4 10\rTransistorElm 10 4 11\rTransistorElm 11 7 12\rResistorElm 11 12\rTransistorElm 7 5 12\rCurrentElm 12 5\rTransistorElm 6 5 8\r" + "ResistorElm 9 5\rTransistorElm 9 7 5\rTransistorElm 13 6 3";
    static lm324ExternalNodes: number[] = [1, 13, 12, 4, 5];
    static lm324ModelDump: string = "0 -1 -0 0 10000/0 0.000006/0 1 0 0 100/0 1 0 0 100/0 1e-11 0/0 0.000004/0 0.0001/0 1 0 0 100/0 1 0 0 100/0 1 0 0 100/0 1 0 0 100/0 25/0 -1 0 0 100/0 0.00005/" + "0 -1 0 0 100/0 10000/0 1 0 0 100/0 -1 0 0 10000";
    static MODEL_741: number = 0;
    static MODEL_324: number = 1;
    static model741resistances: number[] = [50, 25, 1e3, 50e3, 1e3, 5e3, 50e3, 50, 39e3, 7500, 4500];
    declare modelType: number;
    declare opheight: number;
    declare opwidth: number;
    declare curCounts: number[];
    declare slewRate: number;
    declare currentLimit: number;
    declare capValue: number;
    declare defaultCurrentLimit: number;
    declare FLAG_SWAP: number;
    init$2(xx: number, yy: number): this {
        CompositeElm.prototype.init$2.call(this, xx, yy);
        // , model741String, model741ExternalNodes);
        this.noDiagonal = true;
        this.slewRate = .6;
        this.currentLimit = this.defaultCurrentLimit;
        this.modelType = OpAmpRealElm.MODEL_741;
        this.initModel();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CompositeElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        // , null, model741String, model741ExternalNodes);
        this.noDiagonal = true;
        this.slewRate = parseJDouble(st.nextToken$0());
        this.capValue = parseJDouble(st.nextToken$0());
        this.currentLimit = this.defaultCurrentLimit;
        this.modelType = OpAmpRealElm.MODEL_741;
        try {
            this.currentLimit = parseJDouble(st.nextToken$0());
            this.modelType = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        this.initModel();
        return this;
    }
    initModel(): void {
        this.flags |= this.FLAG_ESCAPE;
        if (this.modelType === OpAmpRealElm.MODEL_741) {
            this.init741();
        } else {
            this.init324();
        }
        this.curCounts = newArray(0, 5);
        this.setPoints();
    }
    init741(): void {
        this.loadComposite(null, OpAmpRealElm.model741String, OpAmpRealElm.model741ExternalNodes);
        // adjust capacitor value to get desired slew rate
        this.getCapacitor().capacitance = 30e-12 / (this.slewRate / .6);
        this.getCapacitor().voltdiff = this.capValue;
        // set resistor values
        let i: number = 0;
        for (i = 0; i !== 11; i++) {
            ((this.compElmList.get(21 + i) as any as ResistorElm)).resistance = OpAmpRealElm.model741resistances[i];
        }
        // adjust output stage resistor values and transistor betas to increase current if desired
        let currentMult: number = this.currentLimit / this.defaultCurrentLimit;
        ((this.compElmList.get(21) as any as ResistorElm)).resistance /= currentMult;
        ((this.compElmList.get(22) as any as ResistorElm)).resistance /= currentMult;
        ((this.compElmList.get(13) as any as TransistorElm)).setBeta(currentMult * 100);
        // Q14
        ((this.compElmList.get(18) as any as TransistorElm)).setBeta(currentMult * 100);
        // Q20
    }
    init324(): void {
        let st: StringTokenizer = new StringTokenizer().init$2(OpAmpRealElm.lm324ModelDump, "/");
        this.loadComposite(st, OpAmpRealElm.lm324ModelString, OpAmpRealElm.lm324ExternalNodes);
        // adjust capacitor value to get desired slew rate
        this.getCapacitor().capacitance = 10e-12 / (this.slewRate / .55);
        this.getCapacitor().voltdiff = this.capValue;
        // adjust output stage resistor values and transistor betas to increase current if desired
        let currentMult: number = this.currentLimit / this.defaultCurrentLimit;
        ((this.compElmList.get(11) as any as ResistorElm)).resistance /= currentMult;
        ((this.compElmList.get(9) as any as TransistorElm)).setBeta(currentMult * 100);
        ((this.compElmList.get(10) as any as TransistorElm)).setBeta(currentMult * 100);
        ((this.compElmList.get(12) as any as TransistorElm)).setBeta(currentMult * 100);
        ((this.compElmList.get(16) as any as TransistorElm)).setBeta(currentMult * 100);
    }
    reset(): void {
        super.reset();
        this.curCounts = newArray(0, 5);
    }
    getCapacitor(): CapacitorElm {
        return ((this.compElmList.get(this.modelType === OpAmpRealElm.MODEL_741 ? 20 : 4) as any as CapacitorElm));
    }
    dump(): string {
        return super.dumpWithMask(0) + " " + this.slewRate + " " + this.getCapacitor().voltdiff + " " + this.currentLimit + " " + this.modelType;
    }
    getConnection(n1: number, n2: number): boolean {
        return true;
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.opheight * 2);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.in1p[0], this.in1p[1]);
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.in2p[0], this.in2p[1]);
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.lead2, this.point2);
        this.setVoltageColor(g, this.volts[3]);
        CircuitElm.drawThickLine$3(g, this.rail1p[0], this.rail1p[1]);
        this.setVoltageColor(g, this.volts[4]);
        CircuitElm.drawThickLine$3(g, this.rail2p[0], this.rail2p[1]);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickPolygon$2(g, this.triangle);
        g.setFont(this.plusFont);
        this.drawCenteredText(g, "-", this.textp[0].x, this.textp[0].y - 2, true);
        this.drawCenteredText(g, "+", this.textp[1].x, this.textp[1].y, true);
        let i: number = 0;
        for (i = 0; i !== 5; i++) {
            this.curCounts[i] = this.updateDotCount$2(this.getCurrentIntoNode(i), this.curCounts[i]);
        }
        this.drawDots(g, this.in1p[1], this.in1p[0], this.curCounts[0]);
        this.drawDots(g, this.in2p[1], this.in2p[0], this.curCounts[1]);
        this.drawDots(g, this.lead2, this.point2, this.curCounts[2]);
        // these two segments may not be an event multiple of gridSize so we draw them the other way so the dots line up
        this.drawDots(g, this.rail1p[0], this.rail1p[1], -this.curCounts[3]);
        this.drawDots(g, this.rail2p[0], this.rail2p[1], -this.curCounts[4]);
        this.drawPosts(g);
    }
    declare in1p: Point[];
    declare in2p: Point[];
    declare textp: Point[];
    declare rail1p: Point[];
    declare rail2p: Point[];
    declare triangle: Polygon;
    declare plusFont: Font;
    setPoints(): void {
        super.setPoints();
        let ww: number = this.opwidth;
        if (ww > this.dn / 2) {
            ww = toInt((this.dn / 2));
        }
        this.calcLeads(ww * 2);
        let hs: number = this.opheight * this.dsign;
        let hsswap: number = hs;
        if ((this.flags & this.FLAG_SWAP) !== 0) {
            hsswap = -hsswap;
        }
        this.in1p = this.newPointArray(2);
        this.in2p = this.newPointArray(2);
        this.textp = this.newPointArray(2);
        this.rail1p = this.newPointArray(2);
        this.rail2p = this.newPointArray(2);
        this.interpPoint2(this.point1, this.point2, this.in1p[0], this.in2p[0], 0, hsswap);
        this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hsswap);
        this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], .2, hsswap);
        // position rails; ideally in middle, but may need to be off-center to fit grid
        let railPos: number = .5 - ((this.dn / 2) % CircuitElm.sim.gridSize) / (ww * 2);
        this.interpPoint2(this.lead1, this.lead2, this.rail1p[1], this.rail2p[1], railPos, hs * 2 * (1 - railPos));
        this.interpPoint2(this.lead1, this.lead2, this.rail1p[0], this.rail2p[0], railPos, hs * 2);
        let tris: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, hs * 2);
        this.triangle = this.createPolygon$3(tris[0], tris[1], this.lead2);
        this.plusFont = new Font().init$3("SansSerif", 0, 14);
        this.setPost$2(0, this.in1p[0]);
        this.setPost$2(1, this.in2p[0]);
        this.setPost$2(2, this.point2);
        this.setPost$2(3, this.rail1p[0]);
        this.setPost$2(4, this.rail2p[0]);
    }
    getDumpType(): number {
        return 409;
    }
    getInfo(arr: string[]): void {
        let type: string = (this.modelType === OpAmpRealElm.MODEL_741) ? "LM741" : "LM324";
        arr[0] = "op-amp (" + type + ")";
        arr[1] = "V+ = " + CircuitElm.getVoltageText(this.volts[1]);
        arr[2] = "V- = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[3] = "Vout = " + CircuitElm.getVoltageText(this.volts[2]);
        arr[4] = "Iout = " + CircuitElm.getCurrentText(this.getCurrentIntoNode(2));
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Slew Rate (V/usec)", this.slewRate);
        }
        if (n === 1) {
            return new EditInfo("Output Current Limit (A)", this.currentLimit);
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Swap Inputs", (this.flags & this.FLAG_SWAP) !== 0);
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo(EditInfo.makeLink("opampreal.html", "Model"), this.modelType);
            ei.choice = new Choice();
            ei.choice.add("LM741");
            ei.choice.add("LM324");
            ei.choice.select(this.modelType);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.slewRate = ei.value;
            this.initModel();
        }
        if (n === 1) {
            this.currentLimit = ei.value;
            this.initModel();
        }
        if (n === 2) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_SWAP);
            this.setPoints();
        }
        if (n === 3) {
            this.modelType = ei.choice.getSelectedIndex();
            this.capValue = 0;
            this.initModel();
        }
    }
}
Object.assign(OpAmpRealElm.prototype, { "modelType": 0, "opheight": 16, "opwidth": 32, "curCounts": null, "slewRate": 0, "currentLimit": 0, "capValue": 0, "defaultCurrentLimit": .0231, "FLAG_SWAP": 2, "in1p": null, "in2p": null, "textp": null, "rail1p": null, "rail2p": null, "triangle": null, "plusFont": null });
