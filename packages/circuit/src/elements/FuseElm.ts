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

// Changed 2026-10-31: converted from FuseElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Color, EditInfo, Graphics, StringTokenizer, idiv, javaBoolean, parseJDouble, toInt } from '../core/internal';

export class FuseElm extends CircuitElm {
    declare resistance: number;
    declare heat: number;
    declare i2t: number;
    declare blown: boolean;
    declare blownResistance: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        // from https://m.littelfuse.com/~/media/electronics/datasheets/fuses/littelfuse_fuse_218_datasheet.pdf.pdf
        this.i2t = 6.73;
        this.resistance = .0613;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.resistance = parseJDouble(st.nextToken$0());
        this.i2t = parseJDouble(st.nextToken$0());
        this.heat = parseJDouble(st.nextToken$0());
        this.blown = javaBoolean(st.nextToken$0());
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.resistance + " " + this.i2t + " " + this.heat + " " + this.blown;
    }
    getDumpType(): number {
        return 404;
    }
    reset(): void {
        super.reset();
        this.heat = 0;
        this.blown = false;
    }
    setPoints(): void {
        super.setPoints();
        let llen: number = 16;
        this.calcLeads(llen);
    }
    getTempColor$1(g: Graphics): Color {
        let c: Color = this.getVoltageColor(g, this.volts[0]);
        let temp: number = this.heat / this.i2t;
        if (temp < .3333) {
            let val: number = temp * 3;
            let x: number = toInt((255 * val));
            if (x < 0) {
                x = 0;
            }
            return new Color().init$int_int_int(x + idiv((255 - x) * c.getRed(), 255), idiv((255 - x) * c.getGreen(), 255), idiv((255 - x) * c.getBlue(), 255));
        }
        if (temp < .6667) {
            let x: number = toInt(((temp - .3333) * 3 * 255));
            if (x < 0) {
                x = 0;
            }
            return new Color().init$int_int_int(255, x, 0);
        }
        if (temp < 1) {
            let x: number = toInt(((temp - .6666) * 3 * 255));
            if (x < 0) {
                x = 0;
            }
            return new Color().init$int_int_int(255, 255, x);
        }
        return Color.white;
    }
    draw(g: Graphics): void {
        let segments: number = 16;
        let i: number = 0;
        let hs: number = 6;
        this.setBbox$3(this.point1, this.point2, hs);
        this.draw2Leads(g);
        //   double segf = 1./segments;
        let len: number = CircuitElm.distance(this.lead1, this.lead2);
        g.context.save();
        g.context.setLineWidth(3.0);
        g.context.transform(((this.lead2.x - this.lead1.x)) / len, ((this.lead2.y - this.lead1.y)) / len, -((this.lead2.y - this.lead1.y)) / len, ((this.lead2.x - this.lead1.x)) / len, this.lead1.x, this.lead1.y);
        g.context.setStrokeStyle(this.getTempColor$1(g).getHexValue());
        if (!this.blown) {
            g.context.beginPath();
            g.context.moveTo(0, 0);
            for (i = 0; i <= segments; i++) {
                g.context.lineTo(i * len / segments, hs * Math.sin(i * Math.PI * 2 / segments));
            }
            g.context.stroke();
        }
        g.context.restore();
        this.doDots(g);
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / (this.blown ? this.blownResistance : this.resistance);
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
    }
    nonLinear(): boolean {
        return true;
    }
    startIteration(): void {
        let i: number = this.getCurrent();
        // accumulate heat
        this.heat += i * i * CircuitElm.sim.timeStep;
        // dissipate heat.  we assume the fuse can dissipate its entire i2t in 3 seconds
        this.heat -= CircuitElm.sim.timeStep * this.i2t / 3;
        if (this.heat < 0) {
            this.heat = 0;
        }
        if (this.heat > this.i2t) {
            this.blown = true;
        }
    }
    doStep(): void {
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.blown ? this.blownResistance : this.resistance);
    }
    getInfo(arr: string[]): void {
        arr[0] = this.blown ? "fuse (blown)" : "fuse";
        this.getBasicInfo(arr);
        arr[3] = "R = " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
        arr[4] = "I2t = " + this.i2t;
        if (!this.blown) {
            arr[5] = (toInt((this.heat * 100 / this.i2t))) + "% " + CirSim.LS("melted");
        }
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("I2t", this.i2t, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Resistance", this.resistance, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.i2t = ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.resistance = ei.value;
        }
    }
}
Object.assign(FuseElm.prototype, { "resistance": 0, "heat": 0, "i2t": 0, "blown": false, "blownResistance": 1e9 });
