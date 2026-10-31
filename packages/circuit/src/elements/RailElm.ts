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

// Changed 2026-10-31: converted from RailElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Graphics, StringTokenizer, VoltageElm } from '../core/internal';

export class RailElm extends VoltageElm {
    init$2(xx: number, yy: number): this {
        VoltageElm.prototype.init$3.call(this, xx, yy, VoltageElm.WF_DC);
        return this;
    }
    init$3(xx: number, yy: number, wf: number): this {
        VoltageElm.prototype.init$3.call(this, xx, yy, wf);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        VoltageElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    declare FLAG_CLOCK: number;
    getDumpType(): number {
        return 82;
    }
    getPostCount(): number {
        return 1;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = this.interpPoint$3(this.point1, this.point2, 1 - this.circleSize / this.dn);
    }
    getRailText(): string {
        return null;
    }
    draw(g: Graphics): void {
        let rt: string = this.getRailText();
        let w: number = rt == null ? this.circleSize : g.context.measureText(rt).getWidth() / 2;
        if (w > this.dn * .8) {
            w = this.dn * .8;
        }
        this.lead1 = this.interpPoint$3(this.point1, this.point2, 1 - w / this.dn);
        this.setBbox$3(this.point1, this.point2, this.circleSize);
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.drawRail(g);
        this.drawPosts(g);
        this.curcount = this.updateDotCount$2(-this.current, this.curcount);
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead1, this.curcount);
        }
    }
    drawRail(g: Graphics): void {
        if (this.waveform === VoltageElm.WF_SQUARE && (this.flags & this.FLAG_CLOCK) !== 0) {
            this.drawRailText(g, "CLK");
        } else if (this.waveform === VoltageElm.WF_DC || this.waveform === VoltageElm.WF_VAR) {
            g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
            this.setPowerColor$Graphics_bool(g, false);
            let v: number = this.getVoltage();
            let s: string = null as any;
            if (Math.abs(v) < 1) {
                s = CircuitElm.showFormat.format(v) + " V";
            } else {
                s = CircuitElm.getShortUnitText(v, "V");
            }
            if (this.getVoltage() > 0) {
                s = "+" + s;
            }
            this.drawCenteredText(g, s, this.x2, this.y2, true);
        } else {
            this.drawWaveform(g, this.point2);
        }
    }
    drawRailText(g: Graphics, s: string): void {
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
        this.setPowerColor$Graphics_bool(g, false);
        this.drawCenteredText(g, s, this.x2, this.y2, true);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    stamp(): void {
        if (this.waveform === VoltageElm.WF_DC) {
            CircuitElm.sim.stampVoltageSource(0, this.nodes[0], this.voltSource, this.getVoltage());
        } else {
            CircuitElm.sim.stampVoltageSource(0, this.nodes[0], this.voltSource);
        }
    }
    doStep(): void {
        if (this.waveform !== VoltageElm.WF_DC) {
            CircuitElm.sim.updateVoltageSource(0, this.nodes[0], this.voltSource, this.getVoltage());
        }
    }
    hasGroundConnection(n1: number): boolean {
        return true;
    }
    getShortcut(): number {
        return 86;
    }
    //    void drawHandles(Graphics g, Color c) {
    //    	g.setColor(c);
    //		g.fillRect(x-3, y-3, 7, 7);
    //    }
}
Object.assign(RailElm.prototype, { "FLAG_CLOCK": 1 });
