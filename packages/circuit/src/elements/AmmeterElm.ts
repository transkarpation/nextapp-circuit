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
    
    AmmeterElm by Bill Collis
    
*/

// Changed 2026-10-31: converted from AmmeterElm.java to TypeScript.
/* eslint-disable */
import { Choice, CirSim, CircuitElm, EditInfo, Graphics, Point, Polygon, StringTokenizer, parseJInt } from '../core/internal';

export class AmmeterElm extends CircuitElm {
    declare meter: number;
    declare scale: number;
    declare AM_VOL: number;
    declare AM_RMS: number;
    declare zerocount: number;
    declare rmsI: number;
    declare total: number;
    declare count: number;
    declare maxI: number;
    declare lastMaxI: number;
    declare minI: number;
    declare lastMinI: number;
    declare selectedValue: number;
    declare currents: number[];
    declare increasingI: boolean;
    declare decreasingI: boolean;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.zerocount = 0;
        this.rmsI = 0;
        this.maxI = 0;
        this.minI = 0;
        this.selectedValue = 0;
        this.increasingI = true;
        this.decreasingI = true;
        this.flags = AmmeterElm.FLAG_SHOWCURRENT;
        this.scale = CircuitElm.SCALE_AUTO;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.zerocount = 0;
        this.rmsI = 0;
        this.maxI = 0;
        this.minI = 0;
        this.selectedValue = 0;
        this.increasingI = true;
        this.decreasingI = true;
        this.scale = CircuitElm.SCALE_AUTO;
        this.meter = parseJInt(st.nextToken$0());
        try {
            this.scale = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.meter + " " + this.scale;
    }
    getMeter(): string {
        switch (this.meter) {
            case this.AM_VOL:
                return "I";
            case this.AM_RMS:
                return "Irms";
        }
        return "";
    }
    setPoints(): void {
        super.setPoints();
        this.mid = this.interpPoint$3(this.point1, this.point2, 0.6);
        this.arrowPoly = this.calcArrow(this.point1, this.mid, 14, 7);
    }
    declare mid: Point;
    static FLAG_SHOWCURRENT: number = 1;
    stepFinished(): void {
        this.count++;
        //how many counts are in a cycle
        this.total += this.current * this.current;
        //sum of squares
        if (this.current > this.maxI && this.increasingI) {
            this.maxI = this.current;
            this.increasingI = true;
            this.decreasingI = false;
        }
        if (this.current < this.maxI && this.increasingI) {
            //change of direction I now going down - at start of waveform
            this.lastMaxI = this.maxI;
            //capture last maximum
            //capture time between
            this.minI = this.current;
            //track minimum value
            this.increasingI = false;
            this.decreasingI = true;
            //rms data
            this.total = this.total / this.count;
            this.rmsI = Math.sqrt(this.total);
            if (Number.isNaN(this.rmsI)) {
                this.rmsI = 0;
            }
            this.count = 0;
            this.total = 0;
        }
        if (this.current < this.minI && this.decreasingI) {
            //I going down, track minimum value
            this.minI = this.current;
            this.increasingI = false;
            this.decreasingI = true;
        }
        if (this.current > this.minI && this.decreasingI) {
            //change of direction I now going up
            this.lastMinI = this.minI;
            //capture last minimum
            this.maxI = this.current;
            this.increasingI = true;
            this.decreasingI = false;
            //rms data
            this.total = this.total / this.count;
            this.rmsI = Math.sqrt(this.total);
            if (Number.isNaN(this.rmsI)) {
                this.rmsI = 0;
            }
            this.count = 0;
            this.total = 0;
        }
        //need to zero the rms value if it stays at 0 for a while
        if (this.current === 0) {
            this.zerocount++;
            if (this.zerocount > 5) {
                this.total = 0;
                this.rmsI = 0;
                this.maxI = 0;
                this.minI = 0;
            }
        } else {
            this.zerocount = 0;
        }
        switch (this.meter) {
            case this.AM_VOL:
                this.selectedValue = this.current;
                break;
            case this.AM_RMS:
                this.selectedValue = this.rmsI;
                break;
        }
    }
    declare arrowPoly: Polygon;
    draw(g: Graphics): void {
        super.draw(g);
        //BC required for highlighting
        this.setVoltageColor(g, this.volts[0]);
        CircuitElm.drawThickLine$3(g, this.point1, this.point2);
        g.fillPolygon(this.arrowPoly);
        this.doDots(g);
        this.setBbox$3(this.point1, this.point2, 3);
        let s: string = "A";
        switch (this.meter) {
            case this.AM_VOL:
                s = CircuitElm.getUnitTextWithScale(this.getCurrent(), "A", this.scale);
                break;
            case this.AM_RMS:
                s = CircuitElm.getUnitTextWithScale(this.rmsI, "A(rms)", this.scale);
                break;
        }
        this.drawValues$3(g, s, 4);
        this.drawPosts(g);
    }
    getDumpType(): number {
        return 370;
    }
    stamp(): void {
        CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSource, 0);
    }
    mustShowCurrent(): boolean {
        return (this.flags & AmmeterElm.FLAG_SHOWCURRENT) !== 0;
    }
    getVoltageSourceCount(): number {
        return 1;
    }
    getInfo(arr: string[]): void {
        arr[0] = "Ammeter";
        switch (this.meter) {
            case this.AM_VOL:
                arr[1] = "I = " + CircuitElm.getUnitText$2(this.current, "A");
                break;
            case this.AM_RMS:
                arr[1] = "Irms = " + CircuitElm.getUnitText$2(this.rmsI, "A");
                break;
        }
    }
    getPower(): number {
        return 0;
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    isWire(): boolean {
        return true;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Value", this.selectedValue, -1, -1);
            ei.choice = new Choice();
            ei.choice.add("Current");
            ei.choice.add("RMS Current");
            ei.choice.select(this.meter);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("Scale", 0);
            ei.choice = new Choice();
            ei.choice.add("Auto");
            ei.choice.add("A");
            ei.choice.add("mA");
            ei.choice.add(CirSim.muString + "A");
            ei.choice.select(this.scale);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.meter = ei.choice.getSelectedIndex();
        }
        if (n === 1) {
            this.scale = ei.choice.getSelectedIndex();
        }
    }
}
Object.assign(AmmeterElm.prototype, { "meter": 0, "scale": 0, "AM_VOL": 0, "AM_RMS": 1, "zerocount": 0, "rmsI": 0, "total": 0, "count": 0, "maxI": 0, "lastMaxI": 0, "minI": 0, "lastMinI": 0, "selectedValue": 0, "currents": null, "increasingI": false, "decreasingI": false, "mid": null, "arrowPoly": null });
