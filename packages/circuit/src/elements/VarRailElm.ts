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

// Changed 2026-10-31: converted from VarRailElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, EditInfo, Label, MouseWheelEvent, RailElm, Scrollbar, StringTokenizer, VoltageElm, toInt } from '../core/internal';

export class VarRailElm extends RailElm {
    declare slider: Scrollbar;
    declare label: Label;
    declare sliderText: string;
    init$2(xx: number, yy: number): this {
        RailElm.prototype.init$3.call(this, xx, yy, VoltageElm.WF_VAR);
        this.sliderText = "Voltage";
        this.frequency = this.maxVoltage;
        this.createSlider();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        RailElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.sliderText = st.nextToken$0();
        while (st.hasMoreTokens()) {
            this.sliderText += String.fromCharCode(32) + st.nextToken$0();
        }
        this.sliderText = this.sliderText.replace(new RegExp("%2[bB]", 'g'), "+");
        this.createSlider();
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.sliderText.replace(new RegExp("\\+", 'g'), "%2B");
    }
    getDumpType(): number {
        return 172;
    }
    createSlider(): void {
        this.waveform = VoltageElm.WF_VAR;
        CircuitElm.sim.addWidgetToVerticalPanel(this.label = new Label(CirSim.LS(this.sliderText)));
        this.label.addStyleName("topSpace");
        let value: number = toInt(((this.frequency - this.bias) * 100 / (this.maxVoltage - this.bias)));
        CircuitElm.sim.addWidgetToVerticalPanel(this.slider = new Scrollbar(Scrollbar.HORIZONTAL, value, 1, 0, 101, null, this));
        //	    sim.verticalPanel.validate();
    }
    getVoltage(): number {
        this.frequency = this.slider.getValue() * (this.maxVoltage - this.bias) / 100. + this.bias;
        return this.frequency;
    }
    delete(): void {
        CircuitElm.sim.removeWidgetFromVerticalPanel(this.label);
        CircuitElm.sim.removeWidgetFromVerticalPanel(this.slider);
        super.delete();
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Min Voltage", this.bias, -20, 20);
        }
        if (n === 1) {
            return new EditInfo("Max Voltage", this.maxVoltage, -20, 20);
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("Slider Text", 0, -1, -1);
            ei.text = this.sliderText;
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.bias = ei.value;
        }
        if (n === 1) {
            this.maxVoltage = ei.value;
        }
        if (n === 2) {
            this.sliderText = ei.textf.getText();
            this.label.setText(CirSim.LS(this.sliderText));
            CircuitElm.sim.setiFrameHeight();
        }
    }
    getShortcut(): number {
        return 0;
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
Object.assign(VarRailElm.prototype, { "slider": null, "label": null, "sliderText": null });
