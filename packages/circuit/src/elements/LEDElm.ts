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

// Changed 2026-10-31: converted from LEDElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Color, DiodeElm, DiodeModel, EditInfo, Graphics, Point, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class LEDElm extends DiodeElm {
    declare colorR: number;
    declare colorG: number;
    declare colorB: number;
    declare maxBrightnessCurrent: number;
    static lastLEDModelName: string = "default-led";
    init$2(xx: number, yy: number): this {
        DiodeElm.prototype.init$2.call(this, xx, yy);
        this.modelName = LEDElm.lastLEDModelName;
        this.setup();
        this.maxBrightnessCurrent = .01;
        this.colorR = 1;
        this.colorG = this.colorB = 0;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        DiodeElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        if ((f & (DiodeElm.FLAG_MODEL | DiodeElm.FLAG_FWDROP)) === 0) {
            let fwdrop: number = 2.1024259;
            this.model = DiodeModel.getModelWithParameters(fwdrop, 0);
            this.modelName = this.model.name;
            CirSim.console("model name wparams = " + this.modelName);
            this.setup();
        }
        this.colorR = parseJDouble(st.nextToken$0());
        this.colorG = parseJDouble(st.nextToken$0());
        this.colorB = parseJDouble(st.nextToken$0());
        this.maxBrightnessCurrent = .01;
        try {
            this.maxBrightnessCurrent = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    getDumpType(): number {
        return 162;
    }
    dump(): string {
        return super.dump() + " " + this.colorR + " " + this.colorG + " " + this.colorB + " " + this.maxBrightnessCurrent;
    }
    declare ledLead1: Point;
    declare ledLead2: Point;
    declare ledCenter: Point;
    setPoints(): void {
        super.setPoints();
        let cr: number = 12;
        this.ledLead1 = this.interpPoint$3(this.point1, this.point2, .5 - cr / this.dn);
        this.ledLead2 = this.interpPoint$3(this.point1, this.point2, .5 + cr / this.dn);
        this.ledCenter = this.interpPoint$3(this.point1, this.point2, .5);
    }
    draw(g: Graphics): void {
        if (this.needsHighlight() || this === CircuitElm.sim.dragElm) {
            super.draw(g);
            return;
        }
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.ledLead1);
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.ledLead2, this.point2);
        g.setColor(Color.gray);
        let cr: number = 12;
        CircuitElm.drawThickCircle(g, this.ledCenter.x, this.ledCenter.y, cr);
        cr -= 4;
        let w: number = this.current / this.maxBrightnessCurrent;
        if (w > 0) {
            w = 255 * (1 + .2 * Math.log(w));
        }
        if (w > 255) {
            w = 255;
        }
        if (w < 0) {
            w = 0;
        }
        let cc: Color = new Color().init$int_int_int(toInt((this.colorR * w)), toInt((this.colorG * w)), toInt((this.colorB * w)));
        g.setColor(cc);
        g.fillOval(this.ledCenter.x - cr, this.ledCenter.y - cr, cr * 2, cr * 2);
        this.setBbox$3(this.point1, this.point2, cr);
        this.updateDotCount$0();
        this.drawDots(g, this.point1, this.ledLead1, this.curcount);
        this.drawDots(g, this.point2, this.ledLead2, -this.curcount);
        this.drawPosts(g);
    }
    getInfo(arr: string[]): void {
        super.getInfo(arr);
        if (this.model.oldStyle) {
            arr[0] = "LED";
        } else {
            arr[0] = CirSim.LS("LED") + " (" + this.modelName + ")";
        }
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Red Value (0-1)", this.colorR, 0, 1).setDimensionless();
        }
        if (n === 1) {
            return new EditInfo("Green Value (0-1)", this.colorG, 0, 1).setDimensionless();
        }
        if (n === 2) {
            return new EditInfo("Blue Value (0-1)", this.colorB, 0, 1).setDimensionless();
        }
        if (n === 3) {
            return new EditInfo("Max Brightness Current (A)", this.maxBrightnessCurrent, 0, .1);
        }
        return super.getEditInfo(n - 4);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.colorR = ei.value;
        }
        if (n === 1) {
            this.colorG = ei.value;
        }
        if (n === 2) {
            this.colorB = ei.value;
        }
        if (n === 3) {
            this.maxBrightnessCurrent = ei.value;
        }
        super.setEditValue(n - 4, ei);
    }
    getShortcut(): number {
        return 108;
    }
    setLastModelName(n: string): void {
        LEDElm.lastLEDModelName = n;
    }
}
Object.assign(LEDElm.prototype, { "colorR": 0, "colorG": 0, "colorB": 0, "maxBrightnessCurrent": 0, "ledLead1": null, "ledLead2": null, "ledCenter": null });
