// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from TransistorModel.java to TypeScript.
/* eslint-disable */
import { CirSim, Collections, CustomLogicModel, EditInfo, HashMap, MapEntry, StringTokenizer, Vector, compareStrings, parseJDouble, parseJInt } from '../core/internal';

export class TransistorModel {
    static modelMap: HashMap<string,TransistorModel> = null;
    declare flags: number;
    declare name: string;
    declare description: string;
    declare satCur: number;
    declare invRollOffF: number;
    declare BEleakCur: number;
    declare leakBEemissionCoeff: number;
    declare invRollOffR: number;
    declare BCleakCur: number;
    declare leakBCemissionCoeff: number;
    declare emissionCoeffF: number;
    declare emissionCoeffR: number;
    declare invEarlyVoltF: number;
    declare invEarlyVoltR: number;
    declare betaR: number;
    declare dumped: boolean;
    declare readOnly: boolean;
    declare builtIn: boolean;
    init$2(d: string, sc: number): this {
        this.description = d;
        this.satCur = sc;
        this.emissionCoeffF = this.emissionCoeffR = 1;
        this.leakBEemissionCoeff = 1.5;
        this.leakBCemissionCoeff = 2;
        this.betaR = 1;
        this.updateModel();
        return this;
    }
    static getModelWithName(name: string): TransistorModel {
        TransistorModel.createModelMap();
        let lm: TransistorModel = TransistorModel.modelMap.get(name);
        if (lm != null) {
            return lm;
        }
        lm = new TransistorModel().init$0();
        lm.name = name;
        TransistorModel.modelMap.put(name, lm);
        return lm;
    }
    static getModelWithNameOrCopy(name: string, oldmodel: TransistorModel): TransistorModel {
        TransistorModel.createModelMap();
        let lm: TransistorModel = TransistorModel.modelMap.get(name);
        if (lm != null) {
            return lm;
        }
        if (oldmodel == null) {
            CirSim.console("model not found: " + name);
            return TransistorModel.getDefaultModel();
        }
        lm = new TransistorModel().init$1(oldmodel);
        lm.name = name;
        TransistorModel.modelMap.put(name, lm);
        return lm;
    }
    static createModelMap(): void {
        if (TransistorModel.modelMap != null) {
            return;
        }
        TransistorModel.modelMap = new HashMap();
        TransistorModel.addDefaultModel("default", new TransistorModel().init$2("default", 1e-13));
        TransistorModel.addDefaultModel("spice-default", new TransistorModel().init$2("spice-default", 1e-16));
    }
    static addDefaultModel(name: string, dm: TransistorModel): void {
        TransistorModel.modelMap.put(name, dm);
        dm.readOnly = dm.builtIn = true;
        dm.name = name;
    }
    static getDefaultModel(): TransistorModel {
        return TransistorModel.getModelWithName("default");
    }
    static clearDumpedFlags(): void {
        if (TransistorModel.modelMap == null) {
            return;
        }
        let it: any = TransistorModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,TransistorModel> = (it.next() as any as any);
            pair.getValue().dumped = false;
        }
    }
    static getModelList(): Vector<TransistorModel> {
        let vector: Vector<TransistorModel> = new Vector();
        let it: any = TransistorModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,TransistorModel> = (it.next() as any as any);
            let dm: TransistorModel = pair.getValue();
            vector.add(dm);
        }
        Collections.sort(vector);
        return vector;
    }
    compareTo(dm: TransistorModel): number {
        return compareStrings(this.name, dm.name);
    }
    getDescription(): string {
        if (this.description == null) {
            return this.name;
        }
        return this.name + " (" + CirSim.LS(this.description) + ")";
    }
    init$0(): this {
        this.updateModel();
        return this;
    }
    init$1(copy: TransistorModel): this {
        this.flags = copy.flags;
        this.satCur = copy.satCur;
        this.invRollOffF = copy.invRollOffF;
        this.BEleakCur = copy.BEleakCur;
        this.leakBEemissionCoeff = copy.leakBEemissionCoeff;
        this.invRollOffR = copy.invRollOffR;
        this.BCleakCur = copy.BCleakCur;
        this.leakBCemissionCoeff = copy.leakBCemissionCoeff;
        this.emissionCoeffF = copy.emissionCoeffF;
        this.emissionCoeffR = copy.emissionCoeffR;
        this.invEarlyVoltF = copy.invEarlyVoltF;
        this.invEarlyVoltR = copy.invEarlyVoltR;
        this.betaR = copy.betaR;
        this.updateModel();
        return this;
    }
    static undumpModel(st: StringTokenizer): void {
        let name: string = CustomLogicModel.unescape(st.nextToken$0());
        let dm: TransistorModel = TransistorModel.getModelWithName(name);
        dm.undump(st);
    }
    undump(st: StringTokenizer): void {
        this.flags = parseJInt(st.nextToken$0());
        this.satCur = parseJDouble(st.nextToken$0());
        this.invRollOffF = parseJDouble(st.nextToken$0());
        this.BEleakCur = parseJDouble(st.nextToken$0());
        this.leakBEemissionCoeff = parseJDouble(st.nextToken$0());
        this.invRollOffR = parseJDouble(st.nextToken$0());
        this.BCleakCur = parseJDouble(st.nextToken$0());
        this.leakBCemissionCoeff = parseJDouble(st.nextToken$0());
        this.emissionCoeffF = parseJDouble(st.nextToken$0());
        this.emissionCoeffR = parseJDouble(st.nextToken$0());
        this.invEarlyVoltF = parseJDouble(st.nextToken$0());
        this.invEarlyVoltR = parseJDouble(st.nextToken$0());
        this.betaR = parseJDouble(st.nextToken$0());
        this.updateModel();
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Model Name", 0);
            ei.text = this.name == null ? "" : this.name;
            return ei;
        }
        if (n === 1) {
            return new EditInfo("Transport Saturation Current (IS)", this.satCur);
        }
        if (n === 2) {
            return new EditInfo("Reverse Beta (BR)", this.betaR);
        }
        if (n === 3) {
            return new EditInfo("Forward Early Voltage (VAF)", 1 / this.invEarlyVoltF);
        }
        if (n === 4) {
            return new EditInfo("Reverse Early Voltage (VAR)", 1 / this.invEarlyVoltR);
        }
        if (n === 5) {
            return new EditInfo("Corner For Forward Beta High Current Roll-Off (IKF)", 1 / this.invRollOffF);
        }
        if (n === 6) {
            return new EditInfo("Corner For Reverse Beta High Current Roll-Off (IKR)", 1 / this.invRollOffR);
        }
        if (n === 7) {
            return new EditInfo("Forward Current Emission Coefficient (NF)", this.emissionCoeffF);
        }
        if (n === 8) {
            return new EditInfo("Reverse Current Emission Coefficient (NR)", this.emissionCoeffR);
        }
        if (n === 9) {
            return new EditInfo("B-E Leakage Saturation Current (ISE)", this.BEleakCur);
        }
        if (n === 10) {
            return new EditInfo("B-E Leakage Emission Coefficient (NE)", this.leakBEemissionCoeff);
        }
        if (n === 11) {
            return new EditInfo("B-C Leakage Saturation Current (ISC)", this.BCleakCur);
        }
        if (n === 12) {
            return new EditInfo("B-C Leakage Emission Coefficient (NC)", this.leakBCemissionCoeff);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.name = ei.textf.getText();
            if (this.name.length > 0) {
                TransistorModel.modelMap.put(this.name, this);
            }
        }
        if (n === 1) {
            this.satCur = ei.value;
        }
        if (n === 2) {
            this.betaR = ei.value;
        }
        if (n === 3) {
            this.invEarlyVoltF = 1 / ei.value;
        }
        if (n === 4) {
            this.invEarlyVoltR = 1 / ei.value;
        }
        if (n === 5) {
            this.invRollOffF = 1 / ei.value;
        }
        if (n === 6) {
            this.invRollOffR = 1 / ei.value;
        }
        if (n === 7) {
            this.emissionCoeffF = ei.value;
        }
        if (n === 8) {
            this.emissionCoeffR = ei.value;
        }
        if (n === 9) {
            this.BEleakCur = ei.value;
        }
        if (n === 10) {
            this.leakBEemissionCoeff = ei.value;
        }
        if (n === 11) {
            this.BCleakCur = ei.value;
        }
        if (n === 12) {
            this.leakBCemissionCoeff = ei.value;
        }
        this.updateModel();
        CirSim.theSim.updateModels();
    }
    updateModel(): void {
    }
    dump(): string {
        this.dumped = true;
        return "32 " + CustomLogicModel.escape(this.name) + " " + this.flags + " " + this.satCur + " " + this.invRollOffF + " " + this.BEleakCur + " " + this.leakBEemissionCoeff + " " + this.invRollOffR + " " + this.BCleakCur + " " + this.leakBCemissionCoeff + " " + this.emissionCoeffF + " " + this.emissionCoeffR + " " + this.invEarlyVoltF + " " + this.invEarlyVoltR + " " + this.betaR;
    }
    constructor() {}
}
Object.assign(TransistorModel.prototype, { "flags": 0, "name": null, "description": null, "satCur": 0, "invRollOffF": 0, "BEleakCur": 0, "leakBEemissionCoeff": 0, "invRollOffR": 0, "BCleakCur": 0, "leakBCemissionCoeff": 0, "emissionCoeffF": 0, "emissionCoeffR": 0, "invEarlyVoltF": 0, "invEarlyVoltR": 0, "betaR": 0, "dumped": false, "readOnly": false, "builtIn": false });
