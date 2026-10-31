// values with sliders

// Changed 2026-10-31: converted from Adjustable.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, CustomLogicModel, EditInfo, Label, Scrollbar, StringTokenizer, parseJDouble, parseJInt, toInt } from '../core/internal';

export class Adjustable {
    declare elm: CircuitElm;
    declare minValue: number;
    declare maxValue: number;
    declare sliderText: string;
    // index of value in getEditInfo() list that this slider controls
    declare editItem: number;
    declare label: Label;
    declare slider: Scrollbar;
    declare settingValue: boolean;
    init$CircuitElm_int(ce: CircuitElm, item: number): this {
        this.minValue = 1;
        this.maxValue = 1000;
        this.elm = ce;
        this.editItem = item;
        return this;
    }
    // undump
    init$StringTokenizer_CirSim(st: StringTokenizer, sim: CirSim): this {
        let e: number = parseJInt(st.nextToken$0());
        if (e === -1) {
            return this;
        }
        this.elm = sim.getElm(e);
        this.editItem = parseJInt(st.nextToken$0());
        this.minValue = parseJDouble(st.nextToken$0());
        this.maxValue = parseJDouble(st.nextToken$0());
        this.sliderText = CustomLogicModel.unescape(st.nextToken$0());
        return this;
    }
    createSlider$1(sim: CirSim): void {
        let value: number = this.elm.getEditInfo(this.editItem).value;
        this.createSlider$2(sim, value);
    }
    createSlider$2(sim: CirSim, value: number): void {
        sim.addWidgetToVerticalPanel(this.label = new Label(CirSim.LS(this.sliderText)));
        this.label.addStyleName("topSpace");
        let intValue: number = toInt(((value - this.minValue) * 100 / (this.maxValue - this.minValue)));
        sim.addWidgetToVerticalPanel(this.slider = new Scrollbar(Scrollbar.HORIZONTAL, intValue, 1, 0, 101, this, this.elm));
    }
    setSliderValue(value: number): void {
        let intValue: number = toInt(((value - this.minValue) * 100 / (this.maxValue - this.minValue)));
        this.settingValue = true;
        // don't recursively set value again in execute()
        this.slider.setValue(intValue);
        this.settingValue = false;
    }
    execute(): void {
        CircuitElm.sim.analyzeFlag = true;
        if (this.settingValue) {
            return;
        }
        let ei: EditInfo = this.elm.getEditInfo(this.editItem);
        ei.value = this.getSliderValue();
        this.elm.setEditValue(this.editItem, ei);
        CircuitElm.sim.repaint();
    }
    getSliderValue(): number {
        return this.minValue + (this.maxValue - this.minValue) * this.slider.getValue() / 100;
    }
    deleteSlider(sim: CirSim): void {
        sim.removeWidgetFromVerticalPanel(this.label);
        sim.removeWidgetFromVerticalPanel(this.slider);
    }
    dump(): string {
        return CircuitElm.sim.locateElm(this.elm) + " " + this.editItem + " " + this.minValue + " " + this.maxValue + " " + CustomLogicModel.escape(this.sliderText);
    }
    constructor() {}
}
Object.assign(Adjustable.prototype, { "elm": null, "minValue": 0, "maxValue": 0, "sliderText": null, "editItem": 0, "label": null, "slider": null, "settingValue": false });
