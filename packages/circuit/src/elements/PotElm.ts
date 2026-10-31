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

// Changed 2026-10-31: converted from PotElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CirSim, CircuitElm, EditInfo, Graphics, Label, MouseWheelEvent, Point, Scrollbar, StringTokenizer, idiv, parseJDouble, toInt } from '../core/internal';

export class PotElm extends CircuitElm {
    declare FLAG_SHOW_VALUES: number;
    declare position: number;
    declare maxResistance: number;
    declare resistance1: number;
    declare resistance2: number;
    declare current1: number;
    declare current2: number;
    declare current3: number;
    declare curcount1: number;
    declare curcount2: number;
    declare curcount3: number;
    declare slider: Scrollbar;
    declare label: Label;
    declare sliderText: string;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.setup();
        this.maxResistance = 1000;
        this.position = .5;
        this.sliderText = "Resistance";
        this.flags = this.FLAG_SHOW_VALUES;
        this.createSlider();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.maxResistance = parseJDouble(st.nextToken$0());
        this.position = parseJDouble(st.nextToken$0());
        this.sliderText = st.nextToken$0();
        while (st.hasMoreTokens()) {
            this.sliderText += String.fromCharCode(32) + st.nextToken$0();
        }
        this.createSlider();
        return this;
    }
    setup(): void {
    }
    getPostCount(): number {
        return 3;
    }
    getDumpType(): number {
        return 174;
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.point2 : this.post3;
    }
    dump(): string {
        return super.dump() + " " + this.maxResistance + " " + this.position + " " + this.sliderText;
    }
    createSlider(): void {
        CircuitElm.sim.addWidgetToVerticalPanel(this.label = new Label(this.sliderText));
        this.label.addStyleName("topSpace");
        let value: number = toInt((this.position * 100));
        CircuitElm.sim.addWidgetToVerticalPanel(this.slider = new Scrollbar(Scrollbar.HORIZONTAL, value, 1, 0, 101, this, this));
        // 	sim.verticalPanel.validate();
        // 	slider.addAdjustmentListener(this);
    }
    execute(): void {
        CircuitElm.sim.analyzeFlag = true;
        this.setPoints();
    }
    delete(): void {
        CircuitElm.sim.removeWidgetFromVerticalPanel(this.label);
        CircuitElm.sim.removeWidgetFromVerticalPanel(this.slider);
        super.delete();
    }
    declare post3: Point;
    declare corner2: Point;
    declare arrowPoint: Point;
    declare midpoint: Point;
    declare arrow1: Point;
    declare arrow2: Point;
    declare ps3: Point;
    declare ps4: Point;
    declare bodyLen: number;
    setPoints(): void {
        super.setPoints();
        let offset: number = 0;
        let myLen: number = 0;
        if (CircuitElm.abs(this.dx) > CircuitElm.abs(this.dy)) {
            myLen = 2 * CircuitElm.sim.gridSize * Math.sign(this.dx) * (idiv((((Math.abs(this.dx) as number)) + 2 * CircuitElm.sim.gridSize - 1), (2 * CircuitElm.sim.gridSize)));
            this.point2.x = this.point1.x + myLen;
            offset = (this.dx < 0) ? this.dy : -this.dy;
            this.point2.y = this.point1.y;
        } else {
            myLen = 2 * CircuitElm.sim.gridSize * Math.sign(this.dy) * (idiv((((Math.abs(this.dy) as number)) + 2 * CircuitElm.sim.gridSize - 1), (2 * CircuitElm.sim.gridSize)));
            if (this.dy !== 0) {
                this.point2.y = this.point1.y + myLen;
                offset = (this.dy > 0) ? this.dx : -this.dx;
                this.point2.x = this.point1.x;
            }
        }
        //	if (abs(dx) > abs(dy)) {
        //	    dx = Integer.signum(dx) * sim.snapGrid(Math.abs(dx) / 2) * 2;
        //	    point2.x = x2 = point1.x + dx;
        //	    offset = (dx < 0) ? dy : -dy;
        //	    point2.y = point1.y;
        //	} else {
        //	    dy = Integer.signum(dy) * sim.snapGrid(Math.abs(dy) / 2) * 2;
        //	    if (dy != 0) {
        //		point2.y = y2 = point1.y + dy;
        //		offset = (dy > 0) ? dx : -dx;
        //		point2.x = point1.x;
        //	    }
        //	}
        if (offset === 0) {
            offset = CircuitElm.sim.gridSize;
        }
        this.dn = CircuitElm.distance(this.point1, this.point2);
        let bodyLen: number = 32;
        this.calcLeads(bodyLen);
        this.position = this.slider.getValue() * .0099 + .005;
        let soff: number = toInt(((this.position - .5) * bodyLen));
        // int offset2 = offset - sign(offset)*4;
        this.post3 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, .5, offset);
        this.corner2 = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, soff / this.dn + .5, offset);
        this.arrowPoint = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, soff / this.dn + .5, 8 * CircuitElm.sign$1(offset));
        this.midpoint = this.interpPoint$3(this.point1, this.point2, soff / this.dn + .5);
        this.arrow1 = new Point().init$0();
        this.arrow2 = new Point().init$0();
        let clen: number = CircuitElm.abs(offset) - 8;
        this.interpPoint2(this.corner2, this.arrowPoint, this.arrow1, this.arrow2, (clen - 8) / clen, 8);
        this.ps3 = new Point().init$0();
        this.ps4 = new Point().init$0();
    }
    draw(g: Graphics): void {
        let segments: number = 16;
        let i: number = 0;
        let ox: number = 0;
        let hs: number = CircuitElm.sim.euroResistorCheckItem.getState() ? 6 : 8;
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        let v3: number = this.volts[2];
        this.setBbox$3(this.point1, this.point2, hs);
        this.draw2Leads(g);
        this.setPowerColor$Graphics_bool(g, true);
        let segf: number = 1. / segments;
        let divide: number = toInt((segments * this.position));
        if (!CircuitElm.sim.euroResistorCheckItem.getState()) {
            // draw zigzag
            for (i = 0; i !== segments; i++) {
                let nx: number = 0;
                switch (i & 3) {
                    case 0:
                        nx = 1;
                        break;
                    case 2:
                        nx = -1;
                        break;
                    default:
                        nx = 0;
                        break;
                }
                let v: number = v1 + (v3 - v1) * i / divide;
                if (i >= divide) {
                    v = v3 + (v2 - v3) * (i - divide) / (segments - divide);
                }
                this.setVoltageColor(g, v);
                this.interpPoint$5(this.lead1, this.lead2, CircuitElm.ps1, i * segf, hs * ox);
                this.interpPoint$5(this.lead1, this.lead2, CircuitElm.ps2, (i + 1) * segf, hs * nx);
                CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
                ox = nx;
            }
        } else {
            // draw rectangle
            this.setVoltageColor(g, v1);
            this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 0, hs);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            for (i = 0; i !== segments; i++) {
                let v: number = v1 + (v3 - v1) * i / divide;
                if (i >= divide) {
                    v = v3 + (v2 - v3) * (i - divide) / (segments - divide);
                }
                this.setVoltageColor(g, v);
                this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, i * segf, hs);
                this.interpPoint2(this.lead1, this.lead2, this.ps3, this.ps4, (i + 1) * segf, hs);
                CircuitElm.drawThickLine$3(g, CircuitElm.ps1, this.ps3);
                CircuitElm.drawThickLine$3(g, CircuitElm.ps2, this.ps4);
            }
            this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 1, hs);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
        }
        this.setVoltageColor(g, v3);
        CircuitElm.drawThickLine$3(g, this.post3, this.corner2);
        CircuitElm.drawThickLine$3(g, this.corner2, this.arrowPoint);
        CircuitElm.drawThickLine$3(g, this.arrow1, this.arrowPoint);
        CircuitElm.drawThickLine$3(g, this.arrow2, this.arrowPoint);
        this.curcount1 = this.updateDotCount$2(this.current1, this.curcount1);
        this.curcount2 = this.updateDotCount$2(this.current2, this.curcount2);
        this.curcount3 = this.updateDotCount$2(this.current3, this.curcount3);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.midpoint, this.curcount1);
            this.drawDots(g, this.point2, this.midpoint, this.curcount2);
            this.drawDots(g, this.post3, this.corner2, this.curcount3);
            this.drawDots(g, this.corner2, this.midpoint, this.curcount3 + CircuitElm.distance(this.post3, this.corner2));
        }
        this.drawPosts(g);
        if (CircuitElm.sim.showValuesCheckItem.getState() && this.resistance1 > 0 && (this.flags & this.FLAG_SHOW_VALUES) !== 0) {
            // check for vertical pot with 3rd terminal on left
            let reverseY: boolean = (this.post3.x < this.lead1.x && this.lead1.x === this.lead2.x);
            // check for horizontal pot with 3rd terminal on top
            let reverseX: boolean = (this.post3.y < this.lead1.y && this.lead1.x !== this.lead2.x);
            // check if we need to swap texts (if leads are reversed, e.g. drawn right to left)
            let rev: boolean = (this.lead1.x === this.lead2.x && this.lead1.y < this.lead2.y) || (this.lead1.y === this.lead2.y && this.lead1.x > this.lead2.x);
            // draw units
            let s1: string = CircuitElm.getShortUnitText(rev ? this.resistance2 : this.resistance1, "");
            let s2: string = CircuitElm.getShortUnitText(rev ? this.resistance1 : this.resistance2, "");
            g.setFont(CircuitElm.unitsFont);
            g.setColor(CircuitElm.whiteColor);
            let ya: number = idiv(g.currentFontSize, 2);
            let w: number = 0;
            w = toInt(g.context.measureText(s1).getWidth());
            // vertical?
            if (this.lead1.x === this.lead2.x) {
                g.drawString(s1, !reverseY ? this.arrowPoint.x + 2 : this.arrowPoint.x - 2 - w, Math.max(this.arrow1.y, this.arrow2.y) + 5 + ya);
            } else {
                g.drawString(s1, Math.min(this.arrow1.x, this.arrow2.x) - 2 - w, !reverseX ? this.arrowPoint.y + 4 + ya : this.arrowPoint.y - 4);
            }
            w = toInt(g.context.measureText(s2).getWidth());
            if (this.lead1.x === this.lead2.x) {
                g.drawString(s2, !reverseY ? this.arrowPoint.x + 2 : this.arrowPoint.x - 2 - w, Math.min(this.arrow1.y, this.arrow2.y) - 3);
            } else {
                g.drawString(s2, Math.max(this.arrow1.x, this.arrow2.x) + 2, !reverseX ? this.arrowPoint.y + 4 + ya : this.arrowPoint.y - 4);
            }
        }
    }
    // draw component values (number of resistor ohms, etc).  hs = offset
    drawValues$4(g: Graphics, s: string, pt: Point, hs: number): void {
        if (s == null) {
            return;
        }
        g.setFont(CircuitElm.unitsFont);
        //FontMetrics fm = g.getFontMetrics();
        let w: number = toInt(g.context.measureText(s).getWidth());
        g.setColor(CircuitElm.whiteColor);
        let ya: number = idiv(g.currentFontSize, 2);
        let xc: number = pt.x;
        let yc: number = pt.y;
        let dpx: number = hs;
        let dpy: number = 0;
        if (this.lead1.x !== this.lead2.x) {
            dpx = 0;
            dpy = -hs;
        }
        CirSim.console("dv " + dpx + " " + w);
        if (dpx === 0) {
            g.drawString(s, xc - idiv(w, 2), yc - CircuitElm.abs(dpy) - 2);
        } else {
            let xx: number = xc + CircuitElm.abs(dpx) + 2;
            g.drawString(s, xx, yc + dpy + ya);
        }
    }
    reset(): void {
        this.curcount1 = this.curcount2 = this.curcount3 = 0;
        super.reset();
    }
    calculateCurrent(): void {
        if (this.resistance1 === 0) {
            return;
        }
        // avoid NaN
        this.current1 = (this.volts[0] - this.volts[2]) / this.resistance1;
        this.current2 = (this.volts[1] - this.volts[2]) / this.resistance2;
        this.current3 = -this.current1 - this.current2;
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.current1;
        }
        if (n === 1) {
            return -this.current2;
        }
        return -this.current3;
    }
    stamp(): void {
        this.resistance1 = this.maxResistance * this.position;
        this.resistance2 = this.maxResistance * (1 - this.position);
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], this.resistance1);
        CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[1], this.resistance2);
    }
    getInfo(arr: string[]): void {
        arr[0] = "potentiometer";
        arr[1] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
        arr[2] = "R1 = " + CircuitElm.getUnitText$2(this.resistance1, CirSim.ohmString);
        arr[3] = "R2 = " + CircuitElm.getUnitText$2(this.resistance2, CirSim.ohmString);
        arr[4] = "I1 = " + CircuitElm.getCurrentDText(this.current1);
        arr[5] = "I2 = " + CircuitElm.getCurrentDText(this.current2);
    }
    getEditInfo(n: number): EditInfo {
        // ohmString doesn't work here on linux
        if (n === 0) {
            return new EditInfo("Resistance (ohms)", this.maxResistance, 0, 0);
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("Slider Text", 0, -1, -1);
            ei.text = this.sliderText;
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Show Values", (this.flags & this.FLAG_SHOW_VALUES) !== 0);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.maxResistance = ei.value;
        }
        if (n === 1) {
            this.sliderText = ei.textf.getText();
            this.label.setText(this.sliderText);
            CircuitElm.sim.setiFrameHeight();
        }
        if (n === 2) {
            this.flags = ei.changeFlag(this.flags, this.FLAG_SHOW_VALUES);
        }
    }
    setMouseElm(v: boolean): void {
        super.setMouseElm(v);
        if (this.slider != null) {
            this.slider.draw();
        }
    }
    onMouseWheel(e: MouseWheelEvent): void {
        if (this.slider != null) {
            this.slider.onMouseWheel(e);
        }
    }
}
Object.assign(PotElm.prototype, { "FLAG_SHOW_VALUES": 1, "position": 0, "maxResistance": 0, "resistance1": 0, "resistance2": 0, "current1": 0, "current2": 0, "current3": 0, "curcount1": 0, "curcount2": 0, "curcount3": 0, "slider": null, "label": null, "sliderText": null, "post3": null, "corner2": null, "arrowPoint": null, "midpoint": null, "arrow1": null, "arrow2": null, "ps3": null, "ps4": null, "bodyLen": 0 });
