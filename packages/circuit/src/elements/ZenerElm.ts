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
// Zener code contributed by J. Mike Rollins
// http://www.camotruck.net/rollins/simulator.html

// Changed 2026-10-31: converted from ZenerElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, DiodeElm, DiodeModel, Graphics, Point, Polygon, StringTokenizer, parseJDouble } from '../core/internal';

export class ZenerElm extends DiodeElm {
    static lastZenerModelName: string = "default-zener";
    init$2(xx: number, yy: number): this {
        DiodeElm.prototype.init$2.call(this, xx, yy);
        this.modelName = ZenerElm.lastZenerModelName;
        this.setup();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        DiodeElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        if ((f & DiodeElm.FLAG_MODEL) === 0) {
            let zvoltage: number = parseJDouble(st.nextToken$0());
            this.model = DiodeModel.getModelWithParameters(this.model.fwdrop, zvoltage);
            this.modelName = this.model.name;
            CirSim.console("model name wparams = " + this.modelName);
        }
        this.setup();
        return this;
    }
    getDumpType(): number {
        return 122;
    }
    declare hs$ZenerElm: number;
    declare poly$ZenerElm: Polygon;
    declare cathode$ZenerElm: Point[];
    declare wing: Point[];
    setPoints(): void {
        super.setPoints();
        this.calcLeads(16);
        this.cathode$ZenerElm = this.newPointArray(2);
        this.wing = this.newPointArray(2);
        let pa: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs$ZenerElm);
        this.interpPoint2(this.lead1, this.lead2, this.cathode$ZenerElm[0], this.cathode$ZenerElm[1], 1, this.hs$ZenerElm);
        this.interpPoint$5(this.cathode$ZenerElm[0], this.cathode$ZenerElm[1], this.wing[0], -0.2, -this.hs$ZenerElm);
        this.interpPoint$5(this.cathode$ZenerElm[1], this.cathode$ZenerElm[0], this.wing[1], -0.2, -this.hs$ZenerElm);
        this.poly$ZenerElm = this.createPolygon$3(pa[0], pa[1], this.lead2);
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.hs$ZenerElm);
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.draw2Leads(g);
        // draw arrow thingy
        this.setPowerColor$Graphics_bool(g, true);
        this.setVoltageColor(g, v1);
        g.fillPolygon(this.poly$ZenerElm);
        // draw thing arrow is pointing to
        this.setVoltageColor(g, v2);
        CircuitElm.drawThickLine$3(g, this.cathode$ZenerElm[0], this.cathode$ZenerElm[1]);
        // draw wings on cathode
        CircuitElm.drawThickLine$3(g, this.wing[0], this.cathode$ZenerElm[0]);
        CircuitElm.drawThickLine$3(g, this.wing[1], this.cathode$ZenerElm[1]);
        this.doDots(g);
        this.drawPosts(g);
    }
    declare default_zvoltage: number;
    getInfo(arr: string[]): void {
        super.getInfo(arr);
        arr[0] = "Zener diode";
        arr[5] = "Vz = " + CircuitElm.getVoltageText(this.model.breakdownVoltage);
    }
    getShortcut(): number {
        return 122;
    }
    setLastModelName(n: string): void {
        ZenerElm.lastZenerModelName = n;
    }
}
Object.assign(ZenerElm.prototype, { "hs$ZenerElm": 8, "poly$ZenerElm": null, "cathode$ZenerElm": null, "wing": null, "default_zvoltage": 5.6 });
