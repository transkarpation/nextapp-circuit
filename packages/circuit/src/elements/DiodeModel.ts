// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from DiodeModel.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Collections, CustomLogicModel, EditInfo, HashMap, MapEntry, StringTokenizer, Vector, compareStrings, parseJDouble, parseJInt } from '../core/internal';

export class DiodeModel {
    static modelMap: HashMap<string,DiodeModel> = null;
    declare flags: number;
    declare name: string;
    declare description: string;
    declare saturationCurrent: number;
    declare seriesResistance: number;
    declare emissionCoefficient: number;
    declare breakdownVoltage: number;
    // used for UI code, not guaranteed to be set
    declare forwardVoltage: number;
    declare forwardCurrent: number;
    declare dumped: boolean;
    declare readOnly: boolean;
    declare builtIn: boolean;
    declare oldStyle: boolean;
    static FLAGS_SIMPLE: number = 1;
    // Electron thermal voltage at SPICE's default temperature of 27 C (300.15 K):
    static vt: number = 0.025865;
    // The diode's "scale voltage", the voltage increase which will raise current by a factor of e.
    declare vscale: number;
    // The multiplicative equivalent of dividing by vscale (for speed).
    declare vdcoef: number;
    // voltage drop @ 1A
    declare fwdrop: number;
    init$5(sc: number, sr: number, ec: number, bv: number, d: string): this {
        this.saturationCurrent = sc;
        this.seriesResistance = sr;
        this.emissionCoefficient = ec;
        this.breakdownVoltage = bv;
        this.description = d;
        //	CirSim.console("creating diode model " + this);
        //	CirSim.debugger();
        this.updateModel();
        return this;
    }
    static getModelWithName(name: string): DiodeModel {
        DiodeModel.createModelMap();
        let lm: DiodeModel = DiodeModel.modelMap.get(name);
        if (lm != null) {
            return lm;
        }
        lm = new DiodeModel().init$0();
        lm.name = name;
        DiodeModel.modelMap.put(name, lm);
        return lm;
    }
    static getModelWithNameOrCopy(name: string, oldmodel: DiodeModel): DiodeModel {
        DiodeModel.createModelMap();
        let lm: DiodeModel = DiodeModel.modelMap.get(name);
        if (lm != null) {
            return lm;
        }
        if (oldmodel == null) {
            CirSim.console("model not found: " + name);
            return DiodeModel.getDefaultModel();
        }
        //	CirSim.console("copying to " + name);
        lm = new DiodeModel().init$1(oldmodel);
        lm.name = name;
        DiodeModel.modelMap.put(name, lm);
        return lm;
    }
    static createModelMap(): void {
        if (DiodeModel.modelMap != null) {
            return;
        }
        DiodeModel.modelMap = new HashMap();
        DiodeModel.addDefaultModel("spice-default", new DiodeModel().init$5(1e-14, 0, 1, 0, null));
        DiodeModel.addDefaultModel("default", new DiodeModel().init$5(1.7143528192808883e-7, 0, 2, 0, null));
        DiodeModel.addDefaultModel("default-zener", new DiodeModel().init$5(1.7143528192808883e-7, 0, 2, 5.6, null));
        // old default LED with saturation current that is way too small (causes numerical errors)
        DiodeModel.addDefaultModel("old-default-led", new DiodeModel().init$5(2.2349907006671927e-18, 0, 2, 0, null));
        // default for newly created LEDs, https://www.diyaudio.com/forums/software-tools/25884-spice-models-led.html
        DiodeModel.addDefaultModel("default-led", new DiodeModel().init$5(93.2e-12, .042, 3.73, 0, null));
        // https://www.allaboutcircuits.com/textbook/semiconductors/chpt-3/spice-models/
        DiodeModel.addDefaultModel("1N5711", new DiodeModel().init$5(315e-9, 2.8, 2.03, 70, "Schottky"));
        DiodeModel.addDefaultModel("1N5712", new DiodeModel().init$5(680e-12, 12, 1.003, 20, "Schottky"));
        DiodeModel.addDefaultModel("1N34", new DiodeModel().init$5(200e-12, 84e-3, 2.19, 60, "germanium"));
        DiodeModel.addDefaultModel("1N4004", new DiodeModel().init$5(18.8e-9, 28.6e-3, 2, 400, "general purpose"));
        //	addDefaultModel("1N3891", new DiodeModel(63e-9, 9.6e-3, 2, 0));  // doesn't match datasheet very well
        // http://users.skynet.be/hugocoolens/spice/diodes/1n4148.htm
        DiodeModel.addDefaultModel("1N4148", new DiodeModel().init$5(4.352e-9, .6458, 1.906, 75, "switching"));
    }
    static addDefaultModel(name: string, dm: DiodeModel): void {
        DiodeModel.modelMap.put(name, dm);
        dm.readOnly = dm.builtIn = true;
        dm.name = name;
    }
    // create a new model using given parameters, keeping backward compatibility.  The method we use has problems, but we don't want to
    // change circuit behavior.  We don't do this anymore because we discovered that changing the leakage current to get a given fwdrop
    // does not work well; the leakage currents can be way too high or low.
    static getModelWithParameters(fwdrop: number, zvoltage: number): DiodeModel {
        DiodeModel.createModelMap();
        let emcoef: number = 2;
        // look for existing model with same parameters
        let it: any = DiodeModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,DiodeModel> = (it.next() as any as any);
            let dm: DiodeModel = pair.getValue();
            if (Math.abs(dm.fwdrop - fwdrop) < 1e-8 && dm.seriesResistance === 0 && Math.abs(dm.breakdownVoltage - zvoltage) < 1e-8 && dm.emissionCoefficient === emcoef) {
                return dm;
            }
        }
        // create a new one, converting to new parameter values
        let vscale: number = emcoef * DiodeModel.vt;
        let vdcoef: number = 1 / vscale;
        let leakage: number = 1 / (Math.exp(fwdrop * vdcoef) - 1);
        let name: string = "fwdrop=" + fwdrop;
        if (zvoltage !== 0) {
            name = name + " zvoltage=" + zvoltage;
        }
        let dm: DiodeModel = DiodeModel.getModelWithName(name);
        //	CirSim.console("got model with name " + name);
        dm.saturationCurrent = leakage;
        dm.emissionCoefficient = emcoef;
        dm.breakdownVoltage = zvoltage;
        dm.readOnly = dm.oldStyle = true;
        //	CirSim.console("at drop current is " + (leakage*(Math.exp(fwdrop*vdcoef)-1)));
        //	CirSim.console("sat " + leakage + " em " + emcoef);
        dm.updateModel();
        return dm;
    }
    static getDefaultModel(): DiodeModel {
        return DiodeModel.getModelWithName("default");
    }
    static clearDumpedFlags(): void {
        if (DiodeModel.modelMap == null) {
            return;
        }
        let it: any = DiodeModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,DiodeModel> = (it.next() as any as any);
            pair.getValue().dumped = false;
        }
    }
    static getModelList(zener: boolean): Vector<DiodeModel> {
        let vector: Vector<DiodeModel> = new Vector();
        let it: any = DiodeModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,DiodeModel> = (it.next() as any as any);
            let dm: DiodeModel = pair.getValue();
            if (zener && dm.breakdownVoltage === 0) {
                continue;
            }
            vector.add(dm);
        }
        Collections.sort(vector);
        return vector;
    }
    compareTo(dm: DiodeModel): number {
        return compareStrings(this.name, dm.name);
    }
    getDescription(): string {
        if (this.description == null) {
            return this.name;
        }
        return this.name + " (" + CirSim.LS(this.description) + ")";
    }
    init$0(): this {
        this.saturationCurrent = 1e-14;
        this.seriesResistance = 0;
        this.emissionCoefficient = 1;
        this.breakdownVoltage = 0;
        this.updateModel();
        return this;
    }
    init$1(copy: DiodeModel): this {
        this.flags = copy.flags;
        this.saturationCurrent = copy.saturationCurrent;
        this.seriesResistance = copy.seriesResistance;
        this.emissionCoefficient = copy.emissionCoefficient;
        this.breakdownVoltage = copy.breakdownVoltage;
        this.forwardCurrent = copy.forwardCurrent;
        this.updateModel();
        return this;
    }
    static undumpModel(st: StringTokenizer): void {
        let name: string = CustomLogicModel.unescape(st.nextToken$0());
        let dm: DiodeModel = DiodeModel.getModelWithName(name);
        dm.undump(st);
    }
    undump(st: StringTokenizer): void {
        this.flags = parseJInt(st.nextToken$0());
        this.saturationCurrent = parseJDouble(st.nextToken$0());
        this.seriesResistance = parseJDouble(st.nextToken$0());
        this.emissionCoefficient = parseJDouble(st.nextToken$0());
        this.breakdownVoltage = parseJDouble(st.nextToken$0());
        try {
            this.forwardCurrent = parseJDouble(st.nextToken$0());
        } catch (e) {
        }
        this.updateModel();
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Model Name", 0);
            ei.text = this.name == null ? "" : this.name;
            return ei;
        }
        if (n === 1) {
            return new EditInfo("Saturation Current", this.saturationCurrent, -1, -1);
        }
        if (this.isSimple()) {
            if (n === 2) {
                return new EditInfo("Forward Voltage", this.forwardVoltage, -1, -1);
            }
            if (n === 3) {
                return new EditInfo("Current At Above Voltage (A)", this.forwardCurrent, -1, -1);
            }
        } else {
            if (n === 2) {
                return new EditInfo("Series Resistance", this.seriesResistance, -1, -1);
            }
            if (n === 3) {
                return new EditInfo(EditInfo.makeLink("diodecalc.html", "Emission Coefficient"), this.emissionCoefficient, -1, -1);
            }
        }
        if (n === 4) {
            return new EditInfo("Breakdown Voltage", this.breakdownVoltage, -1, -1);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.name = ei.textf.getText();
            if (this.name.length > 0) {
                DiodeModel.modelMap.put(this.name, this);
            }
        }
        if (n === 1) {
            this.saturationCurrent = ei.value;
        }
        if (this.isSimple()) {
            if (n === 2) {
                this.forwardVoltage = ei.value;
            }
            if (n === 3) {
                this.forwardCurrent = ei.value;
            }
            this.setEmissionCoefficient();
        } else {
            if (n === 2) {
                this.seriesResistance = ei.value;
            }
            if (n === 3) {
                this.emissionCoefficient = ei.value;
            }
        }
        if (n === 4) {
            this.breakdownVoltage = Math.abs(ei.value);
        }
        this.updateModel();
        CirSim.theSim.updateModels();
    }
    // set emission coefficient for simple mode if we have enough data
    setEmissionCoefficient(): void {
        if (this.forwardCurrent > 0 && this.forwardVoltage > 0) {
            this.emissionCoefficient = (this.forwardVoltage / Math.log(this.forwardCurrent / this.saturationCurrent + 1)) / DiodeModel.vt;
        }
    }
    setForwardVoltage(): void {
        if (this.forwardCurrent === 0) {
            this.forwardCurrent = 1;
        }
        this.forwardVoltage = this.emissionCoefficient * DiodeModel.vt * Math.log(this.forwardCurrent / this.saturationCurrent + 1);
    }
    updateModel(): void {
        this.vscale = this.emissionCoefficient * DiodeModel.vt;
        this.vdcoef = 1 / this.vscale;
        this.fwdrop = Math.log(1 / this.saturationCurrent + 1) * this.emissionCoefficient * DiodeModel.vt;
    }
    dump(): string {
        this.dumped = true;
        return "34 " + CustomLogicModel.escape(this.name) + " " + this.flags + " " + this.saturationCurrent + " " + this.seriesResistance + " " + this.emissionCoefficient + " " + this.breakdownVoltage + " " + this.forwardCurrent;
    }
    isSimple(): boolean {
        return (this.flags & DiodeModel.FLAGS_SIMPLE) !== 0;
    }
    setSimple(s: boolean): void {
        this.flags = (s) ? DiodeModel.FLAGS_SIMPLE : 0;
    }
    pickName(): void {
        if (this.breakdownVoltage > 0 && this.breakdownVoltage < 20) {
            this.name = "zener-" + CircuitElm.showFormat.format(this.breakdownVoltage);
        } else if (this.isSimple()) {
            this.name = "fwdrop=" + CircuitElm.showFormat.format(this.forwardVoltage);
        } else {
            this.name = "diodemodel";
        }
        if (DiodeModel.modelMap.get(this.name) != null) {
            let num: number = 2;
            for (; ; num++) {
                let n: string = this.name + "-" + num;
                if (DiodeModel.modelMap.get(n) == null) {
                    this.name = n;
                    break;
                }
            }
        }
    }
    constructor() {}
}
Object.assign(DiodeModel.prototype, { "flags": 0, "name": null, "description": null, "saturationCurrent": 0, "seriesResistance": 0, "emissionCoefficient": 0, "breakdownVoltage": 0, "forwardVoltage": 0, "forwardCurrent": 0, "dumped": false, "readOnly": false, "builtIn": false, "oldStyle": false, "vscale": 0, "vdcoef": 0, "fwdrop": 0 });
