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

// Changed 2026-10-31: converted from LampElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Color, EditInfo, Graphics, Point, Scope, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class LampElm extends CircuitElm {
    declare resistance: number;
    declare roomTemp: number;
    declare temp: number;
    declare nom_pow: number;
    declare nom_v: number;
    declare warmTime: number;
    declare coolTime: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.temp = this.roomTemp;
        this.nom_pow = 100;
        this.nom_v = 120;
        this.warmTime = .4;
        this.coolTime = .4;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.temp = parseJDouble(st.nextToken$0());
        if (Number.isNaN(this.temp)) {
            this.temp = this.roomTemp;
        }
        this.nom_pow = parseJDouble(st.nextToken$0());
        this.nom_v = parseJDouble(st.nextToken$0());
        this.warmTime = parseJDouble(st.nextToken$0());
        this.coolTime = parseJDouble(st.nextToken$0());
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.temp + " " + this.nom_pow + " " + this.nom_v + " " + this.warmTime + " " + this.coolTime;
    }
    getDumpType(): number {
        return 181;
    }
    declare bulbLead: Point[];
    declare filament: Point[];
    declare bulb: Point;
    declare bulbR: number;
    reset(): void {
        super.reset();
        this.temp = this.roomTemp;
        // make sure resistance is not 0 or NaN or current will be NaN before we have a chance
        // to call startIteration()
        this.resistance = 100;
    }
    declare filament_len: number;
    setPoints(): void {
        super.setPoints();
        let llen: number = 16;
        this.calcLeads(llen);
        this.bulbLead = this.newPointArray(2);
        this.filament = this.newPointArray(2);
        this.bulbR = 20;
        this.filament[0] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 0, this.filament_len);
        this.filament[1] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1, this.filament_len);
        let br: number = this.filament_len - Math.sqrt(this.bulbR * this.bulbR - llen * llen);
        this.bulbLead[0] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 0, br);
        this.bulbLead[1] = this.interpPoint$Point_Point_dbl_dbl(this.lead1, this.lead2, 1, br);
        this.bulb = this.interpPoint$3(this.filament[0], this.filament[1], .5);
    }
    getTempColor$0(): Color {
        if (this.temp < 1200) {
            let x: number = toInt((255 * (this.temp - 800) / 400));
            if (x < 0) {
                x = 0;
            }
            return new Color().init$int_int_int(x, 0, 0);
        }
        if (this.temp < 1700) {
            let x: number = toInt((255 * (this.temp - 1200) / 500));
            if (x < 0) {
                x = 0;
            }
            return new Color().init$int_int_int(255, x, 0);
        }
        if (this.temp < 2400) {
            let x: number = toInt((255 * (this.temp - 1700) / 700));
            if (x < 0) {
                x = 0;
            }
            return new Color().init$int_int_int(255, 255, x);
        }
        return Color.white;
    }
    draw(g: Graphics): void {
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.setBbox$3(this.point1, this.point2, 4);
        this.adjustBbox$4(this.bulb.x - this.bulbR, this.bulb.y - this.bulbR, this.bulb.x + this.bulbR, this.bulb.y + this.bulbR);
        // adjustbbox
        this.draw2Leads(g);
        this.setPowerColor$Graphics_bool(g, true);
        g.setColor(this.getTempColor$0());
        g.fillOval(this.bulb.x - this.bulbR, this.bulb.y - this.bulbR, this.bulbR * 2, this.bulbR * 2);
        g.setColor(Color.white);
        CircuitElm.drawThickCircle(g, this.bulb.x, this.bulb.y, this.bulbR);
        this.setVoltageColor(g, v1);
        CircuitElm.drawThickLine$3(g, this.lead1, this.filament[0]);
        this.setVoltageColor(g, v2);
        CircuitElm.drawThickLine$3(g, this.lead2, this.filament[1]);
        this.setVoltageColor(g, (v1 + v2) * .5);
        CircuitElm.drawThickLine$3(g, this.filament[0], this.filament[1]);
        this.updateDotCount$0();
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead1, this.curcount);
            let cc: number = this.curcount + (this.dn - 16) / 2;
            this.drawDots(g, this.lead1, this.filament[0], cc);
            cc += this.filament_len;
            this.drawDots(g, this.filament[0], this.filament[1], cc);
            cc += 16;
            this.drawDots(g, this.filament[1], this.lead2, cc);
            cc += this.filament_len;
            this.drawDots(g, this.lead2, this.point2, this.curcount);
        }
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / this.resistance;
        if (this.resistance === 0) {
            this.current = 0;
        }
        //	    sim.console("lampcc " + current + " " + resistance);
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
    }
    nonLinear(): boolean {
        return true;
    }
    startIteration(): void {
        // based on http://www.intusoft.com/nlpdf/nl11.pdf
        let nom_r: number = this.nom_v * this.nom_v / this.nom_pow;
        // this formula doesn't work for values over 5390
        let tp: number = (this.temp > 5390) ? 5390 : this.temp;
        this.resistance = nom_r * (1.26104 - 4.90662 * Math.sqrt(17.1839 / tp - 0.00318794) - 7.8569 / (tp - 187.56));
        let cap: number = 1.57e-4 * this.nom_pow;
        let capw: number = cap * this.warmTime / .4;
        let capc: number = cap * this.coolTime / .4;
        //System.out.println(nom_r + " " + (resistance/nom_r));
        this.temp += this.getPower() * CircuitElm.sim.timeStep / capw;
        let cr: number = 2600 / this.nom_pow;
        this.temp -= CircuitElm.sim.timeStep * (this.temp - this.roomTemp) / (capc * cr);
        //	    sim.console("lampsi " + temp + " " + capc + " " + nom_pow);
    }
    doStep(): void {
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
    }
    getInfo(arr: string[]): void {
        arr[0] = "lamp";
        this.getBasicInfo(arr);
        arr[3] = "R = " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
        arr[4] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
        arr[5] = "T = " + (toInt(this.temp)) + " K";
    }
    getEditInfo(n: number): EditInfo {
        // ohmString doesn't work here on linux
        if (n === 0) {
            return new EditInfo("Nominal Power", this.nom_pow, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Nominal Voltage", this.nom_v, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Warmup Time (s)", this.warmTime, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("Cooldown Time (s)", this.coolTime, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.nom_pow = ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.nom_v = ei.value;
        }
        if (n === 2 && ei.value > 0) {
            this.warmTime = ei.value;
        }
        if (n === 3 && ei.value > 0) {
            this.coolTime = ei.value;
        }
    }
    getScopeValue(x: number): number {
        return (x === Scope.VAL_R) ? this.resistance : super.getScopeValue(x);
    }
    getScopeUnits(x: number): number {
        return (x === Scope.VAL_R) ? Scope.UNITS_OHMS : super.getScopeUnits(x);
    }
    canShowValueInScope(x: number): boolean {
        return x === Scope.VAL_R;
    }
}
Object.assign(LampElm.prototype, { "resistance": 0, "roomTemp": 300, "temp": 0, "nom_pow": 0, "nom_v": 0, "warmTime": 0, "coolTime": 0, "bulbLead": null, "filament": null, "bulb": null, "bulbR": 0, "filament_len": 24 });
