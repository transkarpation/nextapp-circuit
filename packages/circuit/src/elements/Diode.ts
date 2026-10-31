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
// diode that can be embedded in other elements.  series resistance is handled in DiodeElm, not here.

// Changed 2026-10-31: converted from Diode.java to TypeScript.
/* eslint-disable */
import { CirSim, DiodeModel, newArray } from '../core/internal';

export class Diode {
    declare nodes: number[];
    declare sim: CirSim;
    init$1(s: CirSim): this {
        this.sim = s;
        this.nodes = newArray(0, 2);
        return this;
    }
    setup(model: DiodeModel): void {
        this.leakage = model.saturationCurrent;
        this.zvoltage = model.breakdownVoltage;
        this.vscale = model.vscale;
        this.vdcoef = model.vdcoef;
        //	sim.console("setup " + leakage + " " + zvoltage + " " + model.emissionCoefficient + " " +  vdcoef);
        // critical voltage for limiting; current is vscale/sqrt(2) at
        // this voltage
        this.vcrit = this.vscale * Math.log(this.vscale / (Math.sqrt(2) * this.leakage));
        // translated, *positive* critical voltage for limiting in Zener breakdown region;
        // limitstep() uses this with translated voltages in an analogous fashion to vcrit.
        this.vzcrit = Diode.vt * Math.log(Diode.vt / (Math.sqrt(2) * this.leakage));
        if (this.zvoltage === 0) {
            this.zoffset = 0;
        } else {
            // calculate offset which will give us 5mA at zvoltage
            let i: number = -.005;
            this.zoffset = this.zvoltage - Math.log(-(1 + i / this.leakage)) / Diode.vzcoef;
        }
    }
    setupForDefaultModel(): void {
        this.setup(DiodeModel.getDefaultModel());
    }
    reset(): void {
        this.lastvoltdiff = 0;
    }
    // Electron thermal voltage at SPICE's default temperature of 27 C (300.15 K):
    static vt: number = 0.025865;
    // The diode's "scale voltage", the voltage increase which will raise current by a factor of e.
    declare vscale: number;
    // The multiplicative equivalent of dividing by vscale (for speed).
    declare vdcoef: number;
    // The Zener breakdown curve is represented by a steeper exponential, one like the ideal
    // Shockley curve, but flipped and translated. This curve removes the moderating influence
    // of emcoef, replacing vscale and vdcoef with vt and vzcoef.
    // vzcoef is the multiplicative equivalent of dividing by vt (for speed).
    static vzcoef: number = 1 / Diode.vt;
    // User-specified diode parameters for forward voltage drop and Zener voltage.
    declare fwdrop: number;
    declare zvoltage: number;
    // The diode current's scale factor, calculated from the user-specified forward voltage drop.
    declare leakage: number;
    // Voltage offset for Zener breakdown exponential, calculated from user-specified Zener voltage.
    declare zoffset: number;
    // Critical voltages for limiting the normal diode and Zener breakdown exponentials.
    declare vcrit: number;
    declare vzcrit: number;
    declare lastvoltdiff: number;
    limitStep(vnew: number, vold: number): number {
        let arg: number = 0;
        let oo: number = vnew;
        // check new voltage; has current changed by factor of e^2?
        if (vnew > this.vcrit && Math.abs(vnew - vold) > (this.vscale + this.vscale)) {
            if (vold > 0) {
                arg = 1 + (vnew - vold) / this.vscale;
                if (arg > 0) {
                    // adjust vnew so that the current is the same
                    // as in linearized model from previous iteration.
                    // current at vnew = old current * arg
                    vnew = vold + this.vscale * Math.log(arg);
                } else {
                    vnew = this.vcrit;
                }
            } else {
                // adjust vnew so that the current is the same
                // as in linearized model from previous iteration.
                // (1/vscale = slope of load line)
                vnew = this.vscale * Math.log(vnew / this.vscale);
            }
            this.sim.converged = false;
            //System.out.println(vnew + " " + oo + " " + vold);
        } else if (vnew < 0 && this.zoffset !== 0) {
            // for Zener breakdown, use the same logic but translate the values,
            // and replace the normal values with the Zener-specific ones to
            // account for the steeper exponential of our Zener breakdown curve.
            vnew = -vnew - this.zoffset;
            vold = -vold - this.zoffset;
            if (vnew > this.vzcrit && Math.abs(vnew - vold) > (Diode.vt + Diode.vt)) {
                if (vold > 0) {
                    arg = 1 + (vnew - vold) / Diode.vt;
                    if (arg > 0) {
                        vnew = vold + Diode.vt * Math.log(arg);
                        //System.out.println(oo + " " + vnew);
                    } else {
                        vnew = this.vzcrit;
                    }
                } else {
                    vnew = Diode.vt * Math.log(vnew / Diode.vt);
                }
                this.sim.converged = false;
            }
            vnew = -(vnew + this.zoffset);
        }
        return vnew;
    }
    stamp(n0: number, n1: number): void {
        this.nodes[0] = n0;
        this.nodes[1] = n1;
        this.sim.stampNonLinear(this.nodes[0]);
        this.sim.stampNonLinear(this.nodes[1]);
    }
    doStep(voltdiff: number): void {
        // used to have .1 here, but needed .01 for peak detector
        if (Math.abs(voltdiff - this.lastvoltdiff) > .01) {
            this.sim.converged = false;
        }
        voltdiff = this.limitStep(voltdiff, this.lastvoltdiff);
        this.lastvoltdiff = voltdiff;
        // To prevent a possible singular matrix or other numeric issues, put a tiny conductance
        // in parallel with each P-N junction.
        let gmin: number = this.leakage * 0.01;
        if (this.sim.subIterations > 100) {
            // if we have trouble converging, put a conductance in parallel with the diode.
            // Gradually increase the conductance value for each iteration.
            gmin = Math.exp(-9 * Math.log(10) * (1 - this.sim.subIterations / 3000.));
            if (gmin > .1) {
                gmin = .1;
            }
        }
        if (voltdiff >= 0 || this.zvoltage === 0) {
            // regular diode or forward-biased zener
            let eval_: number = Math.exp(voltdiff * this.vdcoef);
            let geq: number = this.vdcoef * this.leakage * eval_ + gmin;
            let nc: number = (eval_ - 1) * this.leakage - geq * voltdiff;
            this.sim.stampConductance(this.nodes[0], this.nodes[1], geq);
            this.sim.stampCurrentSource(this.nodes[0], this.nodes[1], nc);
        } else {
            // Zener diode
            // For reverse-biased Zener diodes, mimic the Zener breakdown curve with an
            // exponential similar to the ideal Shockley curve. (The real breakdown curve
            // isn't a simple exponential, but this approximation should be OK.)
            /* 
	     * I(Vd) = Is * (exp[Vd*C] - exp[(-Vd-Vz)*Cz] - 1 )
	     *
	     * geq is I'(Vd)
	     * nc is I(Vd) + I'(Vd)*(-Vd)
	     */
            let geq: number = this.leakage * (this.vdcoef * Math.exp(voltdiff * this.vdcoef) + Diode.vzcoef * Math.exp((-voltdiff - this.zoffset) * Diode.vzcoef)) + gmin;
            let nc: number = this.leakage * (Math.exp(voltdiff * this.vdcoef) - Math.exp((-voltdiff - this.zoffset) * Diode.vzcoef) - 1) + geq * (-voltdiff);
            this.sim.stampConductance(this.nodes[0], this.nodes[1], geq);
            this.sim.stampCurrentSource(this.nodes[0], this.nodes[1], nc);
        }
    }
    calculateCurrent(voltdiff: number): number {
        if (voltdiff >= 0 || this.zvoltage === 0) {
            return this.leakage * (Math.exp(voltdiff * this.vdcoef) - 1);
        }
        return this.leakage * (Math.exp(voltdiff * this.vdcoef) - Math.exp((-voltdiff - this.zoffset) * Diode.vzcoef) - 1);
    }
    constructor() {}
}
Object.assign(Diode.prototype, { "nodes": null, "sim": null, "vscale": 0, "vdcoef": 0, "fwdrop": 0, "zvoltage": 0, "leakage": 0, "zoffset": 0, "vcrit": 0, "vzcrit": 0, "lastvoltdiff": 0 });
