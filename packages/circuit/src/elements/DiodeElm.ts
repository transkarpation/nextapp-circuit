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

// Changed 2026-10-31: converted from DiodeElm.java to TypeScript.
/* eslint-disable */
import { Button, Choice, CirSim, CircuitElm, CustomLogicModel, Diode, DiodeModel, EditDialog, EditDiodeModelDialog, EditInfo, Graphics, Point, Polygon, StringTokenizer, Vector, Window, ZenerElm, parseJDouble } from '../core/internal';

export class DiodeElm extends CircuitElm {
    declare diode: Diode;
    static FLAG_FWDROP: number = 1;
    static FLAG_MODEL: number = 2;
    declare modelName: string;
    declare model: DiodeModel;
    static lastModelName: string = "default";
    declare hasResistance: boolean;
    declare diodeEndNode: number;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.modelName = DiodeElm.lastModelName;
        this.diode = new Diode().init$1(CircuitElm.sim);
        this.setup();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        let defaultdrop: number = .805904783;
        this.diode = new Diode().init$1(CircuitElm.sim);
        let fwdrop: number = defaultdrop;
        let zvoltage: number = 0;
        if ((f & DiodeElm.FLAG_MODEL) !== 0) {
            this.modelName = CustomLogicModel.unescape(st.nextToken$0());
        } else {
            if ((f & DiodeElm.FLAG_FWDROP) > 0) {
                try {
                    fwdrop = parseJDouble(st.nextToken$0());
                } catch (e) {
                }
            }
            this.model = DiodeModel.getModelWithParameters(fwdrop, zvoltage);
            this.modelName = this.model.name;
            //	    CirSim.console("model name wparams = " + modelName);
        }
        this.setup();
        return this;
    }
    nonLinear(): boolean {
        return true;
    }
    setup(): void {
        //	CirSim.console("setting up for model " + modelName + " " + model);
        this.model = DiodeModel.getModelWithNameOrCopy(this.modelName, this.model);
        this.modelName = this.model.name;
        // in case we couldn't find that model
        this.diode.setup(this.model);
        this.hasResistance = (this.model.seriesResistance > 0);
        this.diodeEndNode = (this.hasResistance) ? 2 : 1;
        this.allocNodes();
    }
    getInternalNodeCount(): number {
        return this.hasResistance ? 1 : 0;
    }
    updateModels$0(): void {
        this.setup();
    }
    getDumpType(): number {
        return 100;
    }
    dump(): string {
        this.flags |= DiodeElm.FLAG_MODEL;
        /*	if (modelName == null) {
	    sim.console("model name is null??");
	    modelName = "default";
	}*/
        return super.dump() + " " + CustomLogicModel.escape(this.modelName);
    }
    dumpModel(): string {
        if (this.model.builtIn || this.model.dumped) {
            return null;
        }
        return this.model.dump();
    }
    declare hs: number;
    declare poly: Polygon;
    declare cathode: Point[];
    setPoints(): void {
        super.setPoints();
        this.calcLeads(16);
        this.cathode = this.newPointArray(2);
        let pa: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
        this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], 1, this.hs);
        this.poly = this.createPolygon$3(pa[0], pa[1], this.lead2);
    }
    draw(g: Graphics): void {
        this.drawDiode(g);
        this.doDots(g);
        this.drawPosts(g);
    }
    reset(): void {
        this.diode.reset();
        this.volts[0] = this.volts[1] = this.curcount = 0;
        if (this.hasResistance) {
            this.volts[2] = 0;
        }
    }
    drawDiode(g: Graphics): void {
        this.setBbox$3(this.point1, this.point2, this.hs);
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.draw2Leads(g);
        // draw arrow thingy
        this.setVoltageColor(g, v1);
        this.setPowerColor$Graphics_bool(g, true);
        g.fillPolygon(this.poly);
        // draw thing arrow is pointing to
        this.setVoltageColor(g, v2);
        this.setPowerColor$Graphics_bool(g, true);
        CircuitElm.drawThickLine$3(g, this.cathode[0], this.cathode[1]);
    }
    stamp(): void {
        if (this.hasResistance) {
            // create diode from node 0 to internal node
            this.diode.stamp(this.nodes[0], this.nodes[2]);
            // create resistor from internal node to node 1
            CircuitElm.sim.stampResistor(this.nodes[1], this.nodes[2], this.model.seriesResistance);
        } else {
            this.diode.stamp(this.nodes[0], this.nodes[1]);
        }
    }
    doStep(): void {
        this.diode.doStep(this.volts[0] - this.volts[this.diodeEndNode]);
    }
    calculateCurrent(): void {
        this.current = this.diode.calculateCurrent(this.volts[0] - this.volts[this.diodeEndNode]);
    }
    getInfo(arr: string[]): void {
        if (this.model.oldStyle) {
            arr[0] = "diode";
        } else {
            arr[0] = CirSim.LS("diode") + " (" + this.modelName + ")";
        }
        arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
        arr[2] = "Vd = " + CircuitElm.getVoltageText(this.getVoltageDiff());
        arr[3] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
        if (this.model.oldStyle) {
            arr[4] = "Vf = " + CircuitElm.getVoltageText(this.model.fwdrop);
        }
    }
    declare models: Vector<DiodeModel>;
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Model", 0, -1, -1);
            this.models = DiodeModel.getModelList(this instanceof ZenerElm);
            ei.choice = new Choice();
            let i: number = 0;
            for (i = 0; i !== this.models.size(); i++) {
                let dm: DiodeModel = this.models.get(i);
                ei.choice.add(dm.getDescription());
                if (dm === this.model) {
                    ei.choice.select(i);
                }
            }
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.button = new Button(CirSim.LS("Create New Simple Model"));
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.button = new Button(CirSim.LS("Create New Advanced Model"));
            return ei;
        }
        if (n === 3) {
            if (this.model.readOnly) {
                return null;
            }
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.button = new Button(CirSim.LS("Edit Model"));
            return ei;
        }
        return null;
    }
    newModelCreated$DiodeModel(dm: DiodeModel): void {
        this.model = dm;
        this.modelName = this.model.name;
        this.setup();
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.model = this.models.get(ei.choice.getSelectedIndex());
            this.modelName = this.model.name;
            this.setup();
            ei.newDialog = true;
            return;
        }
        if (n === 1 || n === 2) {
            let newModel: DiodeModel = new DiodeModel().init$1(this.model);
            newModel.setSimple(n === 1);
            if (newModel.isSimple()) {
                newModel.setForwardVoltage();
            }
            let editDialog: EditDialog = new EditDiodeModelDialog(newModel, CircuitElm.sim, this);
            CirSim.diodeModelEditDialog = editDialog;
            editDialog.show();
            return;
        }
        if (n === 3) {
            if (this.model.readOnly) {
                // probably never reached
                Window.alert(CirSim.LS("This model cannot be modified.  Change the model name to allow customization."));
                return;
            }
            if (this.model.isSimple()) {
                this.model.setForwardVoltage();
            }
            let editDialog: EditDialog = new EditDiodeModelDialog(this.model, CircuitElm.sim, null);
            CirSim.diodeModelEditDialog = editDialog;
            editDialog.show();
            return;
        }
    }
    getShortcut(): number {
        return 100;
    }
    setLastModelName(n: string): void {
        DiodeElm.lastModelName = n;
    }
    stepFinished(): void {
        // stop for huge currents that make simulator act weird
        if (Math.abs(this.current) > 1e12) {
            CircuitElm.sim.stop("max current exceeded", this);
        }
    }
}
Object.assign(DiodeElm.prototype, { "diode": null, "modelName": null, "model": null, "hasResistance": false, "diodeEndNode": 0, "hs": 8, "poly": null, "cathode": null, "models": null });
