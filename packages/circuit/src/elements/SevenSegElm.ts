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

// Changed 2026-10-31: converted from SevenSegElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, Choice, CircuitElm, Color, Diode, DiodeModel, EditInfo, Graphics, Point, StringTokenizer, idiv, newArray, parseJInt, toChar, toInt } from '../core/internal';

export class SevenSegElm extends ChipElm {
    // base segment count not including decimal point or colon
    declare baseSegmentCount: number;
    // segment count including decimal point or colon
    declare segmentCount: number;
    declare extraSegment: number;
    static ES_NONE: number = 0;
    static ES_DP: number = 1;
    static ES_COLON: number = 2;
    declare pinCount: number;
    declare commonPin: number;
    // 1 = common cathode, -1 = common anode, 0 = no diodes
    declare diodeDirection: number;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.setDefaults();
        this.setPinCount();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.setDefaults();
        try {
            this.baseSegmentCount = parseJInt(st.nextToken$0());
            this.extraSegment = parseJInt(st.nextToken$0());
            this.diodeDirection = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        this.setPinCount();
        return this;
    }
    setDefaults(): void {
        this.baseSegmentCount = this.segmentCount = 7;
        this.diodeDirection = 0;
    }
    dump(): string {
        return super.dump() + " " + this.baseSegmentCount + " " + this.extraSegment + " " + this.diodeDirection;
    }
    getChipName(): string {
        return this.segmentCount + "-segment display";
    }
    declare darkred: Color;
    setupPins(): void {
        if (this.pinCount === 0) {
            return;
        }
        this.darkred = new Color().init$int_int_int(30, 0, 0);
        let segmentPinsOnLeftSide: number = idiv((this.baseSegmentCount + 1), 2);
        this.sizeY = segmentPinsOnLeftSide;
        if (this.baseSegmentCount === 7) {
            this.sizeX = 4;
            if (this.pinCount > 7) {
                this.sizeX = 5;
            }
        } else {
            this.sizeX = 5;
        }
        // make room for common/dp/colon pins
        if (this.pinCount > this.sizeY * 2) {
            this.sizeY++;
        }
        this.pins = newArray(null, this.pinCount);
        let i: number = 0;
        for (i = 0; i !== segmentPinsOnLeftSide; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_W, String.fromCharCode(toChar((97 + i))));
        }
        // retain backward compatibility pin layout for old 7-segment setup, otherwise put pins on left and right side
        let backwardCompatibility: boolean = (this.segmentCount === 7 && this.diodeDirection === 0 && this.extraSegment === SevenSegElm.ES_NONE);
        let s: number = (backwardCompatibility) ? 1 : 0;
        for (; i !== this.segmentCount; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, s++, backwardCompatibility ? ChipElm.SIDE_S : ChipElm.SIDE_E, String.fromCharCode(toChar((97 + i))));
        }
        if (this.extraSegment === SevenSegElm.ES_DP) {
            this.pins[this.segmentCount - 1].text = "dp";
        }
        if (this.commonPin > 0) {
            let side: number = ChipElm.SIDE_E;
            if (this.segmentCount !== 7) {
                side = ChipElm.SIDE_W;
                s = segmentPinsOnLeftSide;
            }
            this.pins[this.commonPin] = new ChipElm_Pin().init$3(this, s++, side, (this.diodeDirection === 1) ? "gnd" : "Vcc");
        }
    }
    drawSegment$5(g: Graphics, x1: number, y1: number, x2: number, y2: number): void {
        this.drawSegment$3(g, new Point().init$2(x1, y1), new Point().init$2(x2, y2));
    }
    drawSegment$3(g: Graphics, p1: Point, p2: Point): void {
        g.context.beginPath();
        let p3: Point = new Point().init$0();
        let p4: Point = new Point().init$0();
        let p5: Point = new Point().init$0();
        let p6: Point = new Point().init$0();
        let dn: number = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        // from p1 to p2, calculate points 5 pixels from each end, 5 pixels offset from center of line on both sides
        this.interpPoint2(p1, p2, p3, p4, 5 / dn, 5);
        this.interpPoint2(p1, p2, p5, p6, 1 - 5 / dn, 5);
        g.context.moveTo(p1.x, p1.y);
        g.context.lineTo(p3.x, p3.y);
        g.context.lineTo(p5.x, p5.y);
        g.context.lineTo(p2.x, p2.y);
        g.context.lineTo(p6.x, p6.y);
        g.context.lineTo(p4.x, p4.y);
        g.context.lineTo(p1.x, p1.y);
        g.context.fill();
    }
    drawDecimal(g: Graphics, x: number, y: number): void {
        let sp: number = 7;
        g.context.beginPath();
        g.context.moveTo(x, y - sp);
        g.context.lineTo(x - sp, y);
        g.context.lineTo(x, y + sp);
        g.context.lineTo(x + sp, y);
        g.context.lineTo(x, y - sp);
        g.context.fill();
    }
    static display7: number[] = [0, 0, 2, 0, 2, 0, 2, 1, 2, 1, 2, 2, 0, 2, 2, 2, 0, 1, 0, 2, 0, 0, 0, 1, 0, 1, 2, 1];
    static display16: number[] = [0, 0, 1, 0, 1, 0, 2, 0, 2, 0, 2, 1, 2, 1, 2, 2, 2, 2, 1, 2, 1, 2, 0, 2, 0, 2, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 2, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 1, 1, 0, 2, 0, 1, 1, 1];
    static display14: number[] = [0, 0, 2, 0, 2, 0, 2, 1, 2, 1, 2, 2, 2, 2, 0, 2, 0, 2, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 2, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 1, 1, 0, 2, 0, 1, 1, 1];
    declare diodes: Diode[];
    stamp(): void {
        super.stamp();
        if (this.diodeDirection === 0) {
            return;
        }
        this.diodes = newArray(null, this.segmentCount);
        let i: number = 0;
        let model: DiodeModel = DiodeModel.getModelWithName("default-led");
        for (i = 0; i !== this.segmentCount; i++) {
            this.diodes[i] = new Diode().init$1(CircuitElm.sim);
            this.diodes[i].setup(model);
            if (this.diodeDirection === 1) {
                this.diodes[i].stamp(this.nodes[i], this.nodes[this.commonPin]);
            } else {
                this.diodes[i].stamp(this.nodes[this.commonPin], this.nodes[i]);
            }
        }
    }
    doStep(): void {
        super.doStep();
        if (this.diodeDirection === 0) {
            return;
        }
        let i: number = 0;
        for (i = 0; i !== this.segmentCount; i++) {
            this.diodes[i].doStep(this.diodeDirection * (this.volts[i] - this.volts[this.commonPin]));
        }
    }
    nonLinear(): boolean {
        return this.diodeDirection !== 0;
    }
    draw(g: Graphics): void {
        this.drawChip(g);
        g.setColor(Color.red);
        let spx: number = this.cspc * 2;
        // make room for dp/colon
        if (this.extraSegment !== SevenSegElm.ES_NONE) {
            spx = toInt((spx * .9));
        }
        if (this.sizeY <= 4) {
            spx = idiv(spx, 2);
        }
        let spy: number = spx * 2;
        let xl: number = this.x + this.cspc + this.sizeX * this.cspc - spx;
        let yl: number = this.y - this.cspc + this.sizeY * this.cspc - spy;
        let i: number = 0;
        let disp: number[] = (this.baseSegmentCount === 7) ? SevenSegElm.display7 : (this.baseSegmentCount === 14) ? SevenSegElm.display14 : SevenSegElm.display16;
        let step: number = 0;
        for (step = 0; step !== 2; step++) {
            for (i = 0; i !== this.segmentCount; i++) {
                let i4: number = i * 4;
                // draw diagonal lines in first pass, so the other lines overlap
                let diag: boolean = (disp[i4] !== disp[i4 + 2] && disp[i4 + 1] !== disp[i4 + 3]);
                if (diag !== (step === 0)) {
                    continue;
                }
                this.setColor(g, i);
                this.drawSegment$5(g, xl + disp[i4] * spx, yl + disp[i4 + 1] * spy, xl + disp[i4 + 2] * spx, yl + disp[i4 + 3] * spy);
            }
        }
        if (this.extraSegment === SevenSegElm.ES_DP) {
            this.setColor(g, this.baseSegmentCount);
            let dist: number = toInt(Math.max(spx * 1.5, spx + 12));
            this.drawDecimal(g, xl + spx + dist, yl + spy * 2);
        }
        if (this.extraSegment === SevenSegElm.ES_COLON) {
            this.setColor(g, this.baseSegmentCount);
            let dist: number = toInt(Math.max(spx * 1.5, spx + 14));
            this.drawDecimal(g, xl + spx + dist, yl + toInt((spy * .5)));
            this.drawDecimal(g, xl + spx + dist, yl + toInt((spy * 1.5)));
        }
    }
    calculateCurrent(): void {
        if (this.diodeDirection === 0) {
            // no current
            let i: number = 0;
            for (i = 0; i !== this.pinCount; i++) {
                this.pins[i].current = 0;
            }
            return;
        }
        // calculate diode currents
        let i: number = 0;
        this.pins[this.commonPin].current = 0;
        for (i = 0; i !== this.segmentCount; i++) {
            this.pins[i].current = -this.diodeDirection * this.diodes[i].calculateCurrent(this.diodeDirection * (this.volts[i] - this.volts[this.commonPin]));
            this.pins[this.commonPin].current -= this.pins[i].current;
        }
    }
    stepFinished(): void {
        // stop for huge currents that make simulator act weird
        if (this.commonPin > 0 && Math.abs(this.pins[this.commonPin].current) > 1e12) {
            CircuitElm.sim.stop("max current exceeded", this);
        }
    }
    setColor(g: Graphics, p: number): void {
        if (this.diodeDirection === 0) {
            g.setColor(this.pins[p].value ? Color.red : CircuitElm.sim.printableCheckItem.getState() ? Color.white : this.darkred);
            return;
        }
        // 10mA current = max brightness
        let w: number = -this.diodeDirection * this.pins[p].current / .01;
        if (w > 0) {
            w = 255 * (1 + .2 * Math.log(w));
        }
        if (w > 255) {
            w = 255;
        }
        if (w < 30) {
            w = 30;
        }
        let cc: Color = new Color().init$int_int_int(toInt(w), 0, 0);
        g.setColor(cc);
    }
    getPostCount(): number {
        return this.pinCount;
    }
    getVoltageSourceCount(): number {
        return 0;
    }
    getDumpType(): number {
        return 157;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            let ei: EditInfo = new EditInfo("Segments", 0, -1, -1);
            ei.choice = new Choice();
            ei.choice.add("7 Segment");
            ei.choice.add("14 Segment");
            ei.choice.add("16 Segment");
            ei.choice.select(this.baseSegmentCount === 7 ? 0 : this.baseSegmentCount === 14 ? 1 : 2);
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("Extra Segment", 0, -1, -1);
            ei.choice = new Choice();
            ei.choice.add("None");
            ei.choice.add("Decimal Point");
            ei.choice.add("Colon");
            ei.choice.select(this.extraSegment);
            return ei;
        }
        if (n === 4) {
            let ei: EditInfo = new EditInfo("Diodes", 0, -1, -1);
            ei.choice = new Choice();
            ei.choice.add("Common Cathode");
            ei.choice.add("Common Anode");
            ei.choice.add("None (logic inputs)");
            ei.choice.select(this.diodeDirection === 1 ? 0 : this.diodeDirection === -1 ? 1 : 2);
            return ei;
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2) {
            let ix: number = ei.choice.getSelectedIndex();
            this.baseSegmentCount = (ix === 0) ? 7 : (ix === 1) ? 14 : 16;
            this.setPinCount();
            return;
        }
        if (n === 3) {
            this.extraSegment = ei.choice.getSelectedIndex();
            this.setPinCount();
            return;
        }
        if (n === 4) {
            let ix: number = ei.choice.getSelectedIndex();
            this.diodeDirection = (ix === 0) ? 1 : (ix === 1) ? -1 : 0;
            this.setPinCount();
            return;
        }
        super.setEditValue(n, ei);
    }
    setPinCount(): void {
        this.segmentCount = this.baseSegmentCount;
        if (this.extraSegment > 0) {
            this.segmentCount++;
        }
        if (this.diodeDirection === 0) {
            this.pinCount = this.segmentCount;
            this.commonPin = -1;
        } else {
            this.pinCount = this.segmentCount + 1;
            this.commonPin = this.pinCount - 1;
        }
        this.allocNodes();
        this.setupPins();
        this.setPoints();
    }
}
Object.assign(SevenSegElm.prototype, { "baseSegmentCount": 0, "segmentCount": 0, "extraSegment": 0, "pinCount": 0, "commonPin": 0, "diodeDirection": 0, "darkred": null, "diodes": null });
