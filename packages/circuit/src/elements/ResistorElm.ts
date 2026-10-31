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

// Changed 2026-10-31: converted from ResistorElm.java to TypeScript.
/* eslint-disable */
import { CanvasGradient, CirSim, CircuitElm, EditInfo, Graphics, Point, StringTokenizer, parseJDouble } from '../core/internal';

export class ResistorElm extends CircuitElm {
    declare resistance: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.resistance = 1000;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.resistance = parseJDouble(st.nextToken$0());
        return this;
    }
    getDumpType(): number {
        return 114;
    }
    dump(): string {
        return super.dump() + " " + this.resistance;
    }
    declare ps3: Point;
    declare ps4: Point;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.ps3 = new Point().init$0();
        this.ps4 = new Point().init$0();
    }
    draw(g: Graphics): void {
        let segments: number = 16;
        let i: number = 0;
        let ox: number = 0;
        //int hs = sim.euroResistorCheckItem.getState() ? 6 : 8;
        let hs: number = 6;
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.setBbox$3(this.point1, this.point2, hs);
        this.draw2Leads(g);
        //   double segf = 1./segments;
        let len: number = CircuitElm.distance(this.lead1, this.lead2);
        g.context.save();
        g.context.setLineWidth(3.0);
        g.context.transform(((this.lead2.x - this.lead1.x)) / len, ((this.lead2.y - this.lead1.y)) / len, -((this.lead2.y - this.lead1.y)) / len, ((this.lead2.x - this.lead1.x)) / len, this.lead1.x, this.lead1.y);
        if (CircuitElm.sim.voltsCheckItem.getState()) {
            let grad: CanvasGradient = g.context.createLinearGradient(0, 0, len, 0);
            grad.addColorStop(0, this.getVoltageColor(g, v1).getHexValue());
            grad.addColorStop(1.0, this.getVoltageColor(g, v2).getHexValue());
            g.context.setStrokeStyle(grad);
        } else {
            this.setPowerColor$Graphics_bool(g, true);
        }
        if (!CircuitElm.sim.euroResistorCheckItem.getState()) {
            g.context.beginPath();
            g.context.moveTo(0, 0);
            for (i = 0; i < 4; i++) {
                g.context.lineTo((1 + 4 * i) * len / 16, hs);
                g.context.lineTo((3 + 4 * i) * len / 16, -hs);
            }
            g.context.lineTo(len, 0);
            g.context.stroke();
        } else {
            g.context.strokeRect(0, -hs, len, 2.0 * hs);
        }
        g.context.restore();
        if (CircuitElm.sim.showValuesCheckItem.getState()) {
            let s: string = CircuitElm.getShortUnitText(this.resistance, "");
            this.drawValues$3(g, s, hs + 2);
        }
        this.doDots(g);
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / this.resistance;
        //System.out.print(this + " res current set to " + current + "\n");
    }
    stamp(): void {
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
    }
    getInfo(arr: string[]): void {
        arr[0] = "resistor";
        this.getBasicInfo(arr);
        arr[3] = "R = " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
        arr[4] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getScopeText(v: number): string {
        return CirSim.LS("resistor") + ", " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
    }
    getEditInfo(n: number): EditInfo {
        // ohmString doesn't work here on linux
        if (n === 0) {
            return new EditInfo("Resistance (ohms)", this.resistance, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (ei.value > 0) {
            this.resistance = ei.value;
        }
    }
    getShortcut(): number {
        return 114;
    }
    getResistance(): number {
        return this.resistance;
    }
    setResistance(r: number): void {
        this.resistance = r;
    }
}
Object.assign(ResistorElm.prototype, { "resistance": 0, "ps3": null, "ps4": null });
