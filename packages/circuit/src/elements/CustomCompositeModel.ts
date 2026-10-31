// model for subcircuits

// Changed 2026-10-31: converted from CustomCompositeModel.java to TypeScript.
/* eslint-disable */
import { ChipElm, Collections, CustomCompositeElm, CustomLogicModel, HashMap, MapEntry, StringTokenizer, Vector, compareStrings, javaSplit, parseJInt } from '../core/internal';

export class ExtListEntry {
    init$2(s: string, n: number): this {
        this.name = s;
        this.node = n;
        this.side = ChipElm.SIDE_W;
        return this;
    }
    init$4(s: string, n: number, p: number, sd: number): this {
        this.name = s;
        this.node = n;
        this.pos = p;
        this.side = sd;
        return this;
    }
    declare name: string;
    declare node: number;
    declare pos: number;
    declare side: number;
    constructor() {}
}
Object.assign(ExtListEntry.prototype, { "name": null, "node": 0, "pos": 0, "side": 0 });

export class CustomCompositeModel {
    static modelMap: HashMap<string,CustomCompositeModel> = null;
    declare flags: number;
    declare sizeX: number;
    declare sizeY: number;
    declare name: string;
    declare nodeList: string;
    declare extList: Vector<ExtListEntry>;
    declare elmDump: string;
    declare dumped: boolean;
    setName(n: string): void {
        CustomCompositeModel.modelMap.remove(this.name);
        this.name = n;
        CustomCompositeModel.modelMap.put(this.name, this);
    }
    static getModelWithName(name: string): CustomCompositeModel {
        if (CustomCompositeModel.modelMap == null) {
            CustomCompositeModel.modelMap = new HashMap();
            // create default stub model
            let extList: Vector<ExtListEntry> = new Vector();
            extList.add(new ExtListEntry().init$2("gnd", 1));
            let d: CustomCompositeModel = CustomCompositeModel.createModel("default", "0 0", "GroundElm 1", extList);
            d.sizeX = d.sizeY = 1;
            CustomCompositeModel.modelMap.put(d.name, d);
        }
        let lm: CustomCompositeModel = CustomCompositeModel.modelMap.get(name);
        return lm;
    }
    static createModel(name: string, elmDump: string, nodeList: string, extList: Vector<ExtListEntry>): CustomCompositeModel {
        let lm: CustomCompositeModel = new CustomCompositeModel().init$0();
        lm.name = name;
        lm.elmDump = elmDump;
        lm.nodeList = nodeList;
        lm.extList = extList;
        CustomCompositeModel.modelMap.put(name, lm);
        return lm;
    }
    static clearDumpedFlags(): void {
        if (CustomCompositeModel.modelMap == null) {
            return;
        }
        let it: any = CustomCompositeModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,CustomCompositeModel> = (it.next() as any as any);
            pair.getValue().dumped = false;
        }
    }
    static getModelList(): Vector<CustomCompositeModel> {
        let vector: Vector<CustomCompositeModel> = new Vector();
        let it: any = CustomCompositeModel.modelMap.entrySet().iterator();
        while (it.hasNext()) {
            let pair: MapEntry<string,CustomCompositeModel> = (it.next() as any as any);
            let dm: CustomCompositeModel = pair.getValue();
            vector.add(dm);
        }
        Collections.sort(vector);
        return vector;
    }
    compareTo(dm: CustomCompositeModel): number {
        return compareStrings(this.name, dm.name);
    }
    init$0(): this {
        return this;
    }
    static undumpModel(st: StringTokenizer): void {
        let name: string = CustomLogicModel.unescape(st.nextToken$0());
        CustomCompositeElm.lastModelName = name;
        let model: CustomCompositeModel = CustomCompositeModel.getModelWithName(name);
        if (model == null) {
            model = new CustomCompositeModel().init$0();
            model.name = name;
            CustomCompositeModel.modelMap.put(name, model);
        }
        model.undump(st);
    }
    undump(st: StringTokenizer): void {
        this.flags = parseJInt(st.nextToken$0());
        this.sizeX = parseJInt(st.nextToken$0());
        this.sizeY = parseJInt(st.nextToken$0());
        let extCount: number = parseJInt(st.nextToken$0());
        let i: number = 0;
        this.extList = new Vector();
        for (i = 0; i !== extCount; i++) {
            let s: string = CustomLogicModel.unescape(st.nextToken$0());
            let n: number = parseJInt(st.nextToken$0());
            let p: number = parseJInt(st.nextToken$0());
            let sd: number = parseJInt(st.nextToken$0());
            this.extList.add(new ExtListEntry().init$4(s, n, p, sd));
        }
        this.nodeList = CustomLogicModel.unescape(st.nextToken$0());
        this.elmDump = CustomLogicModel.unescape(st.nextToken$0());
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
    dump(): string {
        this.dumped = true;
        let str: string = ". " + CustomLogicModel.escape(this.name) + " 0 " + this.sizeX + " " + this.sizeY + " " + this.extList.size() + " ";
        let i: number = 0;
        for (i = 0; i !== this.extList.size(); i++) {
            let ent: ExtListEntry = this.extList.get(i);
            if (i > 0) {
                str += " ";
            }
            str += CustomLogicModel.escape(ent.name) + " " + ent.node + " " + ent.pos + " " + ent.side;
        }
        str += " " + CustomLogicModel.escape(this.nodeList) + " " + CustomLogicModel.escape(this.elmDump);
        return str;
    }
    constructor() {}
}
Object.assign(CustomCompositeModel.prototype, { "flags": 0, "sizeX": 0, "sizeY": 0, "name": null, "nodeList": null, "extList": null, "elmDump": null, "dumped": false });
