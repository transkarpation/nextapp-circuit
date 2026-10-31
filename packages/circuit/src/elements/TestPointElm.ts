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
    
    TestPointElm by Bill Collis
    
*/

// Changed 2026-10-31: converted from TestPointElm.java to TypeScript.
/* eslint-disable */
import { Choice, CircuitElm, EditInfo, Font, Graphics, Point, StringTokenizer, idiv, parseJInt, toInt } from '../core/internal';

export class TestPointElm extends CircuitElm {
    declare meter: number;
    declare TP_VOL: number;
    declare TP_RMS: number;
    declare TP_MAX: number;
    declare TP_MIN: number;
    declare TP_P2P: number;
    declare TP_BIN: number;
    declare TP_FRQ: number;
    declare TP_PER: number;
    declare TP_PWI: number;
    declare TP_DUT: number;
    //mark to space ratio
    declare zerocount: number;
    declare rmsV: number;
    declare total: number;
    declare count: number;
    declare maxV: number;
    declare lastMaxV: number;
    declare minV: number;
    declare lastMinV: number;
    declare frequency: number;
    declare period: number;
    declare binaryLevel: number;
    //0 or 1 - double because we only pass doubles back to the web page
    declare pulseWidth: number;
    declare dutyCycle: number;
    declare selectedValue: number;
    declare lastStepCount: number;
    declare voltages: number[];
    declare increasingV: boolean;
    declare decreasingV: boolean;
    declare periodStart: number;
    declare periodLength: number;
    declare pulseStart: number;
    //time between consecutive max values
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.zerocount = 0;
        this.rmsV = 0;
        this.maxV = 0;
        this.minV = 0;
        this.frequency = 0;
        this.period = 0;
        this.binaryLevel = 0;
        this.pulseWidth = 0;
        this.dutyCycle = 0;
        this.selectedValue = 0;
        this.increasingV = true;
        this.decreasingV = true;
        this.meter = this.TP_VOL;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.zerocount = 0;
        this.rmsV = 0;
        this.maxV = 0;
        this.minV = 0;
        this.frequency = 0;
        this.period = 0;
        this.binaryLevel = 0;
        this.pulseWidth = 0;
        this.dutyCycle = 0;
        this.selectedValue = 0;
        this.increasingV = true;
        this.decreasingV = true;
        this.meter = parseJInt(st.nextToken$0());
        //get meter type from saved dump
        return this;
    }
    getDumpType(): number {
        return 368;
    }
    getPostCount(): number {
        return 1;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = new Point().init$0();
    }
    dump(): string {
        return super.dump() + " " + this.meter;
    }
    getMeter(): string {
        switch (this.meter) {
            case this.TP_VOL:
                return "V";
            case this.TP_RMS:
                return "V(rms)";
            case this.TP_MAX:
                return "Vmax";
            case this.TP_MIN:
                return "Vmin";
            case this.TP_P2P:
                return "Peak to peak";
            case this.TP_BIN:
                return "Binary";
            case this.TP_FRQ:
                return "Frequency";
            case this.TP_PER:
                return "Period";
            case this.TP_PWI:
                return "Pulse width";
            case this.TP_DUT:
                return "Duty cycle";
        }
        return "";
    }
    draw(g: Graphics): void {
        let selected: boolean = this.needsHighlight();
        let f: Font = new Font().init$3("SansSerif", selected ? Font.BOLD : 0, 14);
        g.setFont(f);
        g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
        //depending upon flags show voltage or TP
        let s: string = "TP";
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.lead1, 1 - (idiv(toInt(g.context.measureText(s).getWidth()), 2) + 8) / this.dn);
        this.setBbox$3(this.point1, this.lead1, 0);
        this.drawCenteredText(g, s, this.x2, this.y2, true);
        //draw label TPx
        //draw selected value
        switch (this.meter) {
            case this.TP_VOL:
                s = CircuitElm.getUnitText$2(this.volts[0], "V");
                break;
            case this.TP_RMS:
                s = CircuitElm.getUnitText$2(this.rmsV, "V(rms)");
                break;
            case this.TP_MAX:
                s = CircuitElm.getUnitText$2(this.lastMaxV, "Vpk");
                break;
            case this.TP_MIN:
                s = CircuitElm.getUnitText$2(this.lastMinV, "Vmin");
                break;
            case this.TP_P2P:
                s = CircuitElm.getUnitText$2(this.lastMaxV - this.lastMinV, "Vp2p");
                break;
            case this.TP_BIN:
                s = this.binaryLevel + "";
                break;
            case this.TP_FRQ:
                s = CircuitElm.getUnitText$2(this.frequency, "Hz");
                break;
            case this.TP_PER:
                //                s = "percent:"+period + " " + sim.timeStep + " " + sim.simTime + " " + sim.getIterCount();
                break;
            case this.TP_PWI:
                s = CircuitElm.getUnitText$2(this.pulseWidth, "S");
                break;
            case this.TP_DUT:
                s = CircuitElm.showFormat.format(this.dutyCycle);
                break;
        }
        this.drawCenteredText(g, s, this.x2, this.y2 + 12, true);
        //draw selected value TPx
        this.setVoltageColor(g, this.volts[0]);
        if (selected) {
            g.setColor(CircuitElm.selectColor);
        }
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.drawPosts(g);
    }
    stepFinished(): void {
        if (CircuitElm.sim.timeStepCount === this.lastStepCount) {
            return;
        }
        this.lastStepCount = CircuitElm.sim.timeStepCount;
        this.count++;
        //how many counts are in a cycle
        this.total += this.volts[0] * this.volts[0];
        //sum of squares
        if (this.volts[0] < 2.5) {
            this.binaryLevel = 0;
        } else {
            this.binaryLevel = 1;
        }
        //V going up, track maximum value with
        if (this.volts[0] > this.maxV && this.increasingV) {
            this.maxV = this.volts[0];
            this.increasingV = true;
            this.decreasingV = false;
        }
        if (this.volts[0] < this.maxV && this.increasingV) {
            //change of direction V now going down - at start of waveform
            this.lastMaxV = this.maxV;
            //capture last maximum
            //capture time between
            this.periodLength = Date.now() - this.periodStart;
            this.periodStart = Date.now();
            this.period = this.periodLength;
            this.pulseWidth = Date.now() - this.pulseStart;
            this.dutyCycle = this.pulseWidth / this.periodLength;
            this.minV = this.volts[0];
            //track minimum value with V
            this.increasingV = false;
            this.decreasingV = true;
            //rms data
            this.total = this.total / this.count;
            this.rmsV = Math.sqrt(this.total);
            if (Number.isNaN(this.rmsV)) {
                this.rmsV = 0;
            }
            this.count = 0;
            this.total = 0;
        }
        if (this.volts[0] < this.minV && this.decreasingV) {
            //V going down, track minimum value with V
            this.minV = this.volts[0];
            this.increasingV = false;
            this.decreasingV = true;
        }
        if (this.volts[0] > this.minV && this.decreasingV) {
            //change of direction V now going up
            this.lastMinV = this.minV;
            //capture last minimum
            this.pulseStart = Date.now();
            this.maxV = this.volts[0];
            this.increasingV = true;
            this.decreasingV = false;
            //rms data
            this.total = this.total / this.count;
            this.rmsV = Math.sqrt(this.total);
            if (Number.isNaN(this.rmsV)) {
                this.rmsV = 0;
            }
            this.count = 0;
            this.total = 0;
        }
        //need to zero the rms value if it stays at 0 for a while
        if (this.volts[0] === 0) {
            this.zerocount++;
            if (this.zerocount > 5) {
                this.total = 0;
                this.rmsV = 0;
                this.maxV = 0;
                this.minV = 0;
            }
        } else {
            this.zerocount = 0;
        }
        switch (this.meter) {
            case this.TP_VOL:
                this.selectedValue = this.volts[0];
                break;
            case this.TP_RMS:
                this.selectedValue = this.rmsV;
                break;
            case this.TP_MAX:
                this.selectedValue = this.lastMaxV;
                break;
            case this.TP_MIN:
                this.selectedValue = this.lastMinV;
                break;
            case this.TP_P2P:
                this.selectedValue = this.lastMaxV - this.lastMinV;
                break;
            case this.TP_BIN:
                this.selectedValue = this.binaryLevel;
                break;
            case this.TP_FRQ:
                this.selectedValue = this.frequency;
                break;
            case this.TP_PER:
                this.selectedValue = this.period;
                break;
            case this.TP_PWI:
                this.selectedValue = this.pulseWidth;
                break;
            case this.TP_DUT:
                this.selectedValue = this.dutyCycle;
                break;
        }
    }
    //alert the user
    static alert(msg: string): void {

      window.alert(msg);
    
    }
    getScopeValue(x: number): number {
        return this.selectedValue;
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "Test Point";
        switch (this.meter) {
            case this.TP_VOL:
                arr[1] = "V = " + CircuitElm.getUnitText$2(this.volts[0], "V");
                break;
            case this.TP_RMS:
                arr[1] = "V(rms) = " + CircuitElm.getUnitText$2(this.rmsV, "V");
                break;
            case this.TP_MAX:
                arr[1] = "Vmax = " + CircuitElm.getUnitText$2(this.lastMaxV, "Vpk");
                break;
            case this.TP_MIN:
                arr[1] = "Vmin = " + CircuitElm.getUnitText$2(this.lastMinV, "Vmin");
                break;
            case this.TP_P2P:
                arr[1] = "Vp2p = " + CircuitElm.getUnitText$2(this.lastMaxV - this.lastMinV, "Vp2p");
                break;
            case this.TP_BIN:
                arr[1] = "Binary:" + this.binaryLevel + "";
                break;
            case this.TP_FRQ:
                arr[1] = "Freq = " + CircuitElm.getUnitText$2(this.frequency, "Hz");
                break;
            case this.TP_PER:
                arr[1] = "Period = " + CircuitElm.getUnitText$2(this.period * CircuitElm.sim.maxTimeStep / CircuitElm.sim.getIterCount(), "S");
                break;
            case this.TP_PWI:
                arr[1] = "Pulse width = " + CircuitElm.getUnitText$2(this.pulseWidth * CircuitElm.sim.maxTimeStep * CircuitElm.sim.getIterCount(), "S");
                break;
            case this.TP_DUT:
                arr[1] = "Duty cycle = " + CircuitElm.showFormat.format(this.dutyCycle);
                break;
        }
    }
    //    void drawHandles(Graphics g, Color c) {
    //        g.setColor(c);
    //        g.fillRect(x-3, y-3, 7, 7);
    //    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Value", this.selectedValue, -1, -1);
            ei.choice = new Choice();
            ei.choice.add("Voltage");
            ei.choice.add("RMS Voltage");
            ei.choice.add("Max Voltage");
            ei.choice.add("Min Voltage");
            ei.choice.add("P2P Voltage");
            ei.choice.add("Binary Value");
            //ei.choice.add("Frequency");
            //ei.choice.add("Period");
            //ei.choice.add("Pulse Width");
            //ei.choice.add("Duty Cycle");
            ei.choice.select(this.meter);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.meter = ei.choice.getSelectedIndex();
        }
    }
}
Object.assign(TestPointElm.prototype, { "meter": 0, "TP_VOL": 0, "TP_RMS": 1, "TP_MAX": 2, "TP_MIN": 3, "TP_P2P": 4, "TP_BIN": 5, "TP_FRQ": 6, "TP_PER": 7, "TP_PWI": 8, "TP_DUT": 9, "zerocount": 0, "rmsV": 0, "total": 0, "count": 0, "maxV": 0, "lastMaxV": 0, "minV": 0, "lastMinV": 0, "frequency": 0, "period": 0, "binaryLevel": 0, "pulseWidth": 0, "dutyCycle": 0, "selectedValue": 0, "lastStepCount": 0, "voltages": null, "increasingV": false, "decreasingV": false, "periodStart": 0, "periodLength": 0, "pulseStart": 0 });
