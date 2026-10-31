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

// Changed 2026-10-31: converted from StopTriggerElm.java to TypeScript.
/* eslint-disable */
import { Choice, CircuitElm, EditInfo, Font, Graphics, Point, StringTokenizer, idiv, parseJDouble, parseJInt, toInt } from '../core/internal';

export class StopTriggerElm extends CircuitElm {
    declare triggerVoltage: number;
    declare triggered: boolean;
    declare stopped: boolean;
    declare delay: number;
    declare triggerTime: number;
    declare type: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.triggerVoltage = 1;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.triggerVoltage = parseJDouble(st.nextToken$0());
        this.type = parseJInt(st.nextToken$0());
        this.delay = parseJDouble(st.nextToken$0());
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.triggerVoltage + " " + this.type + " " + this.delay;
    }
    reset(): void {
        this.triggered = false;
    }
    getDumpType(): number {
        return 408;
    }
    getPostCount(): number {
        return 1;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = new Point().init$0();
    }
    draw(g: Graphics): void {
        let selected: boolean = this.needsHighlight() || this.stopped;
        let f: Font = new Font().init$3("SansSerif", selected ? Font.BOLD : 0, 14);
        g.setFont(f);
        g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
        let s: string = "trigger";
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.lead1, 1 - (idiv(toInt(g.context.measureText(s).getWidth()), 2) + 8) / this.dn);
        this.setBbox$3(this.point1, this.lead1, 0);
        this.drawCenteredText(g, s, this.x2, this.y2, true);
        this.setVoltageColor(g, this.volts[0]);
        if (selected) {
            g.setColor(CircuitElm.selectColor);
        }
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.drawPosts(g);
    }
    stepFinished(): void {
        this.stopped = false;
        if (!this.triggered && ((this.type === 0 && this.volts[0] >= this.triggerVoltage) || (this.type === 1 && this.volts[0] <= this.triggerVoltage))) {
            this.triggered = true;
            this.triggerTime = CircuitElm.sim.t;
        }
        if (this.triggered && CircuitElm.sim.t >= this.triggerTime + this.delay) {
            this.triggered = false;
            this.stopped = true;
            CircuitElm.sim.setSimRunning(false);
        }
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "stop trigger";
        arr[1] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[2] = "Vtrigger = " + CircuitElm.getVoltageText(this.triggerVoltage);
        arr[3] = (this.triggered) ? ("stopping in " + CircuitElm.getUnitText$2(this.triggerTime + this.delay - CircuitElm.sim.t, "s")) : (this.stopped) ? "stopped" : "waiting";
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Voltage", this.triggerVoltage);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("Trigger Type", this.type, -1, -1);
            ei.choice = new Choice();
            ei.choice.add(">=");
            ei.choice.add("<=");
            ei.choice.select(this.type);
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("Delay (s)", this.delay);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.triggerVoltage = ei.value;
        }
        if (n === 1) {
            this.type = ei.choice.getSelectedIndex();
        }
        if (n === 2) {
            this.delay = ei.value;
        }
    }
}
Object.assign(StopTriggerElm.prototype, { "triggerVoltage": 0, "triggered": false, "stopped": false, "delay": 0, "triggerTime": 0, "type": 0 });
