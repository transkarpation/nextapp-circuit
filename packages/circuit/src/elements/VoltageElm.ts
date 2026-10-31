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

// Changed 2026-10-31: converted from VoltageElm.java to TypeScript.
/* eslint-disable */
import { Choice, CirSim, CircuitElm, Color, EditInfo, Graphics, Point, RailElm, StringTokenizer, Window, idiv, parseJDouble, parseJInt, toInt } from '../core/internal';

export class VoltageElm extends CircuitElm {
    static FLAG_COS: number = 2;
    static FLAG_PULSE_DUTY: number = 4;
    declare waveform: number;
    static WF_DC: number = 0;
    static WF_AC: number = 1;
    static WF_SQUARE: number = 2;
    static WF_TRIANGLE: number = 3;
    static WF_SAWTOOTH: number = 4;
    static WF_PULSE: number = 5;
    static WF_NOISE: number = 6;
    static WF_VAR: number = 7;
    declare frequency: number;
    declare maxVoltage: number;
    declare freqTimeZero: number;
    declare bias: number;
    declare phaseShift: number;
    declare dutyCycle: number;
    declare noiseValue: number;
    static defaultPulseDuty: number = 1 / (2 * Math.PI);
    init$3(xx: number, yy: number, wf: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.waveform = wf;
        this.maxVoltage = 5;
        this.frequency = 40;
        this.dutyCycle = .5;
        this.reset();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.maxVoltage = 5;
        this.frequency = 40;
        this.waveform = VoltageElm.WF_DC;
        this.dutyCycle = .5;
        try {
            this.waveform = parseJInt(st.nextToken$0());
            this.frequency = parseJDouble(st.nextToken$0());
            this.maxVoltage = parseJDouble(st.nextToken$0());
            this.bias = parseJDouble(st.nextToken$0());
            this.phaseShift = parseJDouble(st.nextToken$0());
            this.dutyCycle = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        if ((this.flags & VoltageElm.FLAG_COS) !== 0) {
            this.flags &= ~VoltageElm.FLAG_COS;
            this.phaseShift = CircuitElm.pi / 2;
        }
        // old circuit files have the wrong duty cycle for pulse waveforms (wasn't configurable in the past)
        if ((this.flags & VoltageElm.FLAG_PULSE_DUTY) === 0 && this.waveform === VoltageElm.WF_PULSE) {
            this.dutyCycle = VoltageElm.defaultPulseDuty;
        }
        this.reset();
        return this;
    }
    getDumpType(): number {
        return 118;
    }
    dump(): string {
        // set flag so we know if duty cycle is correct for pulse waveforms
        if (this.waveform === VoltageElm.WF_PULSE) {
            this.flags |= VoltageElm.FLAG_PULSE_DUTY;
        } else {
            this.flags &= ~VoltageElm.FLAG_PULSE_DUTY;
        }
        return super.dump() + " " + this.waveform + " " + this.frequency + " " + this.maxVoltage + " " + this.bias + " " + this.phaseShift + " " + this.dutyCycle;
        // VarRailElm adds text at the end
    }
    reset(): void {
        this.freqTimeZero = 0;
        this.curcount = 0;
    }
    triangleFunc(x: number): number {
        if (x < CircuitElm.pi) {
            return x * (2 / CircuitElm.pi) - 1;
        }
        return 1 - (x - CircuitElm.pi) * (2 / CircuitElm.pi);
    }
    getVoltageSource(): number {
        return this.voltSource;
    }
    stamp(): void {
        if (this.waveform === VoltageElm.WF_DC) {
            CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSource, this.getVoltage());
        } else {
            CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSource);
        }
    }
    doStep(): void {
        if (this.waveform !== VoltageElm.WF_DC) {
            CircuitElm.sim.updateVoltageSource(this.nodes[0], this.nodes[1], this.voltSource, this.getVoltage());
        }
    }
    stepFinished(): void {
        if (this.waveform === VoltageElm.WF_NOISE) {
            this.noiseValue = (CircuitElm.sim.random.nextDouble() * 2 - 1) * this.maxVoltage + this.bias;
        }
    }
    getVoltage(): number {
        if (this.waveform !== VoltageElm.WF_DC && CircuitElm.sim.dcAnalysisFlag) {
            return this.bias;
        }
        let w: number = 2 * CircuitElm.pi * (CircuitElm.sim.t - this.freqTimeZero) * this.frequency + this.phaseShift;
        switch (this.waveform) {
            case VoltageElm.WF_DC:
                return this.maxVoltage + this.bias;
            case VoltageElm.WF_AC:
                return Math.sin(w) * this.maxVoltage + this.bias;
            case VoltageElm.WF_SQUARE:
                return this.bias + ((w % (2 * CircuitElm.pi) > (2 * CircuitElm.pi * this.dutyCycle)) ? -this.maxVoltage : this.maxVoltage);
            case VoltageElm.WF_TRIANGLE:
                return this.bias + this.triangleFunc(w % (2 * CircuitElm.pi)) * this.maxVoltage;
            case VoltageElm.WF_SAWTOOTH:
                return this.bias + (w % (2 * CircuitElm.pi)) * (this.maxVoltage / CircuitElm.pi) - this.maxVoltage;
            case VoltageElm.WF_PULSE:
                return ((w % (2 * CircuitElm.pi)) < (2 * CircuitElm.pi * this.dutyCycle)) ? this.maxVoltage + this.bias : this.bias;
            case VoltageElm.WF_NOISE:
                return this.noiseValue;
            default:
                return 0;
        }
    }
    declare circleSize: number;
    setPoints(): void {
        super.setPoints();
        this.calcLeads((this.waveform === VoltageElm.WF_DC || this.waveform === VoltageElm.WF_VAR) ? 8 : this.circleSize * 2);
    }
    draw(g: Graphics): void {
        this.setBbox$4(this.x, this.y, this.x2, this.y2);
        this.draw2Leads(g);
        if (this.waveform === VoltageElm.WF_DC) {
            this.setVoltageColor(g, this.volts[0]);
            this.setPowerColor$Graphics_bool(g, false);
            this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 0, 10);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
            this.setVoltageColor(g, this.volts[1]);
            this.setPowerColor$Graphics_bool(g, false);
            let hs: number = 16;
            this.setBbox$3(this.point1, this.point2, hs);
            this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 1, hs);
            CircuitElm.drawThickLine$3(g, CircuitElm.ps1, CircuitElm.ps2);
        } else {
            this.setBbox$3(this.point1, this.point2, this.circleSize);
            this.interpPoint$Point_Point_Point_dbl(this.lead1, this.lead2, CircuitElm.ps1, .5);
            this.drawWaveform(g, CircuitElm.ps1);
            let inds: string = null as any;
            if (this.bias > 0 || (this.bias === 0 && this.waveform === VoltageElm.WF_PULSE)) {
                inds = "+";
            } else {
                inds = "*";
            }
            g.setColor(Color.white);
            g.setFont(CircuitElm.unitsFont);
            let plusPoint: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, (this.dn / 2 + this.circleSize + 4) / this.dn, 10 * this.dsign);
            plusPoint.y += 4;
            let w: number = toInt(g.context.measureText(inds).getWidth());
            g.drawString(inds, plusPoint.x - idiv(w, 2), plusPoint.y);
        }
        this.updateDotCount$0();
        if (CircuitElm.sim.dragElm !== this) {
            if (this.waveform === VoltageElm.WF_DC) {
                this.drawDots(g, this.point1, this.point2, this.curcount);
            } else {
                this.drawDots(g, this.point1, this.lead1, this.curcount);
                this.drawDots(g, this.point2, this.lead2, -this.curcount);
            }
        }
        this.drawPosts(g);
    }
    drawWaveform(g: Graphics, center: Point): void {
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
        this.setPowerColor$Graphics_bool(g, false);
        let xc: number = center.x;
        let yc: number = center.y;
        if (this.waveform !== VoltageElm.WF_NOISE) {
            CircuitElm.drawThickCircle(g, xc, yc, this.circleSize);
        }
        let wl: number = 8;
        this.adjustBbox$4(xc - this.circleSize, yc - this.circleSize, xc + this.circleSize, yc + this.circleSize);
        let xc2: number = 0;
        switch (this.waveform) {
            case VoltageElm.WF_DC:
                {
                    break;
                }
            case VoltageElm.WF_SQUARE:
                xc2 = toInt((wl * 2 * this.dutyCycle - wl + xc));
                xc2 = CircuitElm.max(xc - wl + 3, CircuitElm.min(xc + wl - 3, xc2));
                CircuitElm.drawThickLine$5(g, xc - wl, yc - wl, xc - wl, yc);
                CircuitElm.drawThickLine$5(g, xc - wl, yc - wl, xc2, yc - wl);
                CircuitElm.drawThickLine$5(g, xc2, yc - wl, xc2, yc + wl);
                CircuitElm.drawThickLine$5(g, xc + wl, yc + wl, xc2, yc + wl);
                CircuitElm.drawThickLine$5(g, xc + wl, yc, xc + wl, yc + wl);
                break;
            case VoltageElm.WF_PULSE:
                yc += idiv(wl, 2);
                CircuitElm.drawThickLine$5(g, xc - wl, yc - wl, xc - wl, yc);
                CircuitElm.drawThickLine$5(g, xc - wl, yc - wl, xc - idiv(wl, 2), yc - wl);
                CircuitElm.drawThickLine$5(g, xc - idiv(wl, 2), yc - wl, xc - idiv(wl, 2), yc);
                CircuitElm.drawThickLine$5(g, xc - idiv(wl, 2), yc, xc + wl, yc);
                break;
            case VoltageElm.WF_SAWTOOTH:
                CircuitElm.drawThickLine$5(g, xc, yc - wl, xc - wl, yc);
                CircuitElm.drawThickLine$5(g, xc, yc - wl, xc, yc + wl);
                CircuitElm.drawThickLine$5(g, xc, yc + wl, xc + wl, yc);
                break;
            case VoltageElm.WF_TRIANGLE:
                {
                    let xl: number = 5;
                    CircuitElm.drawThickLine$5(g, xc - xl * 2, yc, xc - xl, yc - wl);
                    CircuitElm.drawThickLine$5(g, xc - xl, yc - wl, xc, yc);
                    CircuitElm.drawThickLine$5(g, xc, yc, xc + xl, yc + wl);
                    CircuitElm.drawThickLine$5(g, xc + xl, yc + wl, xc + xl * 2, yc);
                    break;
                }
            case VoltageElm.WF_NOISE:
                {
                    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
                    this.setPowerColor$Graphics_bool(g, false);
                    this.drawCenteredText(g, CirSim.LS("Noise"), xc, yc, true);
                    break;
                }
            case VoltageElm.WF_AC:
                {
                    let i: number = 0;
                    let xl: number = 10;
                    g.context.beginPath();
                    g.context.setLineWidth(3.0);
                    for (i = -xl; i <= xl; i++) {
                        let yy: number = yc + toInt((.95 * Math.sin(i * CircuitElm.pi / xl) * wl));
                        if (i === -xl) {
                            g.context.moveTo(xc + i, yy);
                        } else {
                            g.context.lineTo(xc + i, yy);
                        }
                    }
                    g.context.stroke();
                    g.context.setLineWidth(1.0);
                    break;
                }
        }
        if (CircuitElm.sim.showValuesCheckItem.getState() && this.waveform !== VoltageElm.WF_NOISE) {
            let s: string = CircuitElm.getShortUnitText(this.frequency, "Hz");
            if (this.dx === 0 || this.dy === 0) {
                this.drawValues$3(g, s, this.circleSize);
            }
        }
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getPower(): number {
        return -this.getVoltageDiff() * this.current;
    }
    getVoltageDiff(): number {
        return this.volts[1] - this.volts[0];
    }
    getInfo(arr: string[]): void {
        switch (this.waveform) {
            case VoltageElm.WF_DC:
            case VoltageElm.WF_VAR:
                arr[0] = "voltage source";
                break;
            case VoltageElm.WF_AC:
                arr[0] = "A/C source";
                break;
            case VoltageElm.WF_SQUARE:
                arr[0] = "square wave gen";
                break;
            case VoltageElm.WF_PULSE:
                arr[0] = "pulse gen";
                break;
            case VoltageElm.WF_SAWTOOTH:
                arr[0] = "sawtooth gen";
                break;
            case VoltageElm.WF_TRIANGLE:
                arr[0] = "triangle gen";
                break;
            case VoltageElm.WF_NOISE:
                arr[0] = "noise gen";
                break;
        }
        arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
        arr[2] = ((this instanceof RailElm) ? "V = " : "Vd = ") + CircuitElm.getVoltageText(this.getVoltageDiff());
        let i: number = 3;
        if (this.waveform !== VoltageElm.WF_DC && this.waveform !== VoltageElm.WF_VAR && this.waveform !== VoltageElm.WF_NOISE) {
            arr[i++] = "f = " + CircuitElm.getUnitText$2(this.frequency, "Hz");
            arr[i++] = "Vmax = " + CircuitElm.getVoltageText(this.maxVoltage);
            if (this.waveform === VoltageElm.WF_AC && this.bias === 0) {
                arr[i++] = "V(rms) = " + CircuitElm.getVoltageText(this.maxVoltage / 1.41421356);
            }
            if (this.bias !== 0) {
                arr[i++] = "Voff = " + CircuitElm.getVoltageText(this.bias);
            } else if (this.frequency > 500) {
                arr[i++] = "wavelength = " + CircuitElm.getUnitText$2(2.9979e8 / this.frequency, "m");
            }
        }
        if (this.waveform === VoltageElm.WF_DC && this.current !== 0 && CircuitElm.sim.showResistanceInVoltageSources) {
            arr[i++] = "(R = " + CircuitElm.getUnitText$2(this.maxVoltage / this.current, CirSim.ohmString) + ")";
        }
        arr[i++] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo(this.waveform === VoltageElm.WF_DC ? "Voltage" : "Max Voltage", this.maxVoltage, -20, 20);
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("Waveform", this.waveform, -1, -1);
            ei.choice = new Choice();
            ei.choice.add("D/C");
            ei.choice.add("A/C");
            ei.choice.add("Square Wave");
            ei.choice.add("Triangle");
            ei.choice.add("Sawtooth");
            ei.choice.add("Pulse");
            ei.choice.add("Noise");
            ei.choice.select(this.waveform);
            return ei;
        }
        if (n === 2) {
            return new EditInfo("DC Offset (V)", this.bias, -20, 20);
        }
        if (this.waveform === VoltageElm.WF_DC || this.waveform === VoltageElm.WF_NOISE) {
            return null;
        }
        if (n === 3) {
            return new EditInfo("Frequency (Hz)", this.frequency, 4, 500);
        }
        if (n === 4) {
            return new EditInfo("Phase Offset (degrees)", this.phaseShift * 180 / CircuitElm.pi, -180, 180).setDimensionless();
        }
        if (n === 5 && (this.waveform === VoltageElm.WF_PULSE || this.waveform === VoltageElm.WF_SQUARE)) {
            return new EditInfo("Duty Cycle", this.dutyCycle * 100, 0, 100).setDimensionless();
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.maxVoltage = ei.value;
        }
        if (n === 2) {
            this.bias = ei.value;
        }
        if (n === 3) {
            // adjust time zero to maintain continuity ind the waveform
            // even though the frequency has changed.
            let oldfreq: number = this.frequency;
            this.frequency = ei.value;
            let maxfreq: number = 1 / (8 * CircuitElm.sim.maxTimeStep);
            if (this.frequency > maxfreq) {
                if (Window.confirm(CirSim.LS("Adjust timestep to allow for higher frequencies?"))) {
                    CircuitElm.sim.maxTimeStep = 1 / (32 * this.frequency);
                } else {
                    this.frequency = maxfreq;
                }
            }
            let adj: number = this.frequency - oldfreq;
            this.freqTimeZero = CircuitElm.sim.t - oldfreq * (CircuitElm.sim.t - this.freqTimeZero) / this.frequency;
        }
        if (n === 1) {
            let ow: number = this.waveform;
            this.waveform = ei.choice.getSelectedIndex();
            if (this.waveform === VoltageElm.WF_DC && ow !== VoltageElm.WF_DC) {
                ei.newDialog = true;
                this.bias = 0;
            } else if (this.waveform !== ow) {
                ei.newDialog = true;
            }
            // change duty cycle if we're changing to or from pulse
            if (this.waveform === VoltageElm.WF_PULSE && ow !== VoltageElm.WF_PULSE) {
                this.dutyCycle = VoltageElm.defaultPulseDuty;
            } else if (ow === VoltageElm.WF_PULSE && this.waveform !== VoltageElm.WF_PULSE) {
                this.dutyCycle = .5;
            }
            this.setPoints();
        }
        if (n === 4) {
            this.phaseShift = ei.value * CircuitElm.pi / 180;
        }
        if (n === 5) {
            this.dutyCycle = ei.value * .01;
        }
    }
}
Object.assign(VoltageElm.prototype, { "waveform": 0, "frequency": 0, "maxVoltage": 0, "freqTimeZero": 0, "bias": 0, "phaseShift": 0, "dutyCycle": 0, "noiseValue": 0, "circleSize": 17 });
