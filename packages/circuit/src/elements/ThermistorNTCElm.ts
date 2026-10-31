/*Bill Collis - June 2015

datasheet for Vishay thermistor ntcle100
thermistor model
view-source:http://www.giangrandi.ch/electronics/ntc/ntc.shtml
http://www.giangrandi.ch/electronics/ntc/ntcparam.html
no heating effects
ID = 350
add id to CirSim.constructElement and part to CirSim.createCe and to CirSimcomposeMainMenu
 */

// Changed 2026-10-31: converted from ThermistorNTCElm.java to TypeScript.
/* eslint-disable */
import { CanvasGradient, CirSim, CircuitElm, CustomLogicModel, EditInfo, Graphics, Label, MouseWheelEvent, Point, Scrollbar, StringTokenizer, parseJDouble, toChar, toInt } from '../core/internal';

export class ThermistorNTCElm extends CircuitElm {
    declare position: number;
    //of the slider 0.005 to 0.995
    declare resistance: number;
    //based upon slider position
    declare minTempr: number;
    declare maxTempr: number;
    //Celsius - note min is -40, max is +150 degC
    declare temperature: number;
    //calculated from slider value (0.005 - 0.995) ratios of minTempr - maxTempr
    declare r25: number;
    declare r50: number;
    //the values that a user can input from a datsheet r 225 degc and r at 50degC
    declare rneg40: number;
    //maximum resistance - will be at -40 degC
    declare b25100: number;
    // constant based upon 2 values of R for 2 temperatures
    declare t0: number;
    declare t25: number;
    declare slider: Scrollbar;
    //from Pot
    declare label: Label;
    declare sliderText: string;
    //constructor - when initially created
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.t0 = 273.15;
        this.t25 = this.t0 + 25;
        //setup();
        this.minTempr = -40;
        //celsius
        this.maxTempr = 150;
        this.r25 = 10000;
        //default 10k thermistor e.g. NTCLE100E3010 Vishay
        this.r50 = 3605;
        this.position = .34;
        //25 degC for -40 to 150 degC
        //thermistor calcs
        this.rneg40 = this.calcResistance(this.minTempr);
        //for 10k ntc about 400k
        this.b25100 = this.calcB25100();
        //
        this.temperature = this.temprFromSliderPos();
        this.resistance = this.calcResistance(this.temperature);
        this.sliderText = "Temperature";
        this.createSlider();
        return this;
    }
    //constructor - when read in from file
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.t0 = 273.15;
        this.t25 = this.t0 + 25;
        this.r25 = parseJDouble(st.nextToken$0());
        this.r50 = parseJDouble(st.nextToken$0());
        this.minTempr = parseJDouble(st.nextToken$0());
        this.maxTempr = parseJDouble(st.nextToken$0());
        this.position = parseJDouble(st.nextToken$0());
        //thermistor calcs
        this.rneg40 = this.calcResistance(this.minTempr);
        //for 10k ntc about 400k
        this.b25100 = this.calcB25100();
        //
        this.temperature = this.temprFromSliderPos();
        this.resistance = this.calcResistance(this.temperature);
        this.sliderText = CustomLogicModel.unescape(st.nextToken$0());
        this.createSlider();
        //uses position to set the slider
        return this;
    }
    //void setup() {
    //}
    getPostCount(): number {
        return 2;
    }
    getDumpType(): number {
        return 350;
    }
    //NTC thermistor
    //data for file saving - make sure it matches order of items in file input constructor
    dump(): string {
        return super.dump() + " " + this.r25 + " " + this.r50 + " " + this.minTempr + " " + this.maxTempr + " " + this.position + " " + CustomLogicModel.escape(this.sliderText);
    }
    createSlider(): void {
        CircuitElm.sim.addWidgetToVerticalPanel(this.label = new Label(this.sliderText));
        this.label.addStyleName("topSpace");
        let value: number = toInt((this.position * 100));
        CircuitElm.sim.addWidgetToVerticalPanel(this.slider = new Scrollbar(Scrollbar.HORIZONTAL, value, 1, 0, 101, this, this));
    }
    execute(): void {
        CircuitElm.sim.analyzeFlag = true;
        this.setPoints();
    }
    delete(): void {
        CircuitElm.sim.removeWidgetFromVerticalPanel(this.label);
        CircuitElm.sim.removeWidgetFromVerticalPanel(this.slider);
    }
    declare ps3: Point;
    declare ps4: Point;
    //called straight after constructor when txt file is loaded
    setPoints(): void {
        super.setPoints();
        this.calcLeads(32);
        this.position = this.slider.getValue() * .0099 + .005;
        this.temperature = this.temprFromSliderPos();
        this.resistance = this.calcResistance(this.temperature);
        this.ps3 = new Point().init$0();
        this.ps4 = new Point().init$0();
    }
    draw(g: Graphics): void {
        //used Resistor draw
        //int segments = 16;
        let i: number = 0;
        //int ox = 0;
        let hs: number = 6;
        //is this a width
        let v1: number = this.volts[0];
        let v2: number = this.volts[1];
        this.setBbox$3(this.point1, this.point2, hs);
        //the two points that are there when the device is being created
        this.draw2Leads(g);
        //from point1 to lead1 and lead1 to point2 (lead1&2 are on the body)
        this.setPowerColor$Graphics_bool(g, true);
        let len: number = CircuitElm.distance(this.lead1, this.lead2);
        g.context.save();
        g.context.setLineWidth(3.0);
        g.context.transform(((this.lead2.x - this.lead1.x)) / len, ((this.lead2.y - this.lead1.y)) / len, -((this.lead2.y - this.lead1.y)) / len, ((this.lead2.x - this.lead1.x)) / len, this.lead1.x, this.lead1.y);
        let grad: CanvasGradient = g.context.createLinearGradient(0, 0, len, 0);
        grad.addColorStop(0, this.getVoltageColor(g, v1).getHexValue());
        grad.addColorStop(1.0, this.getVoltageColor(g, v2).getHexValue());
        g.context.setStrokeStyle(grad);
        if (!CircuitElm.sim.euroResistorCheckItem.getState()) {
            g.context.beginPath();
            g.context.moveTo(0, 0);
            for (i = 0; i < 4; i++) {
                g.context.lineTo((1 + 4 * i) * len / 16, hs);
                g.context.lineTo((3 + 4 * i) * len / 16, -hs);
            }
            g.context.lineTo(len, 0);
            g.context.stroke();
        } else {
            g.context.strokeRect(0, -hs, len, 2.0 * hs);
            //draw the box for the euro resistor
        }
        g.context.beginPath();
        //thermistor symbol lines 0 is in the middle of the left handside of the resistor box
        g.context.moveTo(0 - hs, hs * 2);
        g.context.lineTo(hs, hs * 2);
        g.context.lineTo(len, -hs * 2);
        g.context.stroke();
        g.context.restore();
        if (CircuitElm.sim.showValuesCheckItem.getState()) {
            this.temperature = this.temprFromSliderPos();
            this.resistance = this.calcResistance(this.temperature);
            let s: string = CircuitElm.getShortUnitText(this.resistance, "");
            let t: string = String.fromCharCode(toChar(176));
            //drawValues(g, "-t:"+s, hs);
            this.drawValues$3(g, this.temperature + t + "C=" + s + "\u03A9", hs);
        }
        this.doDots(g);
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / this.resistance;
    }
    stamp(): void {
        this.temperature = this.temprFromSliderPos();
        //e.g. 190 - 40 for range -40 to +150
        this.resistance = this.calcResistance(this.temperature);
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
        //show temperature as well??
    }
    getInfo(arr: string[]): void {
        arr[0] = "thermistor";
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.current);
        //getBasicInfo(arr);
        arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
        arr[3] = "R = " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
        arr[4] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
        arr[5] = "T = " + CircuitElm.getUnitText$2(this.temperature, "\u00b0C");
    }
    getEditInfo(n: number): EditInfo {
        // ohmString doesn't work here on linux
        if (n === 0) {
            return new EditInfo("R at 25\u00b0C", this.r25, this.r50 + 100, 100000);
        }
        //limits: r25 must be > r50
        if (n === 1) {
            return new EditInfo("R at 50\u00b0C", this.r50, 100, this.r25 - 100);
        }
        if (n === 2) {
            return new EditInfo("Slider min temp (\u00b0C)", this.minTempr, -40, this.maxTempr);
        }
        //limits: maxTempr must be > minTempr
        if (n === 3) {
            return new EditInfo("Slider max temp (\u00b0C)", this.maxTempr, this.minTempr, 150);
        }
        if (n === 4) {
            let ei: EditInfo = new EditInfo("Slider Text", 0, -1, -1);
            ei.text = this.sliderText;
            return ei;
        }
        return null;
    }
    //component edited
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.r25 = ei.value;
        }
        if (n === 1) {
            this.r50 = ei.value;
        }
        if (n === 2) {
            this.minTempr = ei.value;
        }
        if (n === 3) {
            this.maxTempr = ei.value;
        }
        if (n === 4) {
            this.sliderText = ei.textf.getText();
            this.label.setText(this.sliderText);
            CircuitElm.sim.setiFrameHeight();
        }
        this.rneg40 = this.calcResistance(this.minTempr);
        this.b25100 = this.calcB25100();
        //
        this.temperature = this.temprFromSliderPos();
        this.resistance = this.calcResistance(this.temperature);
    }
    setMouseElm(v: boolean): void {
        super.setMouseElm(v);
        if (this.slider != null) {
            this.slider.draw();
        }
    }
    onMouseWheel(e: MouseWheelEvent): void {
        if (this.slider != null) {
            this.slider.onMouseWheel(e);
        }
    }
    calcResistance(tempr: number): number {
        return Math.round(this.r25 * Math.exp(this.b25100 * ((1 / (tempr + this.t0)) - (1 / this.t25))));
    }
    temprFromSliderPos(): number {
        return Math.round(this.position * (this.maxTempr - this.minTempr) + this.minTempr);
    }
    //determine constant B25100 - when knowing two R values at two temperatures
    calcB25100(): number {
        let kelvin1: number = this.t0 + 25;
        let kelvin2: number = this.t0 + 50;
        return (Math.log(this.r25) - Math.log(this.r50)) / ((1 / kelvin1) - (1 / kelvin2));
    }
}
Object.assign(ThermistorNTCElm.prototype, { "position": 0, "resistance": 0, "minTempr": 0, "maxTempr": 0, "temperature": 0, "r25": 0, "r50": 0, "rneg40": 0, "b25100": 0, "t0": 0, "t25": 0, "slider": null, "label": null, "sliderText": null, "ps3": null, "ps4": null });
