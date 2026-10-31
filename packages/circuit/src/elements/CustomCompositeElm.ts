// instances of subcircuits

// Changed 2026-10-31: converted from CustomCompositeElm.java to TypeScript.
/* eslint-disable */
import { Button, Choice, CirSim, CircuitElm, CompositeElm, CustomCompositeChipElm, CustomCompositeModel, CustomLogicModel, EditCompositeModelDialog, EditInfo, ExtListEntry, Graphics, StringTokenizer, Vector, Window, newArray } from '../core/internal';

export class CustomCompositeElm extends CompositeElm {
    declare modelName: string;
    declare chip: CustomCompositeChipElm;
    declare postCount: number;
    declare inputCount: number;
    declare outputCount: number;
    declare model: CustomCompositeModel;
    static lastModelName: string = "default";
    init$2(xx: number, yy: number): this {
        CompositeElm.prototype.init$2.call(this, xx, yy);
        // use last model as default when creating new element in UI.
        // use default otherwise, to avoid infinite recursion when creating nested subcircuits.
        this.modelName = (xx === 0 && yy === 0) ? "default" : CustomCompositeElm.lastModelName;
        this.flags |= this.FLAG_ESCAPE;
        this.updateModels$0();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CompositeElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.modelName = CustomLogicModel.unescape(st.nextToken$0());
        this.updateModels$1(st);
        return this;
    }
    dump(): string {
        // insert model name before the elements
        let s: string = super.dumpWithMask(0);
        s += " " + CustomLogicModel.escape(this.modelName);
        s += this.dumpElements$0();
        return s;
    }
    dumpModel(): string {
        let modelStr: string = "";
        // dump models of all children
        for (let i: number = 0; i < this.compElmList.size(); i++) {
            let ce: CircuitElm = this.compElmList.get(i);
            let m: string = ce.dumpModel();
            if (m != null && !(m.length === 0)) {
                if (!(modelStr.length === 0)) {
                    modelStr += "\n";
                }
                modelStr += m;
            }
        }
        if (this.model.dumped) {
            return modelStr;
        }
        // dump our model
        if (!(modelStr.length === 0)) {
            modelStr += "\n";
        }
        modelStr += this.model.dump();
        return modelStr;
    }
    draw(g: Graphics): void {
        let i: number = 0;
        for (i = 0; i !== this.postCount; i++) {
            this.chip.volts[i] = this.volts[i];
            this.chip.pins[i].current = this.getCurrentIntoNode(i);
        }
        this.chip.setSelected(this.needsHighlight());
        this.chip.draw(g);
        this.boundingBox = this.chip.boundingBox;
    }
    setPoints(): void {
        this.chip = new CustomCompositeChipElm().init$2(this.x, this.y);
        this.chip.x2 = this.x2;
        this.chip.y2 = this.y2;
        this.chip.sizeX = this.model.sizeX;
        this.chip.sizeY = this.model.sizeY;
        this.chip.allocPins(this.postCount);
        let i: number = 0;
        for (i = 0; i !== this.postCount; i++) {
            let pin: ExtListEntry = this.model.extList.get(i);
            this.chip.setPin$4(i, pin.pos, pin.side, pin.name);
        }
        this.chip.setPoints();
        for (i = 0; i !== this.getPostCount(); i++) {
            this.setPost$2(i, this.chip.getPost(i));
        }
    }
    updateModels$0(): void {
        this.updateModels$1(null);
    }
    updateModels$1(st: StringTokenizer): void {
        this.model = CustomCompositeModel.getModelWithName(this.modelName);
        if (this.model == null) {
            return;
        }
        this.postCount = this.model.extList.size();
        let externalNodes: number[] = newArray(0, this.postCount);
        let i: number = 0;
        for (i = 0; i !== this.postCount; i++) {
            externalNodes[i] = this.model.extList.get(i).node;
        }
        if (st == null) {
            st = new StringTokenizer().init$2(this.model.elmDump, " ");
        }
        this.loadComposite(st, this.model.nodeList, externalNodes);
        this.allocNodes();
        this.setPoints();
    }
    getPostCount(): number {
        return this.postCount;
    }
    declare models: Vector<CustomCompositeModel>;
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo(EditInfo.makeLink("subcircuits.html", "Model Name"), 0, -1, -1);
            this.models = CustomCompositeModel.getModelList();
            ei.choice = new Choice();
            let i: number = 0;
            for (i = 0; i !== this.models.size(); i++) {
                let ccm: CustomCompositeModel = this.models.get(i);
                ei.choice.add(ccm.name);
                if (ccm === this.model) {
                    ei.choice.select(i);
                }
            }
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.button = new Button(CirSim.LS("Edit Model"));
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.model = this.models.get(ei.choice.getSelectedIndex());
            CustomCompositeElm.lastModelName = this.modelName = this.model.name;
            this.updateModels$0();
            this.setPoints();
            return;
        }
        if (n === 1) {
            if ((this.model.name === "default")) {
                Window.alert(CirSim.LS("Can't edit this model."));
                return;
            }
            let dlg: EditCompositeModelDialog = new EditCompositeModelDialog();
            dlg.setModel(this.model);
            dlg.createDialog();
            CirSim.dialogShowing = dlg;
            dlg.show();
            return;
        }
    }
    getDumpType(): number {
        return 410;
    }
    getInfo(arr: string[]): void {
        super.getInfo(arr);
        arr[0] = "subcircuit (" + this.model.name + ")";
        let i: number = 0;
        for (i = 0; i !== this.postCount; i++) {
            if (i + 1 >= arr.length) {
                break;
            }
            arr[i + 1] = this.model.extList.get(i).name + " = " + CircuitElm.getVoltageText(this.volts[i]);
        }
    }
}
Object.assign(CustomCompositeElm.prototype, { "modelName": null, "chip": null, "postCount": 0, "inputCount": 0, "outputCount": 0, "model": null, "models": null });
