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

// Changed 2026-10-31: converted from TunnelDiodeElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Graphics, Point, Polygon, StringTokenizer } from '../core/internal';

export class TunnelDiodeElm extends CircuitElm {
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.setup();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.setup();
        return this;
    }
    nonLinear(): boolean {
        return true;
    }
    setup(): void {
    }
    getDumpType(): number {
        return 175;
    }
    declare hs: number;
    declare poly: Polygon;
    declare cathode: Point[];
    setPoints(): void {
        super.setPoints();
        this.calcLeads(16);
        this.cathode = this.newPointArray(4);
        let pa: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
        this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], 1, this.hs);
        this.interpPoint2(this.lead1, this.lead2, this.cathode[2], this.cathode[3], .8, this.hs);
        this.poly = this.createPolygon$3(pa[0], pa[1], this.lead2);
    }
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.hs);
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.draw2Leads(g);
        // draw arrow thingy
        this.setPowerColor$Graphics_bool(g, true);
        this.setVoltageColor(g, v1);
        g.fillPolygon(this.poly);
        // draw thing arrow is pointing to
        this.setVoltageColor(g, v2);
        CircuitElm.drawThickLine$3(g, this.cathode[0], this.cathode[1]);
        CircuitElm.drawThickLine$3(g, this.cathode[2], this.cathode[0]);
        CircuitElm.drawThickLine$3(g, this.cathode[3], this.cathode[1]);
        this.doDots(g);
        this.drawPosts(g);
    }
    reset(): void {
        this.lastvoltdiff = this.volts[0] = this.volts[1] = this.curcount = 0;
    }
    declare lastvoltdiff: number;
    limitStep(vnew: number, vold: number): number {
        // Prevent voltage changes of more than 1V when iterating.  Wow, I thought it would be
        // much harder than this to prevent convergence problems.
        if (vnew > vold + 1) {
            return vold + 1;
        }
        if (vnew < vold - 1) {
            return vold - 1;
        }
        return vnew;
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
    }
    static pvp: number = .1;
    static pip: number = 4.7e-3;
    static pvv: number = .37;
    static pvt: number = .026;
    static pvpp: number = .525;
    static piv: number = 370e-6;
    doStep(): void {
        let voltdiff: number = this.volts[0] - this.volts[1];
        if (Math.abs(voltdiff - this.lastvoltdiff) > .01) {
            CircuitElm.sim.converged = false;
        }
        //System.out.println(voltdiff + " " + lastvoltdiff + " " + Math.abs(voltdiff-lastvoltdiff));
        voltdiff = this.limitStep(voltdiff, this.lastvoltdiff);
        this.lastvoltdiff = voltdiff;
        let i0: number = TunnelDiodeElm.piv * Math.exp(-TunnelDiodeElm.pvv);
        let i: number = TunnelDiodeElm.pip * Math.exp(-TunnelDiodeElm.pvpp / TunnelDiodeElm.pvt) * (Math.exp(voltdiff / TunnelDiodeElm.pvt) - 1) + TunnelDiodeElm.pip * (voltdiff / TunnelDiodeElm.pvp) * Math.exp(1 - voltdiff / TunnelDiodeElm.pvp) + TunnelDiodeElm.piv * Math.exp(voltdiff - TunnelDiodeElm.pvv) - i0;
        let geq: number = TunnelDiodeElm.pip * Math.exp(-TunnelDiodeElm.pvpp / TunnelDiodeElm.pvt) * Math.exp(voltdiff / TunnelDiodeElm.pvt) / TunnelDiodeElm.pvt + TunnelDiodeElm.pip * Math.exp(1 - voltdiff / TunnelDiodeElm.pvp) / TunnelDiodeElm.pvp - Math.exp(1 - voltdiff / TunnelDiodeElm.pvp) * TunnelDiodeElm.pip * voltdiff / (TunnelDiodeElm.pvp * TunnelDiodeElm.pvp) + Math.exp(voltdiff - TunnelDiodeElm.pvv) * TunnelDiodeElm.piv;
        let nc: number = i - geq * voltdiff;
        CircuitElm.sim.stampConductance(this.nodes[0], this.nodes[1], geq);
        CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[1], nc);
    }
    calculateCurrent(): void {
        let voltdiff: number = this.volts[0] - this.volts[1];
        let i0: number = TunnelDiodeElm.piv * Math.exp(-TunnelDiodeElm.pvv);
        this.current = TunnelDiodeElm.pip * Math.exp(-TunnelDiodeElm.pvpp / TunnelDiodeElm.pvt) * (Math.exp(voltdiff / TunnelDiodeElm.pvt) - 1) + TunnelDiodeElm.pip * (voltdiff / TunnelDiodeElm.pvp) * Math.exp(1 - voltdiff / TunnelDiodeElm.pvp) + TunnelDiodeElm.piv * Math.exp(voltdiff - TunnelDiodeElm.pvv) - i0;
    }
    getInfo(arr: string[]): void {
        arr[0] = "tunnel diode";
        arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
        arr[2] = "Vd = " + CircuitElm.getVoltageText(this.getVoltageDiff());
        arr[3] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
}
Object.assign(TunnelDiodeElm.prototype, { "hs": 8, "poly": null, "cathode": null, "lastvoltdiff": 0 });
