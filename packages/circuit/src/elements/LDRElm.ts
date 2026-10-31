/*Bill Collis - June 2015 */

// Changed 2026-10-31: converted from LDRElm.java to TypeScript.
/* eslint-disable */
import { CanvasGradient, CirSim, CircuitElm, CustomLogicModel, EditInfo, Graphics, Label, MouseWheelEvent, Point, Polygon, Scrollbar, StringTokenizer, parseJDouble, toInt } from '../core/internal';

export class LDRElm extends CircuitElm {
    declare position: number;
    //of the slider 0.005 to 0.995
    declare resistance: number;
    //based upon slider position
    declare minLux: number;
    declare maxLux: number;
    declare lux: number;
    declare slider: Scrollbar;
    declare label: Label;
    declare sliderText: string;
    //constructor - when initially created
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        //setup();
        this.minLux = 0.1;
        //dark
        this.maxLux = 10000;
        // sunlight
        this.position = .34;
        this.lux = this.LuxFromSliderPos();
        this.resistance = this.calcResistance(this.lux);
        this.sliderText = "Light Brightness";
        this.createSlider();
        return this;
    }
    //constructor - when read in from file
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.minLux = 0.1;
        //dark
        this.maxLux = 10000;
        // sunlight
        this.position = parseJDouble(st.nextToken$0());
        this.lux = this.LuxFromSliderPos();
        this.resistance = this.calcResistance(this.lux);
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
        return 374;
    }
    //LDR
    //data for file saving - make sure it matches order of items in file input constructor
    dump(): string {
        return super.dump() + " " + this.position + " " + CustomLogicModel.escape(this.sliderText);
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
        this.position = this.slider.getValue() * .0099 + .0001;
        this.lux = this.LuxFromSliderPos();
        this.resistance = this.calcResistance(this.lux);
        this.ps3 = new Point().init$0();
        this.ps4 = new Point().init$0();
    }
    declare arrowPoly: Polygon;
    draw(g: Graphics): void {
        //used Resistor draw
        //int segments = 16;
        let i: number = 0;
        //int ox = 0;
        let hs: number = 6;
        //width
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
        //upper arrow
        g.context.moveTo(-8, 26);
        //arrow1 start   (y,x coordinates from center?)
        g.context.lineTo(8, 12);
        //arrow end point
        g.context.moveTo(2, 12);
        //arrow 1 head
        g.context.lineTo(8, 12);
        //arrow end point
        g.context.lineTo(8, 18);
        g.context.moveTo(12, 26);
        //arrow2 start   (y,x coordinates from center?)
        g.context.lineTo(26, 12);
        //arrow end point
        g.context.moveTo(20, 12);
        //arrow 1 head
        g.context.lineTo(26, 12);
        //arrow end point
        g.context.lineTo(26, 18);
        g.context.stroke();
        g.context.restore();
        if (CircuitElm.sim.showValuesCheckItem.getState()) {
            this.lux = this.LuxFromSliderPos();
            this.resistance = this.calcResistance(this.lux);
            let s: string = CircuitElm.getShortUnitText(this.resistance, "");
            this.drawValues$3(g, s + "\u03A9", hs);
        }
        this.doDots(g);
        this.drawPosts(g);
    }
    calculateCurrent(): void {
        this.current = (this.volts[0] - this.volts[1]) / this.resistance;
    }
    stamp(): void {
        this.lux = this.LuxFromSliderPos();
        this.resistance = this.calcResistance(this.lux);
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
    }
    getInfo(arr: string[]): void {
        arr[0] = "photoresistor";
        arr[1] = "I = " + CircuitElm.getCurrentDText(this.current);
        //getBasicInfo(arr);
        arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
        arr[3] = "R = " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
        arr[4] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Slider Text", 0, -1, -1);
            ei.text = this.sliderText;
            return ei;
        }
        return null;
    }
    //component edited
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.sliderText = ei.textf.getText();
            this.label.setText(this.sliderText);
            CircuitElm.sim.setiFrameHeight();
        }
        this.lux = this.LuxFromSliderPos();
        this.resistance = this.calcResistance(this.lux);
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
    calcResistance(lux: number): number {
        //double loglux = Math.log10(lux);
        //double slope = -1.4;
        //double intercept = 7.1;
        //double logR = 	(loglux-intercept)/slope;
        //return Math.round(Math.pow(10, logR));
        let r: number = (this.maxLux - lux + 1) * 10;
        r = Math.round(r);
        return r;
    }
    LuxFromSliderPos(): number {
        return this.maxLux * this.position + this.minLux;
    }
}
Object.assign(LDRElm.prototype, { "position": 0, "resistance": 0, "minLux": 0, "maxLux": 0, "lux": 0, "slider": null, "label": null, "sliderText": null, "ps3": null, "ps4": null, "arrowPoly": null });
