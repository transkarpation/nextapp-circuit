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

// Changed 2026-10-31: converted from LEDArrayElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, Color, Diode, DiodeModel, EditInfo, Graphics, StringTokenizer, idiv, newArray, parseJInt, toInt } from '../core/internal';

export class LEDArrayElm extends ChipElm {
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        try {
            this.sizeX = parseJInt(st.nextToken$0());
            this.sizeY = parseJInt(st.nextToken$0());
        } catch (e) {
        }
        this.allocNodes();
        this.setupPins();
        this.setPoints();
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.sizeX + " " + this.sizeY;
    }
    getChipName(): string {
        return "LED array";
    }
    setupPins(): void {
        if (this.sizeX === 0 || this.sizeY === 0) {
            this.sizeX = this.sizeY = 8;
            this.allocNodes();
        }
        this.pins = newArray(null, this.sizeX + this.sizeY);
        let i: number = 0;
        for (i = 0; i !== this.sizeX; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_S, "");
        }
        for (i = 0; i !== this.sizeY; i++) {
            this.pins[i + this.sizeX] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_W, "");
        }
        this.brightness = newArray(0, this.sizeX * this.sizeY);
    }
    declare diodes: Diode[];
    declare currents: number[];
    declare brightness: number[];
    stamp(): void {
        super.stamp();
        // create grid of diodes
        this.diodes = newArray(null, this.sizeX * this.sizeY);
        let i: number = 0;
        let model: DiodeModel = DiodeModel.getModelWithName("default-led");
        for (i = 0; i !== this.diodes.length; i++) {
            this.diodes[i] = new Diode().init$1(CircuitElm.sim);
            this.diodes[i].setup(model);
            this.diodes[i].stamp(this.nodes[this.sizeX + (idiv(i, this.sizeX))], this.nodes[i % this.sizeX]);
        }
        this.currents = newArray(0, this.diodes.length);
    }
    doStep(): void {
        super.doStep();
        let ix: number = 0, iy: number = 0, i: number = 0;
        for (iy = 0; iy !== this.sizeY; iy++) {
            for (ix = 0; ix !== this.sizeX; ix++, i++) {
                this.diodes[i].doStep(this.volts[this.sizeX + iy] - this.volts[ix]);
            }
        }
    }
    nonLinear(): boolean {
        return true;
    }
    draw(g: Graphics): void {
        this.drawChip(g);
        let ix: number = 0, iy: number = 0;
        for (ix = 0; ix !== this.sizeX; ix++) {
            for (iy = 0; iy !== this.sizeY; iy++) {
                let i: number = ix + iy * this.sizeX;
                this.setColor(g, i);
                g.fillOval(this.pins[ix].post.x - idiv(this.cspc, 2), this.pins[iy + this.sizeX].post.y - idiv(this.cspc, 2), this.cspc, this.cspc);
            }
        }
    }
    calculateCurrent(): void {
        // calculate diode currents
        let ix: number = 0, iy: number = 0, i: number = 0;
        for (ix = 0; ix !== this.sizeX; ix++) {
            this.pins[ix].current = 0;
        }
        for (iy = 0; iy !== this.sizeY; iy++) {
            let cur: number = 0;
            for (ix = 0; ix !== this.sizeX; ix++, i++) {
                this.currents[i] = this.diodes[i].calculateCurrent(this.volts[this.sizeX + iy] - this.volts[ix]);
                cur += this.currents[i];
                this.pins[ix].current += this.currents[i];
            }
            this.pins[iy + this.sizeX].current = -cur;
        }
    }
    stepFinished(): void {
        // stop for huge currents that make simulator act weird
        let i: number = 0;
        for (i = 0; i !== this.currents.length; i++) {
            if (Math.abs(this.currents[i]) > 1e12) {
                CircuitElm.sim.stop("max current exceeded", this);
            }
        }
    }
    setColor(g: Graphics, p: number): void {
        // 10mA current = max brightness
        if (this.currents == null) {
            g.setColor(new Color().init$int_int_int(20, 0, 0));
            return;
        }
        let w: number = this.currents[p] / .01;
        if (w > 0) {
            w = 255 * (1 + .2 * Math.log(w));
        }
        if (w > 255) {
            w = 255;
        }
        if (w < 20) {
            w = 20;
        }
        // when diode turns off, made it fade gradually to simulate persistence of vision
        w = Math.max(w, this.brightness[p]);
        this.brightness[p] = w * .99;
        let cc: Color = new Color().init$int_int_int(toInt(w), 0, 0);
        g.setColor(cc);
    }
    getPostCount(): number {
        return this.sizeX + this.sizeY;
    }
    getVoltageSourceCount(): number {
        return 0;
    }
    getDumpType(): number {
        return 405;
    }
    // this is true but it causes strange behavior with unconnected pins so we don't do it
    //	boolean getConnection(int n1, int n2) { return true; }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            return new EditInfo("Grid Width", this.sizeX).setDimensionless();
        }
        if (n === 3) {
            return new EditInfo("Grid Height", this.sizeY).setDimensionless();
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2 && ei.value >= 2 && ei.value <= 16) {
            this.sizeX = toInt(ei.value);
            this.allocNodes();
            this.setupPins();
            this.setPoints();
            return;
        }
        if (n === 3 && ei.value >= 2 && ei.value <= 16) {
            this.sizeY = toInt(ei.value);
            this.allocNodes();
            this.setupPins();
            this.setPoints();
            return;
        }
        super.setEditValue(n, ei);
    }
    // default getInfo doesn't work because the pins are unlabeled
    getInfo(arr: string[]): void {
        arr[0] = this.getChipName();
        return;
    }
}
Object.assign(LEDArrayElm.prototype, { "diodes": null, "currents": null, "brightness": null });
