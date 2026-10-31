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
// contributed by Edward Calver

// Changed 2026-10-31: converted from FMElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Color, EditInfo, Font, Graphics, Point, StringTokenizer, parseJDouble } from '../core/internal';

export class FMElm extends CircuitElm {
    static FLAG_COS: number = 2;
    declare carrierfreq: number;
    declare signalfreq: number;
    declare maxVoltage: number;
    declare freqTimeZero: number;
    declare deviation: number;
    declare lasttime: number;
    declare funcx: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.lasttime = 0;
        this.funcx = 0;
        this.deviation = 200;
        this.maxVoltage = 5;
        this.carrierfreq = 800;
        this.signalfreq = 40;
        this.reset();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.lasttime = 0;
        this.funcx = 0;
        this.carrierfreq = parseJDouble(st.nextToken$0());
        this.signalfreq = parseJDouble(st.nextToken$0());
        this.maxVoltage = parseJDouble(st.nextToken$0());
        this.deviation = parseJDouble(st.nextToken$0());
        if ((this.flags & FMElm.FLAG_COS) !== 0) {
            this.flags &= ~FMElm.FLAG_COS;
        }
        this.reset();
        return this;
    }
    getDumpType(): number {
        return 201;
    }
    dump(): string {
        return super.dump() + " " + this.carrierfreq + " " + this.signalfreq + " " + this.maxVoltage + " " + this.deviation;
    }
    /*void setCurrent(double c) {
      current = c;
      System.out.print("v current set to " + c + "\n");
      }*/
    reset(): void {
        this.freqTimeZero = 0;
        this.curcount = 0;
    }
    getPostCount(): number {
        return 1;
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(0, this.nodes[0], this.voltSource);
    }
    doStep(): void {
        CircuitElm.sim.updateVoltageSource(0, this.nodes[0], this.voltSource, this.getVoltage());
    }
    getVoltage(): number {
        let deltaT: number = CircuitElm.sim.t - this.lasttime;
        this.lasttime = CircuitElm.sim.t;
        let signalamplitude: number = Math.sin((2 * CircuitElm.pi * (CircuitElm.sim.t - this.freqTimeZero)) * this.signalfreq);
        this.funcx += deltaT * (this.carrierfreq + (signalamplitude * this.deviation));
        let w: number = 2 * CircuitElm.pi * this.funcx;
        return Math.sin(w) * this.maxVoltage;
    }
    declare circleSize: number;
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.circleSize);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        let f: Font = new Font().init$3("SansSerif", 0, 12);
        g.setFont(f);
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
        this.setPowerColor$Graphics_bool(g, false);
        let v: number = this.getVoltage();
        let s: string = "FM";
        this.drawCenteredText(g, s, this.x2, this.y2, true);
        this.drawWaveform(g, this.point2);
        this.drawPosts(g);
        this.curcount = this.updateDotCount$2(-this.current, this.curcount);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead1, this.curcount);
        }
    }
    drawWaveform(g: Graphics, center: Point): void {
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
        this.setPowerColor$Graphics_bool(g, false);
        let xc: number = center.x;
        let yc: number = center.y;
        CircuitElm.drawThickCircle(g, xc, yc, this.circleSize);
        let wl: number = 8;
        this.adjustBbox$4(xc - this.circleSize, yc - this.circleSize, xc + this.circleSize, yc + this.circleSize);
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = this.interpPoint$3(this.point1, this.point2, 1 - this.circleSize / this.dn);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    hasGroundConnection(n1: number): boolean {
        return true;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getPower(): number {
        return -this.getVoltageDiff() * this.current;
    }
    getInfo(arr: string[]): void {
        arr[0] = "FM Source";
        arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
        arr[2] = "V = " + CircuitElm.getVoltageText(this.getVoltageDiff());
        arr[3] = "cf = " + CircuitElm.getUnitText$2(this.carrierfreq, "Hz");
        arr[4] = "sf = " + CircuitElm.getUnitText$2(this.signalfreq, "Hz");
        arr[5] = "dev =" + CircuitElm.getUnitText$2(this.deviation, "Hz");
        arr[6] = "Vmax = " + CircuitElm.getVoltageText(this.maxVoltage);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Max Voltage", this.maxVoltage, -20, 20);
        }
        if (n === 1) {
            return new EditInfo("Carrier Frequency (Hz)", this.carrierfreq, 4, 500);
        }
        if (n === 2) {
            return new EditInfo("Signal Frequency (Hz)", this.signalfreq, 4, 500);
        }
        if (n === 3) {
            return new EditInfo("Deviation (Hz)", this.deviation, 4, 500);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.maxVoltage = ei.value;
        }
        if (n === 1) {
            this.carrierfreq = ei.value;
        }
        if (n === 2) {
            this.signalfreq = ei.value;
        }
        if (n === 3) {
            this.deviation = ei.value;
        }
    }
}
Object.assign(FMElm.prototype, { "carrierfreq": 0, "signalfreq": 0, "maxVoltage": 0, "freqTimeZero": 0, "deviation": 0, "lasttime": 0, "funcx": 0, "circleSize": 17 });
