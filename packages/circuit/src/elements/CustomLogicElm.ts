// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from CustomLogicElm.java to TypeScript.
/* eslint-disable */
import { Button, ChipElm, ChipElm_Pin, CirSim, CircuitElm, CustomLogicModel, EditDialog, EditInfo, StringTokenizer, charAt, newArray, parseJDouble } from '../core/internal';

export class CustomLogicElm extends ChipElm {
    declare modelName: string;
    declare postCount: number;
    declare inputCount: number;
    declare outputCount: number;
    declare model: CustomLogicModel;
    declare lastValues: boolean[];
    declare patternValues: boolean[];
    declare highImpedance: boolean[];
    static lastModelName: string = "default";
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.modelName = CustomLogicElm.lastModelName;
        this.setupPins();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.modelName = CustomLogicModel.unescape(st.nextToken$0());
        this.updateModels$0();
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            if (this.pins[i].output) {
                this.volts[i] = parseJDouble(st.nextToken$0());
                this.pins[i].value = this.volts[i] > 2.5;
            }
        }
        return this;
    }
    dump(): string {
        let s: string = super.dump();
        s += " " + CustomLogicModel.escape(this.modelName);
        // the code to do this in ChipElm doesn't work here because we don't know
        // how many pins to read until we read the model name!  So we have to
        // duplicate it here.
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            if (this.pins[i].output) {
                s += " " + this.volts[i];
            }
        }
        return s;
    }
    dumpModel(): string {
        if (this.model.dumped) {
            return "";
        }
        return this.model.dump();
    }
    updateModels$0(): void {
        this.model = CustomLogicModel.getModelWithNameOrCopy(this.modelName, this.model);
        this.setupPins();
        this.allocNodes();
        this.setPoints();
    }
    setupPins(): void {
        if (this.modelName == null) {
            this.postCount = this.bits;
            this.allocNodes();
            return;
        }
        this.model = CustomLogicModel.getModelWithName(this.modelName);
        this.inputCount = this.model.inputs.length;
        this.outputCount = this.model.outputs.length;
        this.sizeY = this.inputCount > this.outputCount ? this.inputCount : this.outputCount;
        if (this.sizeY === 0) {
            this.sizeY = 1;
        }
        this.sizeX = 2;
        this.postCount = this.inputCount + this.outputCount;
        this.pins = newArray(null, this.postCount);
        let i: number = 0;
        for (i = 0; i !== this.inputCount; i++) {
            this.pins[i] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_W, this.model.inputs[i]);
            this.pins[i].fixName();
        }
        for (i = 0; i !== this.outputCount; i++) {
            this.pins[i + this.inputCount] = new ChipElm_Pin().init$3(this, i, ChipElm.SIDE_E, this.model.outputs[i]);
            this.pins[i + this.inputCount].output = true;
            this.pins[i + this.inputCount].fixName();
        }
        this.lastValues = newArray(false, this.postCount);
        this.patternValues = newArray(false, 26);
        this.highImpedance = newArray(false, this.postCount);
    }
    getPostCount(): number {
        return this.postCount;
    }
    getVoltageSourceCount(): number {
        return this.outputCount;
    }
    // keep track of whether we have any tri-state outputs.  if not, then we can simplify things quite a bit, making the simulation faster
    hasTriState(): boolean {
        return this.model == null ? false : this.model.triState;
    }
    nonLinear(): boolean {
        return this.hasTriState();
    }
    getInternalNodeCount(): number {
        // for tri-state outputs, we need an internal node to connect a voltage source to, and then connect a resistor from there to the output.
        // we do this for all outputs if any of them are tri-state
        return (this.hasTriState()) ? this.outputCount : 0;
    }
    stamp(): void {
        let i: number = 0;
        let add: number = (this.hasTriState()) ? this.outputCount : 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (p.output) {
                CircuitElm.sim.stampVoltageSource(0, this.nodes[i + add], p.voltSource);
                if (this.hasTriState()) {
                    CircuitElm.sim.stampNonLinear(this.nodes[i + add]);
                    CircuitElm.sim.stampNonLinear(this.nodes[i]);
                }
            }
        }
    }
    doStep(): void {
        let i: number = 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (!p.output) {
                p.value = this.volts[i] > 2.5;
            }
        }
        this.execute();
        let add: number = (this.hasTriState()) ? this.outputCount : 0;
        for (i = 0; i !== this.getPostCount(); i++) {
            let p: ChipElm_Pin = this.pins[i];
            if (p.output) {
                // connect output voltage source (to internal node if tri-state, otherwise connect directly to output)
                CircuitElm.sim.updateVoltageSource(0, this.nodes[i + add], p.voltSource, p.value ? 5 : 0);
                // add resistor for tri-state if necessary
                if (this.hasTriState()) {
                    CircuitElm.sim.stampResistor(this.nodes[i + add], this.nodes[i], this.highImpedance[i] ? 1e8 : 1e-3);
                }
            }
        }
    }
    execute(): void {
        let i: number = 0;
        for (i = 0; i !== this.model.rulesLeft.size(); i++) {
            // check for a match
            let rl: string = this.model.rulesLeft.get(i);
            let j: number = 0;
            for (j = 0; j !== rl.length; j++) {
                let x: number = charAt(rl, j);
                if (x === 48 || x === 49) {
                    if (this.pins[j].value === (x === 49)) {
                        continue;
                    }
                    break;
                }
                // don't care
                if (x === 63) {
                    continue;
                }
                // up transition
                if (x === 43) {
                    if (this.pins[j].value && !this.lastValues[j]) {
                        continue;
                    }
                    break;
                }
                // down transition
                if (x === 45) {
                    if (!this.pins[j].value && this.lastValues[j]) {
                        continue;
                    }
                    break;
                }
                // save pattern values
                if (x >= 97 && x <= 122) {
                    this.patternValues[x - 97] = this.pins[j].value;
                    continue;
                }
                // compare pattern values
                if (x >= 65 && x <= 122) {
                    if (this.patternValues[x - 65] !== this.pins[j].value) {
                        break;
                    }
                    continue;
                }
            }
            if (j !== rl.length) {
                continue;
            }
            // success
            let rr: string = this.model.rulesRight.get(i);
            for (j = 0; j !== rr.length; j++) {
                let x: number = charAt(rr, j);
                this.highImpedance[j + this.inputCount] = false;
                if (x >= 97 && x <= 122) {
                    this.pins[j + this.inputCount].value = this.patternValues[x - 97];
                } else if (x === 95) {
                    this.highImpedance[j + this.inputCount] = true;
                } else {
                    this.pins[j + this.inputCount].value = (x === 49);
                }
            }
            // save values for transition checking
            for (j = 0; j !== this.postCount; j++) {
                this.lastValues[j] = this.pins[j].value;
            }
            break;
        }
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            let ei: EditInfo = new EditInfo("Model Name", 0, -1, -1);
            ei.text = this.modelName;
            ei.disallowSliders();
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.button = new Button(CirSim.LS("Edit Model"));
            return ei;
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 2) {
            this.modelName = CustomLogicElm.lastModelName = ei.textf.getText();
            this.model = CustomLogicModel.getModelWithNameOrCopy(this.modelName, this.model);
            this.setupPins();
            this.allocNodes();
            this.setPoints();
            return;
        }
        if (n === 3) {
            let editDialog: EditDialog = new EditDialog(this.model, CircuitElm.sim);
            CirSim.customLogicEditDialog = editDialog;
            editDialog.show();
            return;
        }
        super.setEditValue(n, ei);
    }
    getDumpType(): number {
        return 208;
    }
    getInfo(arr: string[]): void {
        super.getInfo(arr);
        arr[0] = this.model.infoText;
    }
}
Object.assign(CustomLogicElm.prototype, { "modelName": null, "postCount": 0, "inputCount": 0, "outputCount": 0, "model": null, "lastValues": null, "patternValues": null, "highImpedance": null });
