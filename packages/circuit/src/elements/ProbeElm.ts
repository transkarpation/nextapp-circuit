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
// much of this was adapted from Bill Collis's code in TestPointElm.java

// Changed 2026-10-31: converted from ProbeElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, Choice, CirSim, CircuitElm, Color, EditInfo, Font, Graphics, Point, StringTokenizer, idiv, parseJInt, toInt } from '../core/internal';

export class ProbeElm extends CircuitElm {
    static FLAG_SHOWVOLTAGE: number = 1;
    declare meter: number;
    declare units: number;
    declare scale: number;
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
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.rmsV = 0;
        this.binaryLevel = 0;
        this.zerocount = 0;
        this.maxV = 0;
        this.minV = 0;
        this.frequency = 0;
        this.period = 0;
        this.pulseWidth = 0;
        this.dutyCycle = 0;
        this.selectedValue = 0;
        this.increasingV = true;
        this.decreasingV = true;
        this.meter = this.TP_VOL;
        // default for new elements
        this.flags = ProbeElm.FLAG_SHOWVOLTAGE;
        this.scale = CircuitElm.SCALE_AUTO;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.rmsV = 0;
        this.binaryLevel = 0;
        this.zerocount = 0;
        this.maxV = 0;
        this.minV = 0;
        this.frequency = 0;
        this.period = 0;
        this.pulseWidth = 0;
        this.dutyCycle = 0;
        this.selectedValue = 0;
        this.increasingV = true;
        this.decreasingV = true;
        this.meter = this.TP_VOL;
        this.scale = CircuitElm.SCALE_AUTO;
        try {
            this.meter = parseJInt(st.nextToken$0());
            // get meter type from saved dump
            this.scale = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    getDumpType(): number {
        return 112;
    }
    dump(): string {
        return super.dump() + " " + this.meter + " " + this.scale;
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
    declare rmsV: number;
    declare total: number;
    declare count: number;
    declare binaryLevel: number;
    //0 or 1 - double because we only pass doubles back to the web page
    declare zerocount: number;
    declare maxV: number;
    declare lastMaxV: number;
    declare minV: number;
    declare lastMinV: number;
    declare frequency: number;
    declare period: number;
    declare pulseWidth: number;
    declare dutyCycle: number;
    declare selectedValue: number;
    declare increasingV: boolean;
    declare decreasingV: boolean;
    declare periodStart: number;
    declare periodLength: number;
    declare pulseStart: number;
    //time between consecutive max values
    declare center: Point;
    setPoints(): void {
        super.setPoints();
        this.center = this.interpPoint$3(this.point1, this.point2, .5);
    }
    draw(g: Graphics): void {
        let hs: number = 8;
        this.setBbox$3(this.point1, this.point2, hs);
        let selected: boolean = this.needsHighlight();
        let len: number = (selected || CircuitElm.sim.dragElm === this || this.mustShowVoltage()) ? 16 : this.dn - 32;
        this.calcLeads(toInt(len));
        this.setVoltageColor(g, this.volts[0]);
        if (selected) {
            g.setColor(CircuitElm.selectColor);
        }
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.setVoltageColor(g, this.volts[1]);
        if (selected) {
            g.setColor(CircuitElm.selectColor);
        }
        CircuitElm.drawThickLine$3(g, this.lead2, this.point2);
        let f: Font = new Font().init$3("SansSerif", Font.BOLD, 14);
        g.setFont(f);
        if (this === CircuitElm.sim.plotXElm) {
            this.drawCenteredText(g, "X", this.center.x, this.center.y, true);
        }
        if (this === CircuitElm.sim.plotYElm) {
            this.drawCenteredText(g, "Y", this.center.x, this.center.y, true);
        }
        if (this.mustShowVoltage()) {
            let s: string = "";
            switch (this.meter) {
                case this.TP_VOL:
                    s = CircuitElm.getUnitTextWithScale(this.getVoltageDiff(), "V", this.scale);
                    break;
                case this.TP_RMS:
                    s = CircuitElm.getUnitTextWithScale(this.rmsV, "V(rms)", this.scale);
                    break;
                case this.TP_MAX:
                    s = CircuitElm.getUnitTextWithScale(this.lastMaxV, "Vpk", this.scale);
                    break;
                case this.TP_MIN:
                    s = CircuitElm.getUnitTextWithScale(this.lastMinV, "Vmin", this.scale);
                    break;
                case this.TP_P2P:
                    s = CircuitElm.getUnitTextWithScale(this.lastMaxV - this.lastMinV, "Vp2p", this.scale);
                    break;
                case this.TP_BIN:
                    s = this.binaryLevel + "";
                    break;
                case this.TP_FRQ:
                    s = CircuitElm.getUnitText$2(this.frequency, "Hz");
                    break;
                case this.TP_PER:
                    //	                s = "percent:"+period + " " + sim.timeStep + " " + sim.simTime + " " + sim.getIterCount();
                    break;
                case this.TP_PWI:
                    s = CircuitElm.getUnitText$2(this.pulseWidth, "S");
                    break;
                case this.TP_DUT:
                    s = CircuitElm.showFormat.format(this.dutyCycle);
                    break;
            }
            this.drawValues$3(g, s, 4);
        }
        g.setColor(Color.white);
        g.setFont(CircuitElm.unitsFont);
        let plusPoint: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, (this.dn / 2 - len / 2 - 4) / this.dn, -10 * this.dsign);
        if (this.y2 > this.y) {
            plusPoint.y += 4;
        }
        if (this.y > this.y2) {
            plusPoint.y += 3;
        }
        let w: number = toInt(g.context.measureText("+").getWidth());
        g.drawString("+", plusPoint.x - idiv(w, 2), plusPoint.y);
        this.drawPosts(g);
    }
    mustShowVoltage(): boolean {
        return (this.flags & ProbeElm.FLAG_SHOWVOLTAGE) !== 0;
    }
    stepFinished(): void {
        this.count++;
        //how many counts are in a cycle
        let v: number = this.getVoltageDiff();
        this.total += v * v;
        //sum of squares
        if (v < 2.5) {
            this.binaryLevel = 0;
        } else {
            this.binaryLevel = 1;
        }
        //V going up, track maximum value with
        if (v > this.maxV && this.increasingV) {
            this.maxV = v;
            this.increasingV = true;
            this.decreasingV = false;
        }
        if (v < this.maxV && this.increasingV) {
            //change of direction V now going down - at start of waveform
            this.lastMaxV = this.maxV;
            //capture last maximum
            //capture time between
            this.periodLength = Date.now() - this.periodStart;
            this.periodStart = Date.now();
            this.period = this.periodLength;
            this.pulseWidth = Date.now() - this.pulseStart;
            this.dutyCycle = this.pulseWidth / this.periodLength;
            this.minV = v;
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
        if (v < this.minV && this.decreasingV) {
            //V going down, track minimum value with V
            this.minV = v;
            this.increasingV = false;
            this.decreasingV = true;
        }
        if (v > this.minV && this.decreasingV) {
            //change of direction V now going up
            this.lastMinV = this.minV;
            //capture last minimum
            this.pulseStart = Date.now();
            this.maxV = v;
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
        if (v === 0) {
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
    }
    getInfo(arr: string[]): void {
        arr[0] = "voltmeter";
        arr[1] = "Vd = " + CircuitElm.getVoltageText(this.getVoltageDiff());
    }
    getConnection(n1: number, n2: number): boolean {
        return false;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Show Value", this.mustShowVoltage());
            return ei;
        }
        if (n === 1) {
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
        if (n === 2) {
            let ei: EditInfo = new EditInfo("Scale", 0);
            ei.choice = new Choice();
            ei.choice.add("Auto");
            ei.choice.add("V");
            ei.choice.add("mV");
            ei.choice.add(CirSim.muString + "V");
            ei.choice.select(this.scale);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            if (ei.checkbox.getState()) {
                this.flags = ProbeElm.FLAG_SHOWVOLTAGE;
            } else {
                this.flags &= ~ProbeElm.FLAG_SHOWVOLTAGE;
            }
        }
        if (n === 1) {
            this.meter = ei.choice.getSelectedIndex();
        }
        if (n === 2) {
            this.scale = ei.choice.getSelectedIndex();
        }
    }
}
Object.assign(ProbeElm.prototype, { "meter": 0, "units": 0, "scale": 0, "TP_VOL": 0, "TP_RMS": 1, "TP_MAX": 2, "TP_MIN": 3, "TP_P2P": 4, "TP_BIN": 5, "TP_FRQ": 6, "TP_PER": 7, "TP_PWI": 8, "TP_DUT": 9, "rmsV": 0, "total": 0, "count": 0, "binaryLevel": 0, "zerocount": 0, "maxV": 0, "lastMaxV": 0, "minV": 0, "lastMinV": 0, "frequency": 0, "period": 0, "pulseWidth": 0, "dutyCycle": 0, "selectedValue": 0, "increasingV": false, "decreasingV": false, "periodStart": 0, "periodLength": 0, "pulseStart": 0, "center": null });
