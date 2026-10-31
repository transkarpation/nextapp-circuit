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

// Changed 2026-10-31: converted from TransistorElm.java to TypeScript.
/* eslint-disable */
import { Button, Checkbox, Choice, CirSim, CircuitElm, Color, CustomLogicModel, EditDialog, EditInfo, EditTransistorModelDialog, Graphics, Point, Polygon, Scope, StringTokenizer, TransistorModel, Vector, Window, parseJDouble, parseJInt } from '../core/internal';

export class TransistorElm extends CircuitElm {
    // node 0 = base
    // node 1 = collector
    // node 2 = emitter
    declare pnp: number;
    declare beta: number;
    //	double fgain, inv_fgain;
    declare gmin: number;
    declare modelName: string;
    declare model: TransistorModel;
    static lastModelName: string = "default";
    declare FLAG_FLIP: number;
    init$3(xx: number, yy: number, pnpflag: boolean): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.pnp = (pnpflag) ? -1 : 1;
        this.beta = 100;
        this.modelName = TransistorElm.lastModelName;
        this.setup();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.pnp = parseJInt(st.nextToken$0());
        this.beta = 100;
        try {
            this.lastvbe = parseJDouble(st.nextToken$0());
            this.lastvbc = parseJDouble(st.nextToken$0());
            this.volts[0] = 0;
            this.volts[1] = -this.lastvbe;
            this.volts[2] = -this.lastvbc;
            this.beta = parseJDouble(st.nextToken$0());
            this.modelName = CustomLogicModel.unescape(st.nextToken$0());
        } catch (e) {
            this.modelName = "default";
        }
        this.setup();
        return this;
    }
    setup(): void {
        this.model = TransistorModel.getModelWithNameOrCopy(this.modelName, this.model);
        this.modelName = this.model.name;
        // in case we couldn't find that model
        this.vcrit = TransistorElm.vt * Math.log(TransistorElm.vt / (Math.sqrt(2) * this.model.satCur));
        this.noDiagonal = true;
    }
    nonLinear(): boolean {
        return true;
    }
    reset(): void {
        this.volts[0] = this.volts[1] = this.volts[2] = 0;
        this.lastvbc = this.lastvbe = this.curcount_c = this.curcount_e = this.curcount_b = 0;
    }
    getDumpType(): number {
        return 116;
    }
    dump(): string {
        return super.dump() + " " + this.pnp + " " + (this.volts[0] - this.volts[1]) + " " + (this.volts[0] - this.volts[2]) + " " + this.beta + " " + CustomLogicModel.escape(this.modelName);
    }
    updateModels$0(): void {
        this.setup();
    }
    dumpModel(): string {
        if (this.model.builtIn || this.model.dumped) {
            return null;
        }
        return this.model.dump();
    }
    declare ic: number;
    declare ie: number;
    declare ib: number;
    declare curcount_c: number;
    declare curcount_e: number;
    declare curcount_b: number;
    declare rectPoly: Polygon;
    declare arrowPoly: Polygon;
    draw(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, 16);
        this.setPowerColor$Graphics_bool(g, true);
        // draw collector
        this.setVoltageColor(g, this.volts[1]);
        CircuitElm.drawThickLine$3(g, this.coll[0], this.coll[1]);
        // draw emitter
        this.setVoltageColor(g, this.volts[2]);
        CircuitElm.drawThickLine$3(g, this.emit[0], this.emit[1]);
        // draw arrow
        g.setColor(CircuitElm.lightGrayColor);
        g.fillPolygon(this.arrowPoly);
        // draw base
        this.setVoltageColor(g, this.volts[0]);
        if (CircuitElm.sim.powerCheckItem.getState()) {
            g.setColor(Color.gray);
        }
        CircuitElm.drawThickLine$3(g, this.point1, this.base);
        // draw dots
        this.curcount_b = this.updateDotCount$2(-this.ib, this.curcount_b);
        this.drawDots(g, this.base, this.point1, this.curcount_b);
        this.curcount_c = this.updateDotCount$2(-this.ic, this.curcount_c);
        this.drawDots(g, this.coll[1], this.coll[0], this.curcount_c);
        this.curcount_e = this.updateDotCount$2(-this.ie, this.curcount_e);
        this.drawDots(g, this.emit[1], this.emit[0], this.curcount_e);
        // draw base rectangle
        this.setVoltageColor(g, this.volts[0]);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.rectPoly);
        if ((this.needsHighlight() || CircuitElm.sim.dragElm === this) && this.dy === 0) {
            g.setColor(Color.white);
            // IES
            //		g.setFont(unitsFont);
            let ds: number = CircuitElm.sign$1(this.dx);
            g.drawString("B", this.base.x - 10 * ds, this.base.y - 5);
            g.drawString("C", this.coll[0].x - 3 + 9 * ds, this.coll[0].y + 4);
            // x+6 if ds=1, -12 if -1
            g.drawString("E", this.emit[0].x - 3 + 9 * ds, this.emit[0].y + 4);
        }
        this.drawPosts(g);
    }
    getPost(n: number): Point {
        return (n === 0) ? this.point1 : (n === 1) ? this.coll[0] : this.emit[0];
    }
    getPostCount(): number {
        return 3;
    }
    getPower(): number {
        return (this.volts[0] - this.volts[2]) * this.ib + (this.volts[1] - this.volts[2]) * this.ic;
    }
    declare rect: Point[];
    declare coll: Point[];
    declare emit: Point[];
    declare base: Point;
    setPoints(): void {
        super.setPoints();
        let hs: number = 16;
        if ((this.flags & this.FLAG_FLIP) !== 0) {
            this.dsign = -this.dsign;
        }
        let hs2: number = hs * this.dsign * this.pnp;
        // calc collector, emitter posts
        this.coll = this.newPointArray(2);
        this.emit = this.newPointArray(2);
        this.interpPoint2(this.point1, this.point2, this.coll[0], this.emit[0], 1, hs2);
        // calc rectangle edges
        this.rect = this.newPointArray(4);
        this.interpPoint2(this.point1, this.point2, this.rect[0], this.rect[1], 1 - 16 / this.dn, hs);
        this.interpPoint2(this.point1, this.point2, this.rect[2], this.rect[3], 1 - 13 / this.dn, hs);
        // calc points where collector/emitter leads contact rectangle
        this.interpPoint2(this.point1, this.point2, this.coll[1], this.emit[1], 1 - 13 / this.dn, 6 * this.dsign * this.pnp);
        // calc point where base lead contacts rectangle
        this.base = new Point().init$0();
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.base, 1 - 16 / this.dn);
        // rectangle
        this.rectPoly = this.createPolygon$4(this.rect[0], this.rect[2], this.rect[3], this.rect[1]);
        // arrow
        if (this.pnp === 1) {
            this.arrowPoly = this.calcArrow(this.emit[1], this.emit[0], 8, 4);
        } else {
            let pt: Point = this.interpPoint$Point_Point_dbl_dbl(this.point1, this.point2, 1 - 11 / this.dn, -5 * this.dsign * this.pnp);
            this.arrowPoly = this.calcArrow(this.emit[0], pt, 8, 4);
        }
    }
    static leakage: number = 1e-13;
    // 1e-6;
    // Electron thermal voltage at SPICE's default temperature of 27 C (300.15 K):
    static vt: number = 0.025865;
    declare vcrit: number;
    declare lastvbc: number;
    declare lastvbe: number;
    limitStep(vnew: number, vold: number): number {
        let arg: number = 0;
        let oo: number = vnew;
        if (vnew > this.vcrit && Math.abs(vnew - vold) > (TransistorElm.vt + TransistorElm.vt)) {
            if (vold > 0) {
                arg = 1 + (vnew - vold) / TransistorElm.vt;
                if (arg > 0) {
                    vnew = vold + TransistorElm.vt * Math.log(arg);
                } else {
                    vnew = this.vcrit;
                }
            } else {
                vnew = TransistorElm.vt * Math.log(vnew / TransistorElm.vt);
            }
            CircuitElm.sim.converged = false;
            //System.out.println(vnew + " " + oo + " " + vold);
        }
        return (vnew);
    }
    stamp(): void {
        CircuitElm.sim.stampNonLinear(this.nodes[0]);
        CircuitElm.sim.stampNonLinear(this.nodes[1]);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
    }
    doStep(): void {
        let vbc: number = this.pnp * (this.volts[0] - this.volts[1]);
        // typically negative
        let vbe: number = this.pnp * (this.volts[0] - this.volts[2]);
        // typically positive
        if (Math.abs(vbc - this.lastvbc) > .01 || Math.abs(vbe - this.lastvbe) > .01) {
            CircuitElm.sim.converged = false;
        }
        // To prevent a possible singular matrix, put a tiny conductance in parallel
        // with each P-N junction.
        //	    gmin = leakage * 0.01;
        this.gmin = 1e-12;
        if (CircuitElm.sim.subIterations > 100) {
            // if we have trouble converging, put a conductance in parallel with all P-N junctions.
            // Gradually increase the conductance value for each iteration.
            this.gmin = Math.exp(-9 * Math.log(10) * (1 - CircuitElm.sim.subIterations / 300.));
            if (this.gmin > .1) {
                this.gmin = .1;
            }
        }
        //System.out.print("T " + vbc + " " + vbe + "\n");
        vbc = this.limitStep(vbc, this.lastvbc);
        vbe = this.limitStep(vbe, this.lastvbe);
        this.lastvbc = vbc;
        this.lastvbe = vbe;
        /*
             *   dc model paramters (from Spice 3f5, bjtload.c)
             */
        let csat: number = this.model.satCur;
        let oik: number = this.model.invRollOffF;
        let c2: number = this.model.BEleakCur;
        let vte: number = this.model.leakBEemissionCoeff * TransistorElm.vt;
        let oikr: number = this.model.invRollOffR;
        let c4: number = this.model.BCleakCur;
        let vtc: number = this.model.leakBCemissionCoeff * TransistorElm.vt;
        //          double rbpr=model.minBaseResist;
        //          double rbpi=model.baseResist-rbpr;
        //          double xjrb=model.baseCurrentHalfResist;
        let vtn: number = TransistorElm.vt * this.model.emissionCoeffF;
        let evbe: number = 0, cbe: number = 0, gbe: number = 0, cben: number = 0, gben: number = 0, evben: number = 0, evbc: number = 0, cbc: number = 0, gbc: number = 0, cbcn: number = 0, gbcn: number = 0, evbcn: number = 0;
        let qb: number = 0, dqbdve: number = 0, dqbdvc: number = 0, q2: number = 0, sqarg: number = 0, arg: number = 0;
        if (vbe > -5 * vtn) {
            evbe = Math.exp(vbe / vtn);
            cbe = csat * (evbe - 1) + this.gmin * vbe;
            gbe = csat * evbe / vtn + this.gmin;
            if (c2 === 0) {
                cben = 0;
                gben = 0;
            } else {
                evben = Math.exp(vbe / vte);
                cben = c2 * (evben - 1);
                gben = c2 * evben / vte;
            }
        } else {
            gbe = -csat / vbe + this.gmin;
            cbe = gbe * vbe;
            gben = -c2 / vbe;
            cben = gben * vbe;
        }
        vtn = TransistorElm.vt * this.model.emissionCoeffR;
        if (vbc > -5 * vtn) {
            evbc = Math.exp(vbc / vtn);
            cbc = csat * (evbc - 1) + this.gmin * vbc;
            gbc = csat * evbc / vtn + this.gmin;
            if (c4 === 0) {
                cbcn = 0;
                gbcn = 0;
            } else {
                evbcn = Math.exp(vbc / vtc);
                cbcn = c4 * (evbcn - 1);
                gbcn = c4 * evbcn / vtc;
            }
        } else {
            gbc = -csat / vbc + this.gmin;
            cbc = gbc * vbc;
            gbcn = -c4 / vbc;
            cbcn = gbcn * vbc;
        }
        /*
             *   determine base charge terms
             */
        let q1: number = 1 / (1 - this.model.invEarlyVoltF * vbc - this.model.invEarlyVoltR * vbe);
        if (oik === 0 && oikr === 0) {
            qb = q1;
            dqbdve = q1 * qb * this.model.invEarlyVoltR;
            dqbdvc = q1 * qb * this.model.invEarlyVoltF;
        } else {
            q2 = oik * cbe + oikr * cbc;
            arg = Math.max(0, 1 + 4 * q2);
            sqarg = 1;
            if (arg !== 0) {
                sqarg = Math.sqrt(arg);
            }
            qb = q1 * (1 + sqarg) / 2;
            dqbdve = q1 * (qb * this.model.invEarlyVoltR + oik * gbe / sqarg);
            dqbdvc = q1 * (qb * this.model.invEarlyVoltF + oikr * gbc / sqarg);
        }
        let cc: number = 0;
        let cex: number = cbe;
        let gex: number = gbe;
        /*
             *   determine dc incremental conductances
             */
        cc = cc + (cex - cbc) / qb - cbc / this.model.betaR - cbcn;
        let cb: number = cbe / this.beta + cben + cbc / this.model.betaR + cbcn;
        // get currents
        this.ic = this.pnp * cc;
        this.ib = this.pnp * cb;
        this.ie = this.pnp * (-cc - cb);
        /*            double gx=rbpr+rbpi/qb;   // base resistance commented out for now
            if(xjrb != 0) {
                double arg1=Math.max(cb/xjrb,1e-9);
                double arg2=(-1+Math.sqrt(1+14.59025*arg1))/2.4317/Math.sqrt(arg1);
                arg1=Math.tan(arg2);
                gx=rbpr+3*rbpi*(arg1-arg2)/arg2/arg1/arg1;
            }
            if(gx != 0) gx=1/gx;*/
        let gpi: number = gbe / this.beta + gben;
        let gmu: number = gbc / this.model.betaR + gbcn;
        let go: number = (gbc + (cex - cbc) * dqbdvc / qb) / qb;
        let gm: number = (gex - (cex - cbc) * dqbdve / qb) / qb - go;
        let ceqbe: number = this.pnp * (cc + cb - vbe * (gm + go + gpi) + vbc * go);
        let ceqbc: number = this.pnp * (-cc + vbe * (gm + go) - vbc * (gmu + go));
        // stamp matrix.
        // Node 0 is the base, node 1 the collector, node 2 the emitter.
        CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[1], gmu + go);
        CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[0], -gmu + gm);
        CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[2], -gm - go);
        CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[0], gpi + gmu);
        CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[2], -gpi);
        CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[1], -gmu);
        CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[0], -gpi - gm);
        CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[1], -go);
        CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[2], gpi + gm + go);
        /*
             *  load current excitation vector (right side)
             */
        CircuitElm.sim.stampRightSide(this.nodes[0], -ceqbe - ceqbc);
        CircuitElm.sim.stampRightSide(this.nodes[1], ceqbc);
        CircuitElm.sim.stampRightSide(this.nodes[2], ceqbe);
    }
    getScopeText(x: number): string {
        let t: string = "";
        switch (x) {
            case Scope.VAL_IB:
                t = "Ib";
                break;
            case Scope.VAL_IC:
                t = "Ic";
                break;
            case Scope.VAL_IE:
                t = "Ie";
                break;
            case Scope.VAL_VBE:
                t = "Vbe";
                break;
            case Scope.VAL_VBC:
                t = "Vbc";
                break;
            case Scope.VAL_VCE:
                t = "Vce";
                break;
            case Scope.VAL_POWER:
                t = "P";
                break;
        }
        return CirSim.LS("transistor") + ", " + t;
    }
    getInfo(arr: string[]): void {
        arr[0] = CirSim.LS("transistor") + " (" + ((this.pnp === -1) ? "PNP)" : "NPN)") + " \u03b2=" + CircuitElm.showFormat.format(this.beta);
        let vbc: number = this.volts[0] - this.volts[1];
        let vbe: number = this.volts[0] - this.volts[2];
        let vce: number = this.volts[1] - this.volts[2];
        if (vbc * this.pnp > .2) {
            arr[1] = vbe * this.pnp > .2 ? "saturation" : "reverse active";
        } else {
            arr[1] = vbe * this.pnp > .2 ? "fwd active" : "cutoff";
        }
        arr[1] = CirSim.LS(arr[1]);
        arr[2] = "Ic = " + CircuitElm.getCurrentText(this.ic);
        arr[3] = "Ib = " + CircuitElm.getCurrentText(this.ib);
        arr[4] = "Vbe = " + CircuitElm.getVoltageText(vbe);
        arr[5] = "Vbc = " + CircuitElm.getVoltageText(vbc);
        arr[6] = "Vce = " + CircuitElm.getVoltageText(vce);
        arr[7] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getScopeValue(x: number): number {
        switch (x) {
            case Scope.VAL_IB:
                return this.ib;
            case Scope.VAL_IC:
                return this.ic;
            case Scope.VAL_IE:
                return this.ie;
            case Scope.VAL_VBE:
                return this.volts[0] - this.volts[2];
            case Scope.VAL_VBC:
                return this.volts[0] - this.volts[1];
            case Scope.VAL_VCE:
                return this.volts[1] - this.volts[2];
            case Scope.VAL_POWER:
                return this.getPower();
        }
        return 0;
    }
    getScopeUnits(x: number): number {
        switch (x) {
            case Scope.VAL_IB:
            case Scope.VAL_IC:
            case Scope.VAL_IE:
                return Scope.UNITS_A;
            case Scope.VAL_POWER:
                return Scope.UNITS_W;
            default:
                return Scope.UNITS_V;
        }
    }
    declare models: Vector<TransistorModel>;
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Beta/hFE", this.beta, 10, 1000).setDimensionless();
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Swap E/C", (this.flags & this.FLAG_FLIP) !== 0);
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("Model", 0, -1, -1);
            this.models = TransistorModel.getModelList();
            ei.choice = new Choice();
            let i: number = 0;
            for (i = 0; i !== this.models.size(); i++) {
                let dm: TransistorModel = this.models.get(i);
                ei.choice.add(dm.getDescription());
                if (dm === this.model) {
                    ei.choice.select(i);
                }
            }
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.button = new Button(CirSim.LS("Create New Model"));
            return ei;
        }
        if (n === 4) {
            if (this.model.readOnly) {
                return null;
            }
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.button = new Button(CirSim.LS("Edit Model"));
            return ei;
        }
        return null;
    }
    newModelCreated$TransistorModel(tm: TransistorModel): void {
        this.model = tm;
        this.modelName = this.model.name;
        this.setup();
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.beta = ei.value;
            this.setup();
        }
        if (n === 1) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_FLIP;
            } else {
                this.flags &= ~this.FLAG_FLIP;
            }
            this.setPoints();
        }
        if (n === 2) {
            this.model = this.models.get(ei.choice.getSelectedIndex());
            this.modelName = this.model.name;
            this.setup();
            ei.newDialog = true;
            return;
        }
        if (n === 3) {
            let newModel: TransistorModel = new TransistorModel().init$1(this.model);
            let editDialog: EditDialog = new EditTransistorModelDialog(newModel, CircuitElm.sim, this);
            CirSim.diodeModelEditDialog = editDialog;
            editDialog.show();
            return;
        }
        if (n === 4) {
            if (this.model.readOnly) {
                // probably never reached
                Window.alert(CirSim.LS("This model cannot be modified.  Change the model name to allow customization."));
                return;
            }
            let editDialog: EditDialog = new EditTransistorModelDialog(this.model, CircuitElm.sim, null);
            CirSim.diodeModelEditDialog = editDialog;
            editDialog.show();
            return;
        }
    }
    setBeta(b: number): void {
        this.beta = b;
        this.setup();
    }
    stepFinished(): void {
        // stop for huge currents that make simulator act weird
        if (Math.abs(this.ic) > 1e12 || Math.abs(this.ib) > 1e12) {
            CircuitElm.sim.stop("max current exceeded", this);
        }
    }
    canViewInScope(): boolean {
        return true;
    }
    getCurrentIntoNode(n: number): number {
        if (n === 0) {
            return -this.ib;
        }
        if (n === 1) {
            return -this.ic;
        }
        return -this.ie;
    }
}
Object.assign(TransistorElm.prototype, { "pnp": 0, "beta": 0, "gmin": 0, "modelName": null, "model": null, "FLAG_FLIP": 1, "ic": 0, "ie": 0, "ib": 0, "curcount_c": 0, "curcount_e": 0, "curcount_b": 0, "rectPoly": null, "arrowPoly": null, "rect": null, "coll": null, "emit": null, "base": null, "vcrit": 0, "lastvbc": 0, "lastvbe": 0, "models": null });
