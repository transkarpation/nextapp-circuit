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

// Changed 2026-10-31: converted from CrystalElm.java to TypeScript.
/* eslint-disable */
import { CapacitorElm, CirSim, CircuitElm, Color, CompositeElm, EditInfo, Graphics, InductorElm, Point, ResistorElm, StringTokenizer } from '../core/internal';

export class CrystalElm extends CompositeElm {
    declare seriesCapacitance: number;
    declare parallelCapacitance: number;
    declare inductance: number;
    declare resistance: number;
    declare plate1: Point[];
    declare plate2: Point[];
    static modelString: string = "CapacitorElm 1 2\rCapacitorElm 1 3\rInductorElm 3 4\rResistorElm 4 2";
    static modelExternalNodes: number[] = [1, 2];
    init$2(xx: number, yy: number): this {
        CompositeElm.prototype.init$4.call(this, xx, yy, CrystalElm.modelString, CrystalElm.modelExternalNodes);
        this.parallelCapacitance = 28.7e-12;
        this.seriesCapacitance = 0.1e-12;
        this.inductance = 2.5e-3;
        this.resistance = 6.4;
        this.initCrystal();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CompositeElm.prototype.init$8.call(this, xa, ya, xb, yb, f, st, CrystalElm.modelString, CrystalElm.modelExternalNodes);
        let c1: CapacitorElm = (this.compElmList.get(0) as any as CapacitorElm);
        this.parallelCapacitance = c1.getCapacitance();
        let c2: CapacitorElm = (this.compElmList.get(1) as any as CapacitorElm);
        this.seriesCapacitance = c2.getCapacitance();
        let i1: InductorElm = (this.compElmList.get(2) as any as InductorElm);
        this.inductance = i1.getInductance();
        let r1: ResistorElm = (this.compElmList.get(3) as any as ResistorElm);
        this.resistance = r1.getResistance();
        this.initCrystal();
        return this;
    }
    initCrystal(): void {
        let c1: CapacitorElm = (this.compElmList.get(0) as any as CapacitorElm);
        c1.setCapacitance(this.parallelCapacitance);
        let c2: CapacitorElm = (this.compElmList.get(1) as any as CapacitorElm);
        c2.setCapacitance(this.seriesCapacitance);
        let i1: InductorElm = (this.compElmList.get(2) as any as InductorElm);
        i1.setInductance(this.inductance);
        let r1: ResistorElm = (this.compElmList.get(3) as any as ResistorElm);
        r1.setResistance(this.resistance);
    }
    getDumpType(): number {
        return 412;
    }
    declare sandwichPoints: Point[];
    setPoints(): void {
        super.setPoints();
        let f: number = (this.dn / 2 - 10) / this.dn;
        // calc leads
        this.lead1 = this.interpPoint$3(this.point1, this.point2, f);
        this.lead2 = this.interpPoint$3(this.point1, this.point2, 1 - f);
        // calc plates
        this.plate1 = this.newPointArray(2);
        this.plate2 = this.newPointArray(2);
        this.interpPoint2(this.point1, this.point2, this.plate1[0], this.plate1[1], f, 8);
        this.interpPoint2(this.point1, this.point2, this.plate2[0], this.plate2[1], 1 - f, 8);
        this.sandwichPoints = this.newPointArray(4);
        let f2: number = (this.dn / 2 - 5) / this.dn;
        this.interpPoint2(this.point1, this.point2, this.sandwichPoints[0], this.sandwichPoints[1], f2, 10);
        this.interpPoint2(this.point1, this.point2, this.sandwichPoints[3], this.sandwichPoints[2], 1 - f2, 10);
        // need to do this explicitly for CompositeElms
        this.setPost$2(0, this.point1);
        this.setPost$2(1, this.point2);
    }
    draw(g: Graphics): void {
        let hs: number = 12;
        this.setBbox$3(this.point1, this.point2, hs);
        // draw first lead and plate
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.setPowerColor$Graphics_bool(g, false);
        CircuitElm.drawThickLine$3(g, this.plate1[0], this.plate1[1]);
        if (CircuitElm.sim.powerCheckItem.getState()) {
            g.setColor(Color.gray);
        }
        // draw second lead and plate
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.point2, this.lead2);
        this.setPowerColor$Graphics_bool(g, false);
        CircuitElm.drawThickLine$3(g, this.plate2[0], this.plate2[1]);
        let i: number = 0;
        this.setVoltageColor(g, .5 * (this.volts[0] + this.volts[1]));
        for (i = 0; i !== 4; i++) {
            CircuitElm.drawThickLine$3(g, this.sandwichPoints[i], this.sandwichPoints[(i + 1) % 4]);
        }
        this.updateDotCount$0();
        if (CircuitElm.sim.dragElm !== this) {
            this.drawDots(g, this.point1, this.lead1, this.curcount);
            this.drawDots(g, this.point2, this.lead2, -this.curcount);
        }
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = this.getCurrentIntoNode(1);
    }
    getInfo(arr: string[]): void {
        arr[0] = "crystal";
        this.getBasicInfo(arr);
        //	    arr[3] = "C = " + getUnitText(capacitance, "F");
        //	    arr[4] = "P = " + getUnitText(getPower(), "W");
        //double v = getVoltageDiff();
        //arr[4] = "U = " + getUnitText(.5*capacitance*v*v, "J");
    }
    canViewInScope(): boolean {
        return true;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo(EditInfo.makeLink("crystal.html", "Parallel Capacitance"), this.parallelCapacitance);
        }
        if (n === 1) {
            return new EditInfo("Series Capacitance (F)", this.seriesCapacitance);
        }
        if (n === 2) {
            return new EditInfo("Inductance (H)", this.inductance, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("Resistance (" + CirSim.ohmString + ")", this.resistance, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.parallelCapacitance = ei.value;
        }
        if (n === 1 && ei.value > 0) {
            this.seriesCapacitance = ei.value;
        }
        if (n === 2 && ei.value > 0) {
            this.inductance = ei.value;
        }
        if (n === 3 && ei.value > 0) {
            this.resistance = ei.value;
        }
        this.initCrystal();
    }
}
Object.assign(CrystalElm.prototype, { "seriesCapacitance": 0, "parallelCapacitance": 0, "inductance": 0, "resistance": 0, "plate1": null, "plate2": null, "sandwichPoints": null });
