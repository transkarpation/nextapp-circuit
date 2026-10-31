// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from CustomLogicModel.java to TypeScript.
/* eslint-disable */
import { CirSim, EditInfo, HashMap, MapEntry, StringTokenizer, TextArea, Vector, Window, charAt, javaSplit, newArray, parseJInt, toChar } from '../core/internal';

export class CustomLogicModel {
    static FLAG_SCHMITT: number = 1;
    static modelMap: HashMap<string,CustomLogicModel> = null;
    declare flags: number;
    declare name: string;
    declare inputs: string[];
    declare outputs: string[];
    declare infoText: string;
    declare rules: string;
    declare rulesLeft: Vector<string>;
    declare rulesRight: Vector<string>;
    declare dumped: boolean;
    declare triState: boolean;
    static getModelWithName(name: string): CustomLogicModel {
        if (CustomLogicModel.modelMap == null) {
            CustomLogicModel.modelMap = new HashMap();
        }
        let lm: CustomLogicModel = CustomLogicModel.modelMap.get(name);
        if (lm != null) {
            return lm;
        }
        lm = new CustomLogicModel().init$0();
        lm.name = name;
        lm.infoText = ((name === "default")) ? "custom logic" : name;
        CustomLogicModel.modelMap.put(name, lm);
        return lm;
    }
    static getModelWithNameOrCopy(name: string, oldmodel: CustomLogicModel): CustomLogicModel {
        if (CustomLogicModel.modelMap == null) {
            CustomLogicModel.modelMap = new HashMap();
        }
        let lm: CustomLogicModel = CustomLogicModel.modelMap.get(name);
        if (lm != null) {
            return lm;
        }
        lm = new CustomLogicModel().init$1(oldmodel);
        lm.name = name;
        lm.infoText = name;
        CustomLogicModel.modelMap.put(name, lm);
        return lm;
    }
    static clearDumpedFlags(): void {
        if (CustomLogicModel.modelMap == null) {
            return;
        }
        let it: any = CustomLogicModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,CustomLogicModel> = (it.next() as any as any);
            pair.getValue().dumped = false;
        }
    }
    init$0(): this {
        this.inputs = this.listToArray("A,B");
        this.outputs = this.listToArray("C,D");
        this.rulesLeft = new Vector();
        this.rulesRight = new Vector();
        this.rules = "";
        return this;
    }
    init$1(copy: CustomLogicModel): this {
        this.flags = copy.flags;
        this.inputs = copy.inputs;
        this.outputs = copy.outputs;
        this.infoText = copy.infoText;
        this.rules = copy.rules;
        this.rulesLeft = copy.rulesLeft;
        this.rulesRight = copy.rulesRight;
        return this;
    }
    static undumpModel(st: StringTokenizer): void {
        let name: string = CustomLogicModel.unescape(st.nextToken$0());
        let model: CustomLogicModel = CustomLogicModel.getModelWithName(name);
        model.undump(st);
    }
    undump(st: StringTokenizer): void {
        this.flags = parseJInt(st.nextToken$0());
        this.inputs = this.listToArray(CustomLogicModel.unescape(st.nextToken$0()));
        this.outputs = this.listToArray(CustomLogicModel.unescape(st.nextToken$0()));
        this.infoText = CustomLogicModel.unescape(st.nextToken$0());
        this.rules = CustomLogicModel.unescape(st.nextToken$0());
        this.parseRules();
    }
    arrayToList(arr: string[]): string {
        if (arr == null) {
            return "";
        }
        if (arr.length === 0) {
            return "";
        }
        let x: string = arr[0];
        let i: number = 0;
        for (i = 1; i < arr.length; i++) {
            x += "," + arr[i];
        }
        return x;
    }
    listToArray(arr: string): string[] {
        return javaSplit(arr, ",");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Inputs", 0, -1, -1);
            ei.text = this.arrayToList(this.inputs);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("Outputs", 0, -1, -1);
            ei.text = this.arrayToList(this.outputs);
            return ei;
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("Info Text", 0, -1, -1);
            ei.text = this.infoText;
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo(EditInfo.makeLink("customlogic.html", "Definition"), 0, -1, -1);
            ei.textArea = new TextArea();
            ei.textArea.setVisibleLines(5);
            ei.textArea.setText(this.rules);
            return ei;
        }
        /*
         * not implemented
        if (n == 4) {
            EditInfo ei = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Schmitt", (flags & FLAG_SCHMITT) != 0);
            return ei;
        }
        */
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.inputs = this.listToArray(ei.textf.getText());
        }
        if (n === 1) {
            this.outputs = this.listToArray(ei.textf.getText());
        }
        if (n === 2) {
            this.infoText = ei.textf.getText();
        }
        if (n === 3) {
            this.rules = ei.textArea.getText();
            this.parseRules();
        }
        if (n === 4) {
            if (ei.checkbox.getState()) {
                this.flags |= CustomLogicModel.FLAG_SCHMITT;
            } else {
                this.flags &= ~CustomLogicModel.FLAG_SCHMITT;
            }
        }
        CirSim.theSim.updateModels();
    }
    parseRules(): void {
        let lines: string[] = javaSplit(this.rules, "\n");
        let i: number = 0;
        this.rulesLeft = new Vector();
        this.rulesRight = new Vector();
        this.triState = false;
        for (i = 0; i !== lines.length; i++) {
            let s: string = lines[i].toLowerCase();
            if (s.length === 0 || s.startsWith("#")) {
                continue;
            }
            let s0: string[] = javaSplit(s.replace(new RegExp(" ", 'g'), ""), "=");
            if (s0.length !== 2) {
                Window.alert("Error on line " + (i + 1) + " of model description");
                return;
            }
            if (s0[0].length < this.inputs.length) {
                Window.alert("Model must have >= " + (this.inputs.length) + " digits on left side");
                return;
            }
            if (s0[0].length > this.inputs.length + this.outputs.length) {
                Window.alert("Model must have <= " + (this.inputs.length + this.outputs.length) + " digits on left side");
                return;
            }
            if (s0[1].length !== this.outputs.length) {
                Window.alert("Model must have " + (this.outputs.length) + " digits on right side");
                return;
            }
            let rl: string = s0[0];
            let used: boolean[] = newArray(false, 26);
            let j: number = 0;
            let newRl: string = "";
            for (j = 0; j !== rl.length; j++) {
                let x: number = charAt(rl, j);
                if (x === 63 || x === 43 || x === 45 || x === 48 || x === 49) {
                    newRl += String.fromCharCode(x);
                    continue;
                }
                if (x < 97 || x > 122) {
                    Window.alert("Error on line " + (i + 1) + " of model description");
                    return;
                }
                // if a letter appears twice, capitalize it the 2nd time so we can compare
                if (used[x - 97]) {
                    newRl += String.fromCharCode(toChar((x + 65 - 97)));
                    continue;
                }
                used[x - 97] = true;
                newRl += String.fromCharCode(x);
            }
            let rr: string = s0[1];
            if (rr.includes("_")) {
                this.triState = true;
            }
            this.rulesLeft.add(newRl);
            this.rulesRight.add(s0[1]);
        }
    }
    dump(): string {
        this.dumped = true;
        if (this.rules.length > 0 && !this.rules.endsWith("\n")) {
            this.rules += "\n";
        }
        return "! " + CustomLogicModel.escape(this.name) + " " + this.flags + " " + CustomLogicModel.escape(this.arrayToList(this.inputs)) + " " + CustomLogicModel.escape(this.arrayToList(this.outputs)) + " " + CustomLogicModel.escape(this.infoText) + " " + CustomLogicModel.escape(this.rules);
    }
    static escape(s: string): string {
        if (s.length === 0) {
            return "\\0";
        }
        return s.split("\\").join("\\\\").split("\n").join("\\n").split(" ").join("\\s").split("+").join("\\p").split("=").join("\\q").split("#").join("\\h").split("&").join("\\a").split("\r").join("\\r");
    }
    static unescape(s: string): string {
        if ((s === "\\0")) {
            return "";
        }
        let i: number = 0;
        for (i = 0; i < s.length; i++) {
            if (charAt(s, i) === 92) {
                let c: number = charAt(s, i + 1);
                if (c === 110) {
                    s = s.substring(0, i) + "\n" + s.substring(i + 2);
                } else if (c === 114) {
                    s = s.substring(0, i) + "\r" + s.substring(i + 2);
                } else if (c === 115) {
                    s = s.substring(0, i) + " " + s.substring(i + 2);
                } else if (c === 112) {
                    s = s.substring(0, i) + "+" + s.substring(i + 2);
                } else if (c === 113) {
                    s = s.substring(0, i) + "=" + s.substring(i + 2);
                } else if (c === 104) {
                    s = s.substring(0, i) + "#" + s.substring(i + 2);
                } else if (c === 97) {
                    s = s.substring(0, i) + "&" + s.substring(i + 2);
                } else {
                    s = s.substring(0, i) + s.substring(i + 1);
                }
            }
        }
        return s;
    }
    constructor() {}
}
Object.assign(CustomLogicModel.prototype, { "flags": 0, "name": null, "inputs": null, "outputs": null, "infoText": null, "rules": null, "rulesLeft": null, "rulesRight": null, "dumped": false, "triState": false });
