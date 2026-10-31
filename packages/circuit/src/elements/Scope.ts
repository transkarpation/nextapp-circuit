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
// plot of single value on a scope

// Changed 2026-10-31: converted from Scope.java to TypeScript.
/* eslint-disable */
import { AudioOutputElm, Canvas, CirSim, CircuitElm, Color, Context2d, CustomLogicModel, FFT, Graphics, LogicOutputElm, MouseWheelEvent, OutputElm, ProbeElm, Rectangle, ScopePropertiesDialog, Storage, StringTokenizer, TransistorElm, Vector, WireElm, charAt, idiv, javaSplit, newArray, numToString, parseJDouble, parseJInt, toInt } from '../core/internal';

export class ScopePlot {
    declare minValues: number[];
    declare maxValues: number[];
    declare scopePointCount: number;
    declare ptr: number;
    // ptr is pointer to the current sample
    declare value: number;
    // Value - the property being shown - e.g. VAL_CURRENT
    // scopePlotSpeed is in sim timestep units per pixel
    declare scopePlotSpeed: number;
    declare units: number;
    declare lastUpdateTime: number;
    declare lastValue: number;
    declare color: string;
    declare elm: CircuitElm;
    // Has a manual scale in "/div" format been put in by the user (as opposed to being
    // inferred from a "MaxValue" format or from an automatically calculated scale)?
    // Manual scales should be kept to sane values anyway, but this shows if this is a user
    // intention we should respect, or if we should try and populate reasonable values from
    // the data we have
    declare manScaleSet: boolean;
    declare manScale: number;
    // Units per division
    declare manVPosition: number;
    // 0 is center of screen. +V_POSITION_STEPS/2 is top of screen
    declare gridMult: number;
    declare plotOffset: number;
    declare acCoupled: boolean;
    declare acAlpha: number;
    // Filter coefficient for AC coupling
    declare acLastOut: number;
    // Store y[i-1] term for AC coupling filter
    static FLAG_AC: number = 1;
    init$2(e: CircuitElm, u: number): this {
        this.manScaleSet = false;
        this.manScale = 1.0;
        this.manVPosition = 0;
        this.acCoupled = false;
        this.acAlpha = 0.9999;
        this.acLastOut = 0;
        this.elm = e;
        this.units = u;
        return this;
    }
    init$4(e: CircuitElm, u: number, v: number, manS: number): this {
        this.manScaleSet = false;
        this.manScale = 1.0;
        this.manVPosition = 0;
        this.acCoupled = false;
        this.acAlpha = 0.9999;
        this.acLastOut = 0;
        this.elm = e;
        this.units = u;
        this.value = v;
        this.manScale = manS;
        // I *think* all units other than V and A can only be positive, so for these move the v position to the bottom.
        if (this.units > Scope.UNITS_A) {
            this.manVPosition = idiv(-Scope.V_POSITION_STEPS, 2);
        }
        return this;
    }
    startIndex(w: number): number {
        return this.ptr + this.scopePointCount - w;
    }
    reset(spc: number, sp: number, full: boolean): void {
        let oldSpc: number = this.scopePointCount;
        this.scopePointCount = spc;
        if (this.scopePlotSpeed !== sp) {
            oldSpc = 0;
        }
        // throw away old data
        this.scopePlotSpeed = sp;
        // Adjust the time constant of the AC coupled filter in proportion to the number of samples
        // we are seeing on the scope (if my maths is right). The constant is empirically determined
        this.acAlpha = 1.0 - 1.0 / (1.15 * this.scopePlotSpeed * this.scopePointCount);
        let oldMin: number[] = this.minValues;
        let oldMax: number[] = this.maxValues;
        this.minValues = newArray(0, this.scopePointCount);
        this.maxValues = newArray(0, this.scopePointCount);
        if (oldMin != null && !full) {
            // preserve old data if possible
            let i: number = 0;
            for (i = 0; i !== this.scopePointCount && i !== oldSpc; i++) {
                let i1: number = (-i) & (this.scopePointCount - 1);
                let i2: number = (this.ptr - i) & (oldSpc - 1);
                this.minValues[i1] = oldMin[i2];
                this.maxValues[i1] = oldMax[i2];
            }
        } else {
            this.lastUpdateTime = CirSim.theSim.t;
        }
        this.ptr = 0;
    }
    timeStep(): void {
        if (this.elm == null) {
            return;
        }
        let v: number = this.elm.getScopeValue(this.value);
        // AC coupling filter. 1st order IIR high pass
        // y[i] = alpha x (y[i-1]+x[i]-x[i-1])
        // We calculate for all iterations (even DC coupled) to prime the data in case they switch to AC later
        let newAcOut: number = this.acAlpha * (this.acLastOut + v - this.lastValue);
        this.lastValue = v;
        this.acLastOut = newAcOut;
        if (this.isAcCoupled()) {
            v = newAcOut;
        }
        if (v < this.minValues[this.ptr]) {
            this.minValues[this.ptr] = v;
        }
        if (v > this.maxValues[this.ptr]) {
            this.maxValues[this.ptr] = v;
        }
        if (CirSim.theSim.t - this.lastUpdateTime >= CirSim.theSim.maxTimeStep * this.scopePlotSpeed) {
            this.ptr = (this.ptr + 1) & (this.scopePointCount - 1);
            this.minValues[this.ptr] = this.maxValues[this.ptr] = v;
            this.lastUpdateTime += CirSim.theSim.maxTimeStep * this.scopePlotSpeed;
        }
    }
    getUnitText(v: number): string {
        switch (this.units) {
            case Scope.UNITS_V:
                return CircuitElm.getVoltageText(v);
            case Scope.UNITS_A:
                return CircuitElm.getCurrentText(v);
            case Scope.UNITS_OHMS:
                return CircuitElm.getUnitText$2(v, CirSim.ohmString);
            case Scope.UNITS_W:
                return CircuitElm.getUnitText$2(v, "W");
        }
        return null;
    }
    static colors: string[] = ["#FF0000", "#FF8000", "#FF00FF", "#7F00FF", "#0000FF", "#0080FF", "#FFFF00", "#00FFFF"];
    assignColor(count: number): void {
        if (count > 0) {
            this.color = ScopePlot.colors[(count - 1) % 8];
            return;
        }
        switch (this.units) {
            case Scope.UNITS_V:
                this.color = CircuitElm.positiveColor.getHexValue();
                break;
            case Scope.UNITS_A:
                this.color = (CirSim.theSim.printableCheckItem.getState()) ? "#A0A000" : "#FFFF00";
                break;
            default:
                this.color = (CirSim.theSim.printableCheckItem.getState()) ? "#000000" : "#FFFFFF";
                break;
        }
    }
    setAcCoupled(b: boolean): void {
        if (this.canAcCouple()) {
            this.acCoupled = b;
        } else {
            this.acCoupled = false;
        }
    }
    canAcCouple(): boolean {
        return this.units === Scope.UNITS_V;
        // AC coupling is permitted if the plot is displaying volts
    }
    isAcCoupled(): boolean {
        return this.acCoupled;
    }
    getPlotFlags(): number {
        return (this.acCoupled ? ScopePlot.FLAG_AC : 0);
    }
    constructor() {}
}
Object.assign(ScopePlot.prototype, { "minValues": null, "maxValues": null, "scopePointCount": 0, "ptr": 0, "value": 0, "scopePlotSpeed": 0, "units": 0, "lastUpdateTime": 0, "lastValue": 0, "color": null, "elm": null, "manScaleSet": false, "manScale": 0, "manVPosition": 0, "gridMult": 0, "plotOffset": 0, "acCoupled": false, "acAlpha": 0, "acLastOut": 0 });

export class Scope {
    declare FLAG_YELM: number;
    // bunch of other flags go here, see dump()
    declare FLAG_IVALUE: number;
    // Flag to indicate if IVALUE is included in dump
    declare FLAG_PLOTS: number;
    // new-style dump with multiple plots
    declare FLAG_PERPLOTFLAGS: number;
    // new-new style dump with plot flags
    declare FLAG_PERPLOT_MAN_SCALE: number;
    // new-new style dump with manual included in each plot
    declare FLAG_MAN_SCALE: number;
    // other flags go here too, see dump()
    static VAL_POWER: number = 7;
    static VAL_POWER_OLD: number = 1;
    static VAL_VOLTAGE: number = 0;
    static VAL_CURRENT: number = 3;
    static VAL_IB: number = 1;
    static VAL_IC: number = 2;
    static VAL_IE: number = 3;
    static VAL_VBE: number = 4;
    static VAL_VBC: number = 5;
    static VAL_VCE: number = 6;
    static VAL_R: number = 2;
    static UNITS_V: number = 0;
    static UNITS_A: number = 1;
    static UNITS_W: number = 2;
    static UNITS_OHMS: number = 3;
    static UNITS_COUNT: number = 4;
    static multa: number[] = [2.0, 2.5, 2.0];
    static V_POSITION_STEPS: number = 200;
    static MIN_MAN_SCALE: number = 1e-9;
    declare scopePointCount: number;
    declare fft: FFT;
    declare position: number;
    // speed is sim timestep units per pixel
    declare speed: number;
    declare stackCount: number;
    // number of scopes in this column
    declare text: string;
    declare rect: Rectangle;
    declare manualScale: boolean;
    declare showI: boolean;
    declare showV: boolean;
    declare showScale$f: boolean;
    declare showMax$f: boolean;
    declare showMin$f: boolean;
    declare showFreq$f: boolean;
    declare plot2d: boolean;
    declare plotXY: boolean;
    declare maxScale$f: boolean;
    declare logSpectrum: boolean;
    declare showFFT$f: boolean;
    declare showNegative: boolean;
    declare showRMS: boolean;
    declare showAverage: boolean;
    declare showDutyCycle: boolean;
    declare plots: Vector<ScopePlot>;
    declare visiblePlots: Vector<ScopePlot>;
    declare pixels: number[];
    declare draw_ox: number;
    declare draw_oy: number;
    declare dpixels: number[];
    declare sim: CirSim;
    declare imageCanvas: Canvas;
    declare imageContext: Context2d;
    declare alphadiv: number;
    // scopeTimeStep to check if sim timestep has changed from previous value when redrawing
    declare scopeTimeStep: number;
    declare scale: number[];
    // Max value to scale the display to show - indexed for each value of UNITS - e.g. UNITS_V, UNITS_A etc.
    declare reduceRange: boolean[];
    declare scaleX: number;
    declare scaleY: number;
    // for X-Y plots
    declare wheelDeltaY: number;
    declare selectedPlot: number;
    declare properties$f: ScopePropertiesDialog;
    declare curColor: string;
    declare voltColor: string;
    declare gridStepX: number;
    declare gridStepY: number;
    declare maxValue: number;
    declare minValue: number;
    declare manDivisions: number;
    // Number of vertical divisions when in manual mode
    declare drawGridLines: boolean;
    declare somethingSelected: boolean;
    init$1(s: CirSim): this {
        this.scopePointCount = 128;
        this.alphadiv = 0;
        this.manDivisions = 8;
        this.sim = s;
        this.scale = newArray(0, Scope.UNITS_COUNT);
        this.reduceRange = newArray(false, Scope.UNITS_COUNT);
        this.rect = new Rectangle().init$4(0, 0, 1, 1);
        this.imageCanvas = Canvas.createIfSupported();
        this.imageContext = this.imageCanvas.getContext2d();
        this.allocImage();
        this.initialize();
        return this;
    }
    showCurrent(b: boolean): void {
        this.showI = b;
        if (b && !this.showingVoltageAndMaybeCurrent()) {
            this.setValue$1(0);
        }
        this.calcVisiblePlots();
    }
    showVoltage(b: boolean): void {
        this.showV = b;
        if (b && !this.showingVoltageAndMaybeCurrent()) {
            this.setValue$1(0);
        }
        this.calcVisiblePlots();
    }
    showMax(b: boolean): void {
        this.showMax$f = b;
    }
    showScale(b: boolean): void {
        this.showScale$f = b;
    }
    showMin(b: boolean): void {
        this.showMin$f = b;
    }
    showFreq(b: boolean): void {
        this.showFreq$f = b;
    }
    showFFT(b: boolean): void {
        this.showFFT$f = b;
        if (!this.showFFT$f) {
            this.fft = null;
        }
    }
    setManualScale(value: boolean, roundup: boolean): void {
        if (value !== this.manualScale) {
            this.clear2dView();
        }
        this.manualScale = value;
        for (const p of this.plots) {
            if (!p.manScaleSet) {
                p.manScale = this.getManScaleFromMaxScale(p.units, roundup);
                p.manVPosition = 0;
                p.manScaleSet = true;
            }
        }
    }
    resetGraph$0(): void {
        this.resetGraph$1(false);
    }
    resetGraph$1(full: boolean): void {
        this.scopePointCount = 1;
        while (this.scopePointCount <= this.rect.width) {
            this.scopePointCount = this.scopePointCount * 2;
        }
        if (this.plots == null) {
            this.plots = new Vector();
        }
        this.showNegative = false;
        let i: number = 0;
        for (i = 0; i !== this.plots.size(); i++) {
            this.plots.get(i).reset(this.scopePointCount, this.speed, full);
        }
        this.calcVisiblePlots();
        this.scopeTimeStep = this.sim.maxTimeStep;
        this.allocImage();
    }
    setManualScaleValue(plotId: number, d: number): void {
        if (plotId >= this.visiblePlots.size()) {
            return;
        }
        // Shouldn't happen, but just in case...
        this.clear2dView();
        this.visiblePlots.get(plotId).manScale = d;
        this.visiblePlots.get(plotId).manScaleSet = true;
    }
    getScaleValue(): number {
        if (this.visiblePlots.size() === 0) {
            return 0;
        }
        let p: ScopePlot = this.visiblePlots.get(0);
        return this.scale[p.units];
    }
    getScaleUnitsText$0(): string {
        if (this.visiblePlots.size() === 0) {
            return "V";
        }
        let p: ScopePlot = this.visiblePlots.get(0);
        return Scope.getScaleUnitsText$1(p.units);
    }
    static getScaleUnitsText$1(units: number): string {
        switch (units) {
            case Scope.UNITS_A:
                return "A";
            case Scope.UNITS_OHMS:
                return CirSim.ohmString;
            case Scope.UNITS_W:
                return "W";
            default:
                return "V";
        }
    }
    active(): boolean {
        return this.plots.size() > 0 && this.plots.get(0).elm != null;
    }
    initialize(): void {
        this.resetGraph$0();
        this.scale[Scope.UNITS_W] = this.scale[Scope.UNITS_OHMS] = this.scale[Scope.UNITS_V] = 5;
        this.scale[Scope.UNITS_A] = .1;
        this.scaleX = 5;
        this.scaleY = .1;
        this.speed = 64;
        this.showMax$f = true;
        this.showV = this.showI = false;
        this.showScale$f = this.showFreq$f = this.manualScale = this.showMin$f = false;
        this.showFFT$f = false;
        this.plot2d = false;
        if (!this.loadDefaults()) {
            // set showV and showI appropriately depending on what plots are present
            let i: number = 0;
            for (i = 0; i !== this.plots.size(); i++) {
                let plot: ScopePlot = this.plots.get(i);
                if (plot.units === Scope.UNITS_V) {
                    this.showV = true;
                }
                if (plot.units === Scope.UNITS_A) {
                    this.showI = true;
                }
            }
        }
    }
    calcVisiblePlots(): void {
        this.visiblePlots = new Vector();
        let i: number = 0;
        let vc: number = 0, ac: number = 0, oc: number = 0;
        if (!this.plot2d) {
            for (i = 0; i !== this.plots.size(); i++) {
                let plot: ScopePlot = this.plots.get(i);
                if (plot.units === Scope.UNITS_V) {
                    if (this.showV) {
                        this.visiblePlots.add(plot);
                        plot.assignColor(vc++);
                    }
                } else if (plot.units === Scope.UNITS_A) {
                    if (this.showI) {
                        this.visiblePlots.add(plot);
                        plot.assignColor(ac++);
                    }
                } else {
                    this.visiblePlots.add(plot);
                    plot.assignColor(oc++);
                }
            }
        } else {
            // In 2D mode the visible plots are the first two plots
            for (i = 0; (i < 2) && (i < this.plots.size()); i++) {
                this.visiblePlots.add(this.plots.get(i));
            }
        }
    }
    setRect(r: Rectangle): void {
        let w: number = this.rect.width;
        this.rect = r;
        if (this.rect.width !== w) {
            this.resetGraph$0();
        }
    }
    getWidth(): number {
        return this.rect.width;
    }
    rightEdge(): number {
        return this.rect.x + this.rect.width;
    }
    setElm(ce: CircuitElm): void {
        this.plots = new Vector();
        if (ce instanceof TransistorElm) {
            this.setValue$2(Scope.VAL_VCE, ce);
        } else {
            this.setValue$2(0, ce);
        }
        this.initialize();
    }
    addElm(ce: CircuitElm): void {
        if (ce instanceof TransistorElm) {
            this.addValue(Scope.VAL_VCE, ce);
        } else {
            this.addValue(0, ce);
        }
    }
    setValue$1(val: number): void {
        if (this.plots.size() > 2 || this.plots.size() === 0) {
            return;
        }
        let ce: CircuitElm = this.plots.first().elm;
        if (this.plots.size() === 2 && this.plots.get(1).elm !== ce) {
            return;
        }
        this.plot2d = this.plotXY = false;
        this.setValue$2(val, ce);
    }
    addValue(val: number, ce: CircuitElm): void {
        if (val === 0) {
            this.plots.add(new ScopePlot().init$4(ce, Scope.UNITS_V, Scope.VAL_VOLTAGE, this.getManScaleFromMaxScale(Scope.UNITS_V, false)));
            // create plot for current if applicable
            if (ce != null && !(ce instanceof OutputElm || ce instanceof LogicOutputElm || ce instanceof AudioOutputElm || ce instanceof ProbeElm)) {
                this.plots.add(new ScopePlot().init$4(ce, Scope.UNITS_A, Scope.VAL_CURRENT, this.getManScaleFromMaxScale(Scope.UNITS_A, false)));
            }
        } else {
            let u: number = ce.getScopeUnits(val);
            this.plots.add(new ScopePlot().init$4(ce, u, val, this.getManScaleFromMaxScale(u, false)));
            if (u === Scope.UNITS_V) {
                this.showV = true;
            }
            if (u === Scope.UNITS_A) {
                this.showI = true;
            }
        }
        this.calcVisiblePlots();
        this.resetGraph$0();
    }
    setValue$2(val: number, ce: CircuitElm): void {
        this.plots = new Vector();
        this.addValue(val, ce);
        //    	initialize();
    }
    setValues(val: number, ival: number, ce: CircuitElm, yelm: CircuitElm): void {
        if (ival > 0) {
            this.plots = new Vector();
            this.plots.add(new ScopePlot().init$4(ce, ce.getScopeUnits(val), val, this.getManScaleFromMaxScale(ce.getScopeUnits(val), false)));
            this.plots.add(new ScopePlot().init$4(ce, ce.getScopeUnits(ival), ival, this.getManScaleFromMaxScale(ce.getScopeUnits(ival), false)));
            return;
        }
        if (yelm != null) {
            this.plots = new Vector();
            this.plots.add(new ScopePlot().init$4(ce, ce.getScopeUnits(val), 0, this.getManScaleFromMaxScale(ce.getScopeUnits(val), false)));
            this.plots.add(new ScopePlot().init$4(yelm, ce.getScopeUnits(ival), 0, this.getManScaleFromMaxScale(ce.getScopeUnits(val), false)));
            return;
        }
        this.setValue$1(val);
    }
    setText(s: string): void {
        this.text = s;
    }
    getText(): string {
        return this.text;
    }
    showingValue(v: number): boolean {
        let i: number = 0;
        for (i = 0; i !== this.plots.size(); i++) {
            let sp: ScopePlot = this.plots.get(i);
            if (sp.value !== v) {
                return false;
            }
        }
        return true;
    }
    // returns true if we have a plot of voltage and nothing else (except current).
    // The default case is a plot of voltage and current, so we're basically checking if that case is true.
    showingVoltageAndMaybeCurrent(): boolean {
        let i: number = 0;
        let gotv: boolean = false;
        for (i = 0; i !== this.plots.size(); i++) {
            let sp: ScopePlot = this.plots.get(i);
            if (sp.value === Scope.VAL_VOLTAGE) {
                gotv = true;
            } else if (sp.value !== Scope.VAL_CURRENT) {
                return false;
            }
        }
        return gotv;
    }
    combine(s: Scope): void {
        /*
	// if voltage and current are shown, remove current
	if (plots.size() == 2 && plots.get(0).elm == plots.get(1).elm)
	    plots.remove(1);
	if (s.plots.size() == 2 && s.plots.get(0).elm == s.plots.get(1).elm)
	    plots.add(s.plots.get(0));
	else
	*/
        this.plots = this.visiblePlots;
        this.plots.addAll(s.visiblePlots);
        s.plots.clear();
        this.calcVisiblePlots();
    }
    // separate this scope's plots into separate scopes and return them in arr[pos], arr[pos+1], etc.  return new length of array.
    separate(arr: Scope[], pos: number): number {
        let i: number = 0;
        let lastPlot: ScopePlot = null as any;
        for (i = 0; i !== this.visiblePlots.size(); i++) {
            if (pos >= arr.length) {
                return pos;
            }
            let s: Scope = new Scope().init$1(this.sim);
            let sp: ScopePlot = this.visiblePlots.get(i);
            if (lastPlot != null && lastPlot.elm === sp.elm && lastPlot.value === Scope.VAL_VOLTAGE && sp.value === Scope.VAL_CURRENT) {
                continue;
            }
            s.setValue$2(sp.value, sp.elm);
            s.position = pos;
            arr[pos++] = s;
            lastPlot = sp;
            s.setFlags(this.getFlags());
            s.setSpeed(this.speed);
        }
        return pos;
    }
    removePlot(plot: number): void {
        if (plot < this.visiblePlots.size()) {
            let p: ScopePlot = this.visiblePlots.get(plot);
            this.plots.removeItem(p);
            this.calcVisiblePlots();
        }
    }
    // called for each timestep
    timeStep(): void {
        let i: number = 0;
        for (i = 0; i !== this.plots.size(); i++) {
            this.plots.get(i).timeStep();
        }
        let x: number = 0;
        let y: number = 0;
        // For 2d plots we draw here rather than in the drawing routine
        if (this.plot2d && this.imageContext != null && this.plots.size() >= 2) {
            let v: number = this.plots.get(0).lastValue;
            let yval: number = this.plots.get(1).lastValue;
            if (!this.isManualScale()) {
                let newscale: boolean = false;
                while (v > this.scaleX || v < -this.scaleX) {
                    this.scaleX *= 2;
                    newscale = true;
                }
                while (yval > this.scaleY || yval < -this.scaleY) {
                    this.scaleY *= 2;
                    newscale = true;
                }
                if (newscale) {
                    this.clear2dView();
                }
                let xa: number = v / this.scaleX;
                let ya: number = yval / this.scaleY;
                x = toInt((this.rect.width * (1 + xa) * .499));
                y = toInt((this.rect.height * (1 - ya) * .499));
            } else {
                let gridPx: number = this.calc2dGridPx(this.rect.width, this.rect.height);
                x = toInt((this.rect.width * .499 + (v / this.plots.get(0).manScale) * gridPx + gridPx * this.manDivisions * (this.plots.get(0).manVPosition) / (Scope.V_POSITION_STEPS)));
                y = toInt((this.rect.height * .499 - (yval / this.plots.get(1).manScale) * gridPx - gridPx * this.manDivisions * (this.plots.get(1).manVPosition) / (Scope.V_POSITION_STEPS)));
            }
            this.drawTo(x, y);
        }
    }
    calc2dGridPx(width: number, height: number): number {
        let m: number = width < height ? width : height;
        return ((m) / 2) / ((this.manDivisions) / 2 + 0.05);
    }
    drawTo(x2: number, y2: number): void {
        if (this.draw_ox === -1) {
            this.draw_ox = x2;
            this.draw_oy = y2;
        }
        if (this.sim.printableCheckItem.getState()) {
            this.imageContext.setStrokeStyle("#000000");
        } else {
            this.imageContext.setStrokeStyle("#ffffff");
        }
        this.imageContext.beginPath();
        this.imageContext.moveTo(this.draw_ox, this.draw_oy);
        this.imageContext.lineTo(x2, y2);
        this.imageContext.stroke();
        this.draw_ox = x2;
        this.draw_oy = y2;
    }
    clear2dView(): void {
        if (this.imageContext != null) {
            if (this.sim.printableCheckItem.getState()) {
                this.imageContext.setFillStyle("#ffffff");
            } else {
                this.imageContext.setFillStyle("#000000");
            }
            this.imageContext.fillRect(0, 0, this.rect.width - 1, this.rect.height - 1);
        }
        this.draw_ox = this.draw_oy = -1;
    }
    /*
    void adjustScale(double x) {
	scale[UNITS_V] *= x;
	scale[UNITS_A] *= x;
	scale[UNITS_OHMS] *= x;
	scale[UNITS_W] *= x;
	scaleX *= x;
	scaleY *= x;
    }
    */
    setMaxScale(s: boolean): void {
        // This procedure is added to set maxscale to an explicit value instead of just having a toggle
        // We call the toggle procedure first because it has useful side-effects and then set the value explicitly.
        this.maxScale();
        this.maxScale$f = s;
    }
    maxScale(): void {
        if (this.plot2d) {
            let x: number = 1e-8;
            this.scale[Scope.UNITS_V] *= x;
            this.scale[Scope.UNITS_A] *= x;
            this.scale[Scope.UNITS_OHMS] *= x;
            this.scale[Scope.UNITS_W] *= x;
            this.scaleX *= x;
            // For XY plots
            this.scaleY *= x;
            return;
        }
        // toggle max scale.  This isn't on by default because, for the examples, we sometimes want two plots
        // matched to the same scale so we can show one is larger.  Also, for some fast-moving scopes
        // (like for AM detector), the amplitude varies over time but you can't see that if the scale is
        // constantly adjusting.  It's also nice to set the default scale to hide noise and to avoid
        // having the scale moving around a lot when a circuit starts up.
        this.maxScale$f = !this.maxScale$f;
        this.showNegative = false;
    }
    drawFFTVerticalGridLines(g: Graphics): void {
        // Draw x-grid lines and label the frequencies in the FFT that they point to.
        let prevEnd: number = 0;
        let divs: number = 20;
        let maxFrequency: number = 1 / (this.sim.maxTimeStep * this.speed * divs * 2);
        for (let i: number = 0; i < divs; i++) {
            let x: number = idiv(this.rect.width * i, divs);
            if (x < prevEnd) {
                continue;
            }
            let s: string = ((Math.round(i * maxFrequency) | 0)) + "Hz";
            let sWidth: number = toInt(Math.ceil(g.context.measureText(s).getWidth()));
            prevEnd = x + sWidth + 4;
            if (i > 0) {
                g.setColor("#880000");
                g.drawLine(x, 0, x, this.rect.height);
            }
            g.setColor("#FF0000");
            g.drawString(s, x + 2, this.rect.height);
        }
    }
    drawFFT(g: Graphics): void {
        if (this.fft == null || this.fft.getSize() !== this.scopePointCount) {
            this.fft = new FFT().init$1(this.scopePointCount);
        }
        let real: number[] = newArray(0, this.scopePointCount);
        let imag: number[] = newArray(0, this.scopePointCount);
        let plot: ScopePlot = (this.visiblePlots.size() === 0) ? this.plots.first() : this.visiblePlots.first();
        let maxV: number[] = plot.maxValues;
        let minV: number[] = plot.minValues;
        let ptr: number = plot.ptr;
        for (let i: number = 0; i < this.scopePointCount; i++) {
            let ii: number = (ptr - i + this.scopePointCount) & (this.scopePointCount - 1);
            // need to average max and min or else it could cause average of function to be > 0, which
            // produces spike at 0 Hz that hides rest of spectrum
            real[i] = .5 * (maxV[ii] + minV[ii]);
            imag[i] = 0;
        }
        this.fft.fft(real, imag);
        let maxM: number = 1e-8;
        for (let i: number = 0; i < idiv(this.scopePointCount, 2); i++) {
            let m: number = this.fft.magnitude(real[i], imag[i]);
            if (m > maxM) {
                maxM = m;
            }
        }
        let prevX: number = 0;
        g.setColor("#FF0000");
        if (!this.logSpectrum) {
            let prevHeight: number = 0;
            let y: number = (this.rect.height - 1) - 12;
            for (let i: number = 0; i < idiv(this.scopePointCount, 2); i++) {
                let x: number = idiv(2 * i * this.rect.width, this.scopePointCount);
                // rect.width may be greater than or less than scopePointCount/2,
                // so x may be greater than or equal to prevX.
                let magnitude: number = this.fft.magnitude(real[i], imag[i]);
                let height: number = toInt(((magnitude * y) / maxM));
                if (x !== prevX) {
                    g.drawLine(prevX, y - prevHeight, x, y - height);
                }
                prevHeight = height;
                prevX = x;
            }
        } else {
            let y0: number = 5;
            let prevY: number = 0;
            let ymult: number = idiv(this.rect.height, 10);
            let val0: number = Math.log(this.scale[plot.units]) * ymult;
            for (let i: number = 0; i < idiv(this.scopePointCount, 2); i++) {
                let x: number = idiv(2 * i * this.rect.width, this.scopePointCount);
                // rect.width may be greater than or less than scopePointCount/2,
                // so x may be greater than or equal to prevX.
                let val: number = Math.log(this.fft.magnitude(real[i], imag[i]));
                let y: number = y0 - toInt((val * ymult - val0));
                if (x !== prevX) {
                    g.drawLine(prevX, prevY, x, y);
                }
                prevY = y;
                prevX = x;
            }
        }
    }
    drawSettingsWheel(g: Graphics): void {
        let outR: number = 8;
        let inR: number = 5;
        let inR45: number = 4;
        let outR45: number = 6;
        if (this.showSettingsWheel()) {
            g.context.save();
            if (this.cursorInSettingsWheel()) {
                g.setColor(Color.cyan);
            } else {
                g.setColor(Color.dark_gray);
            }
            g.context.translate(this.rect.x + 18, this.rect.y + this.rect.height - 18);
            CircuitElm.drawThickCircle(g, 0, 0, inR);
            CircuitElm.drawThickLine$5(g, -outR, 0, -inR, 0);
            CircuitElm.drawThickLine$5(g, outR, 0, inR, 0);
            CircuitElm.drawThickLine$5(g, 0, -outR, 0, -inR);
            CircuitElm.drawThickLine$5(g, 0, outR, 0, inR);
            CircuitElm.drawThickLine$5(g, -outR45, -outR45, -inR45, -inR45);
            CircuitElm.drawThickLine$5(g, outR45, -outR45, inR45, -inR45);
            CircuitElm.drawThickLine$5(g, -outR45, outR45, -inR45, inR45);
            CircuitElm.drawThickLine$5(g, outR45, outR45, inR45, inR45);
            g.context.restore();
        }
    }
    draw2d(g: Graphics): void {
        if (this.imageContext == null) {
            return;
        }
        g.context.save();
        g.context.translate(this.rect.x, this.rect.y);
        g.clipRect(0, 0, this.rect.width, this.rect.height);
        this.alphadiv++;
        if (this.alphadiv > 2) {
            this.alphadiv = 0;
            this.imageContext.setGlobalAlpha(0.01);
            if (this.sim.printableCheckItem.getState()) {
                this.imageContext.setFillStyle("#ffffff");
            } else {
                this.imageContext.setFillStyle("#000000");
            }
            this.imageContext.fillRect(0, 0, this.rect.width, this.rect.height);
            this.imageContext.setGlobalAlpha(1.0);
        }
        g.context.drawImage(this.imageContext.getCanvas(), 0.0, 0.0);
        //    	g.drawImage(image, r.x, r.y, null);
        g.setColor(CircuitElm.whiteColor);
        g.fillOval(this.draw_ox - 2, this.draw_oy - 2, 5, 5);
        // Axis
        g.setColor(CircuitElm.positiveColor);
        g.drawLine(0, idiv(this.rect.height, 2), this.rect.width - 1, idiv(this.rect.height, 2));
        if (!this.plotXY) {
            g.setColor(Color.yellow);
        }
        g.drawLine(idiv(this.rect.width, 2), 0, idiv(this.rect.width, 2), this.rect.height - 1);
        if (this.isManualScale()) {
            let gridPx: number = this.calc2dGridPx(this.rect.width, this.rect.height);
            g.setColor("#404040");
            for (let i: number = -this.manDivisions; i <= this.manDivisions; i++) {
                if (i !== 0) {
                    g.drawLine(toInt((gridPx * i)) + idiv(this.rect.width, 2), 0, toInt((gridPx * i)) + idiv(this.rect.width, 2), this.rect.height);
                }
                g.drawLine(0, toInt((gridPx * i)) + idiv(this.rect.height, 2), this.rect.width, toInt((gridPx * i)) + idiv(this.rect.height, 2));
            }
        }
        this.textY = 10;
        g.setColor(CircuitElm.whiteColor);
        if (this.text != null) {
            this.drawInfoText(g, this.text);
        }
        if (this.showScale$f && this.plots.size() >= 2 && this.isManualScale()) {
            let px: ScopePlot = this.plots.get(0);
            let sx: string = px.getUnitText(px.manScale);
            let py: ScopePlot = this.plots.get(1);
            let sy: string = py.getUnitText(py.manScale);
            this.drawInfoText(g, "X=" + sx + "/div, Y=" + sy + "/div");
        }
        g.context.restore();
        this.drawSettingsWheel(g);
        if (!this.sim.dialogIsShowing() && this.rect.contains(this.sim.mouseCursorX, this.sim.mouseCursorY) && this.plots.size() >= 2) {
            let gridPx: number = this.calc2dGridPx(this.rect.width, this.rect.height);
            let info: string[] = newArray(null, 2);
            let px: ScopePlot = this.plots.get(0);
            let py: ScopePlot = this.plots.get(1);
            let xValue: number = 0;
            let yValue: number = 0;
            if (this.isManualScale()) {
                xValue = px.manScale * ((this.sim.mouseCursorX - this.rect.x - idiv(this.rect.width, 2)) / gridPx - this.manDivisions * px.manVPosition / (Scope.V_POSITION_STEPS));
                yValue = py.manScale * ((-this.sim.mouseCursorY + this.rect.y + idiv(this.rect.height, 2)) / gridPx - this.manDivisions * py.manVPosition / (Scope.V_POSITION_STEPS));
            } else {
                xValue = ((this.sim.mouseCursorX - this.rect.x) / (0.499 * (this.rect.width)) - 1.0) * this.scaleX;
                yValue = -((this.sim.mouseCursorY - this.rect.y) / (0.499 * (this.rect.height)) - 1.0) * this.scaleY;
            }
            info[0] = px.getUnitText(xValue);
            info[1] = py.getUnitText(yValue);
            this.drawCrosshairsInfo(g, info, 2, true);
        }
    }
    showSettingsWheel(): boolean {
        return this.rect.height > 100 && this.rect.width > 100;
    }
    cursorInSettingsWheel(): boolean {
        return this.showSettingsWheel() && this.sim.mouseCursorX >= this.rect.x && this.sim.mouseCursorX <= this.rect.x + 36 && this.sim.mouseCursorY >= this.rect.y + this.rect.height - 36 && this.sim.mouseCursorY <= this.rect.y + this.rect.height;
    }
    draw(g: Graphics): void {
        if (this.plots.size() === 0) {
            return;
        }
        // reset if timestep changed
        if (this.scopeTimeStep !== this.sim.maxTimeStep) {
            this.scopeTimeStep = this.sim.maxTimeStep;
            this.resetGraph$0();
        }
        if (this.plot2d) {
            this.draw2d(g);
            return;
        }
        this.drawSettingsWheel(g);
        g.context.save();
        g.setColor(Color.red);
        g.context.translate(this.rect.x, this.rect.y);
        g.clipRect(0, 0, this.rect.width, this.rect.height);
        if (this.showFFT$f) {
            this.drawFFTVerticalGridLines(g);
            this.drawFFT(g);
        }
        let i: number = 0;
        for (i = 0; i !== Scope.UNITS_COUNT; i++) {
            this.reduceRange[i] = false;
            if (this.maxScale$f && !this.manualScale) {
                this.scale[i] = 1e-4;
            }
        }
        let si: number = 0;
        this.somethingSelected = false;
        // is one of our plots selected?
        for (si = 0; si !== this.visiblePlots.size(); si++) {
            let plot: ScopePlot = this.visiblePlots.get(si);
            this.calcPlotScale(plot);
            if (this.sim.scopeSelected === -1 && plot.elm != null && plot.elm.isMouseElm()) {
                this.somethingSelected = true;
            }
            this.reduceRange[plot.units] = true;
        }
        this.checkForSelection();
        if (this.selectedPlot >= 0) {
            this.somethingSelected = true;
        }
        this.drawGridLines = true;
        let allPlotsSameUnits: boolean = true;
        for (i = 1; i < this.visiblePlots.size(); i++) {
            if (this.visiblePlots.get(i).units !== this.visiblePlots.get(0).units) {
                allPlotsSameUnits = false;
            }
            // Don't draw horizontal grid lines unless all plots are in same units
        }
        if ((allPlotsSameUnits || this.showMax$f || this.showMin$f) && this.visiblePlots.size() > 0) {
            this.calcMaxAndMin(this.visiblePlots.first().units);
        }
        // draw volt plots on top (last), then current plots underneath, then everything else
        for (i = 0; i !== this.visiblePlots.size(); i++) {
            if (this.visiblePlots.get(i).units > Scope.UNITS_A && i !== this.selectedPlot) {
                this.drawPlot(g, this.visiblePlots.get(i), allPlotsSameUnits, false);
            }
        }
        for (i = 0; i !== this.visiblePlots.size(); i++) {
            if (this.visiblePlots.get(i).units === Scope.UNITS_A && i !== this.selectedPlot) {
                this.drawPlot(g, this.visiblePlots.get(i), allPlotsSameUnits, false);
            }
        }
        for (i = 0; i !== this.visiblePlots.size(); i++) {
            if (this.visiblePlots.get(i).units === Scope.UNITS_V && i !== this.selectedPlot) {
                this.drawPlot(g, this.visiblePlots.get(i), allPlotsSameUnits, false);
            }
        }
        // draw selection on top.  only works if selection chosen from scope
        if (this.selectedPlot >= 0 && this.selectedPlot < this.visiblePlots.size()) {
            this.drawPlot(g, this.visiblePlots.get(this.selectedPlot), allPlotsSameUnits, true);
        }
        if (this.visiblePlots.size() > 0) {
            this.drawInfoTexts(g);
        }
        g.restore();
        this.drawCrosshairs(g);
        if (this.plots.get(0).ptr > 5 && !this.manualScale) {
            for (i = 0; i !== Scope.UNITS_COUNT; i++) {
                if (this.scale[i] > 1e-4 && this.reduceRange[i]) {
                    this.scale[i] /= 2;
                }
            }
        }
        if ((this.properties$f != null) && this.properties$f.isShowing()) {
            this.properties$f.refreshDraw();
        }
    }
    // calculate maximum and minimum values for all plots of given units
    calcMaxAndMin(units: number): void {
        this.maxValue = -1e8;
        this.minValue = 1e8;
        let i: number = 0;
        let si: number = 0;
        for (si = 0; si !== this.visiblePlots.size(); si++) {
            let plot: ScopePlot = this.visiblePlots.get(si);
            if (plot.units !== units) {
                continue;
            }
            let ipa: number = plot.startIndex(this.rect.width);
            let maxV: number[] = plot.maxValues;
            let minV: number[] = plot.minValues;
            for (i = 0; i !== this.rect.width; i++) {
                let ip: number = (i + ipa) & (this.scopePointCount - 1);
                if (maxV[ip] > this.maxValue) {
                    this.maxValue = maxV[ip];
                }
                if (minV[ip] < this.minValue) {
                    this.minValue = minV[ip];
                }
            }
        }
    }
    // adjust scale of a plot
    calcPlotScale(plot: ScopePlot): void {
        if (this.manualScale) {
            return;
        }
        let i: number = 0;
        let ipa: number = plot.startIndex(this.rect.width);
        let maxV: number[] = plot.maxValues;
        let minV: number[] = plot.minValues;
        let max: number = 0;
        let gridMax: number = this.scale[plot.units];
        for (i = 0; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            if (maxV[ip] > max) {
                max = maxV[ip];
            }
            if (minV[ip] < -max) {
                max = -minV[ip];
            }
        }
        // scale fixed at maximum?
        if (this.maxScale$f) {
            gridMax = Math.max(max, gridMax);
        } else {
            while (max > gridMax) {
                gridMax *= 2;
            }
        }
        this.scale[plot.units] = gridMax;
    }
    calcGridStepX(): number {
        let multptr: number = 0;
        let gsx: number = 1e-15;
        let ts: number = this.sim.maxTimeStep * this.speed;
        while (gsx < ts * 20) {
            gsx *= Scope.multa[(multptr++) % 3];
        }
        return gsx;
    }
    getGridMaxFromManScale(plot: ScopePlot): number {
        return ((this.manDivisions) / 2 + 0.05) * plot.manScale;
    }
    drawPlot(g: Graphics, plot: ScopePlot, allPlotsSameUnits: boolean, selected: boolean): void {
        if (plot.elm == null) {
            return;
        }
        let i: number = 0;
        let col: string = null as any;
        //    	int col = (sim.printableCheckItem.getState()) ? 0xFFFFFFFF : 0;
        //    	for (i = 0; i != pixels.length; i++)
        //    		pixels[i] = col;
        let gridMid: number = 0, positionOffset: number = 0;
        let multptr: number = 0;
        let x: number = 0;
        let maxy: number = idiv((this.rect.height - 1), 2);
        let color: string = (this.somethingSelected) ? "#A0A0A0" : plot.color;
        if (this.sim.scopeSelected === -1 && plot.elm.isMouseElm()) {
            color = "#00FFFF";
        } else if (selected) {
            color = plot.color;
        }
        let ipa: number = plot.startIndex(this.rect.width);
        let maxV: number[] = plot.maxValues;
        let minV: number[] = plot.minValues;
        let gridMax: number = 0;
        // Calculate the max value (positive) to show and the value at the mid point of the grid
        if (!this.isManualScale()) {
            gridMax = this.scale[plot.units];
            gridMid = 0;
            positionOffset = 0;
            if (allPlotsSameUnits) {
                // if we don't have overlapping scopes of different units, we can move zero around.
                // Put it at the bottom if the scope is never negative.
                let mx: number = gridMax;
                let mn: number = 0;
                if (this.maxScale$f) {
                    // scale is maxed out, so fix boundaries of scope at maximum and minimum.
                    mx = this.maxValue;
                    mn = this.minValue;
                } else if (this.showNegative || this.minValue < (mx + mn) * .5 - (mx - mn) * .55) {
                    mn = -gridMax;
                    this.showNegative = true;
                }
                gridMid = (mx + mn) * .5;
                gridMax = (mx - mn) * .55;
                // leave space at top and bottom
            }
        } else {
            gridMid = 0;
            gridMax = this.getGridMaxFromManScale(plot);
            positionOffset = gridMax * 2.0 * (plot.manVPosition) / (Scope.V_POSITION_STEPS);
        }
        plot.plotOffset = -gridMid + positionOffset;
        plot.gridMult = maxy / gridMax;
        let minRangeLo: number = -10 - toInt((gridMid * plot.gridMult));
        let minRangeHi: number = 10 - toInt((gridMid * plot.gridMult));
        if (!this.isManualScale()) {
            this.gridStepY = 1e-8;
            while (this.gridStepY < 20 * gridMax / maxy) {
                this.gridStepY *= Scope.multa[(multptr++) % 3];
            }
        } else {
            this.gridStepY = plot.manScale;
        }
        let minorDiv: string = "#404040";
        let majorDiv: string = "#A0A0A0";
        if (this.sim.printableCheckItem.getState()) {
            minorDiv = "#D0D0D0";
            majorDiv = "#808080";
            this.curColor = "#A0A000";
        }
        // Vertical (T) gridlines
        let ts: number = this.sim.maxTimeStep * this.speed;
        this.gridStepX = this.calcGridStepX();
        if (this.drawGridLines) {
            // horizontal gridlines
            // don't show hgridlines if lines are too close together (except for center line)
            let showHGridLines: boolean = (this.gridStepY !== 0) && (this.isManualScale() || allPlotsSameUnits);
            // Will only show center line if we have mixed units
            for (let ll: number = -100; ll <= 100; ll++) {
                if (ll !== 0 && !showHGridLines) {
                    continue;
                }
                let yl: number = maxy - toInt(((ll * this.gridStepY - gridMid) * plot.gridMult));
                if (yl < 0 || yl >= this.rect.height - 1) {
                    continue;
                }
                col = ll === 0 ? majorDiv : minorDiv;
                g.setColor(col);
                g.drawLine(0, yl, this.rect.width - 1, yl);
            }
            // vertical gridlines
            let tstart: number = this.sim.t - this.sim.maxTimeStep * this.speed * this.rect.width;
            let tx: number = this.sim.t - (this.sim.t % this.gridStepX);
            for (let ll: number = 0; ; ll++) {
                let tl: number = tx - this.gridStepX * ll;
                let gx: number = toInt(((tl - tstart) / ts));
                if (gx < 0) {
                    break;
                }
                if (gx >= this.rect.width) {
                    continue;
                }
                if (tl < 0) {
                    continue;
                }
                col = minorDiv;
                // first = 0;
                if (((tl + this.gridStepX / 4) % (this.gridStepX * 10)) < this.gridStepX) {
                    col = majorDiv;
                }
                g.setColor(col);
                g.drawLine(gx, 0, gx, this.rect.height - 1);
            }
        }
        // only need gridlines drawn once
        this.drawGridLines = false;
        g.setColor(color);
        if (this.isManualScale()) {
            let y0: number = maxy - toInt((plot.gridMult * plot.plotOffset));
            g.drawLine(0, y0, 8, y0);
            g.drawString("0", 0, y0 - 2);
        }
        let ox: number = -1, oy: number = -1;
        for (i = 0; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            let minvy: number = toInt((plot.gridMult * (minV[ip] + plot.plotOffset)));
            let maxvy: number = toInt((plot.gridMult * (maxV[ip] + plot.plotOffset)));
            if (minvy <= maxy) {
                if (minvy < minRangeLo || maxvy > minRangeHi) {
                    // we got a value outside min range, so we don't need to rescale later
                    this.reduceRange[plot.units] = false;
                    minRangeLo = -1000;
                    minRangeHi = 1000;
                    // avoid triggering this test again
                }
                if (ox !== -1) {
                    if (minvy === oy && maxvy === oy) {
                        continue;
                    }
                    g.drawLine(ox, maxy - oy, x + i - 1, maxy - oy);
                    ox = oy = -1;
                }
                if (minvy === maxvy) {
                    ox = x + i;
                    oy = minvy;
                    continue;
                }
                g.drawLine(x + i, maxy - minvy, x + i, maxy - maxvy - 1);
            }
        }
        // for (i=0...)
        if (ox !== -1) {
            g.drawLine(ox, maxy - oy, x + i - 1, maxy - oy);
        }
        // Horizontal
    }
    // find selected plot
    checkForSelection(): void {
        if (this.sim.dialogIsShowing()) {
            return;
        }
        if (!this.rect.contains(this.sim.mouseCursorX, this.sim.mouseCursorY)) {
            this.selectedPlot = -1;
            return;
        }
        let ipa: number = this.plots.get(0).startIndex(this.rect.width);
        let ip: number = (this.sim.mouseCursorX - this.rect.x + ipa) & (this.scopePointCount - 1);
        let maxy: number = idiv((this.rect.height - 1), 2);
        let y: number = maxy;
        let i: number = 0;
        let bestdist: number = 10000;
        let best: number = -1;
        for (i = 0; i !== this.visiblePlots.size(); i++) {
            let plot: ScopePlot = this.visiblePlots.get(i);
            let maxvy: number = toInt((plot.gridMult * (plot.maxValues[ip] + plot.plotOffset)));
            let dist: number = Math.abs(this.sim.mouseCursorY - (this.rect.y + y - maxvy));
            if (dist < bestdist) {
                bestdist = dist;
                best = i;
            }
        }
        this.selectedPlot = best;
    }
    drawCrosshairs(g: Graphics): void {
        if (this.sim.dialogIsShowing()) {
            return;
        }
        if (!this.rect.contains(this.sim.mouseCursorX, this.sim.mouseCursorY)) {
            return;
        }
        if (this.selectedPlot < 0 && !this.showFFT$f) {
            return;
        }
        let info: string[] = newArray(null, 4);
        let ipa: number = this.plots.get(0).startIndex(this.rect.width);
        let ip: number = (this.sim.mouseCursorX - this.rect.x + ipa) & (this.scopePointCount - 1);
        let ct: number = 0;
        let maxy: number = idiv((this.rect.height - 1), 2);
        let y: number = maxy;
        if (this.selectedPlot >= 0) {
            let plot: ScopePlot = this.visiblePlots.get(this.selectedPlot);
            info[ct++] = plot.getUnitText(plot.maxValues[ip]);
            let maxvy: number = toInt((plot.gridMult * (plot.maxValues[ip] + plot.plotOffset)));
            g.setColor(plot.color);
            g.fillOval(this.sim.mouseCursorX - 2, this.rect.y + y - maxvy - 2, 5, 5);
        }
        if (this.showFFT$f) {
            let maxFrequency: number = 1 / (this.sim.maxTimeStep * this.speed * 2);
            info[ct++] = CircuitElm.getUnitText$2(maxFrequency * (this.sim.mouseCursorX - this.rect.x) / this.rect.width, "Hz");
        }
        if (this.visiblePlots.size() > 0) {
            let t: number = this.sim.t - this.sim.maxTimeStep * this.speed * (this.rect.x + this.rect.width - this.sim.mouseCursorX);
            info[ct++] = CircuitElm.getTimeText(t);
        }
        this.drawCrosshairsInfo(g, info, ct, false);
    }
    drawCrosshairsInfo(g: Graphics, info: string[], ct: number, drawY: boolean): void {
        let szw: number = 0, szh: number = 15 * ct;
        let i: number = 0;
        for (i = 0; i !== ct; i++) {
            let w: number = toInt(g.context.measureText(info[i]).getWidth());
            if (w > szw) {
                szw = w;
            }
        }
        g.setColor(CircuitElm.whiteColor);
        g.drawLine(this.sim.mouseCursorX, this.rect.y, this.sim.mouseCursorX, this.rect.y + this.rect.height);
        if (drawY) {
            g.drawLine(this.rect.x, this.sim.mouseCursorY, this.rect.x + this.rect.width, this.sim.mouseCursorY);
        }
        g.setColor(this.sim.printableCheckItem.getState() ? Color.white : Color.black);
        let bx: number = this.sim.mouseCursorX;
        if (bx < idiv(szw, 2)) {
            bx = idiv(szw, 2);
        }
        g.fillRect(bx - idiv(szw, 2), this.rect.y - szh, szw, szh);
        g.setColor(CircuitElm.whiteColor);
        for (i = 0; i !== ct; i++) {
            let w: number = toInt(g.context.measureText(info[i]).getWidth());
            g.drawString(info[i], bx - idiv(w, 2), this.rect.y - 2 - (ct - 1 - i) * 15);
        }
    }
    canShowRMS(): boolean {
        if (this.visiblePlots.size() === 0) {
            return false;
        }
        let plot: ScopePlot = this.visiblePlots.first();
        return (plot.units === Scope.UNITS_V || plot.units === Scope.UNITS_A);
    }
    // calc RMS and display it
    drawRMS(g: Graphics): void {
        if (!this.canShowRMS()) {
            // needed for backward compatibility
            this.showRMS = false;
            this.showAverage = true;
            this.drawAverage(g);
            return;
        }
        let plot: ScopePlot = this.visiblePlots.first();
        let i: number = 0;
        let avg: number = 0;
        let ipa: number = plot.ptr + this.scopePointCount - this.rect.width;
        let maxV: number[] = plot.maxValues;
        let minV: number[] = plot.minValues;
        let mid: number = (this.maxValue + this.minValue) / 2;
        let state: number = -1;
        // skip zeroes
        for (i = 0; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            if (maxV[ip] !== 0) {
                if (maxV[ip] > mid) {
                    state = 1;
                }
                break;
            }
        }
        let firstState: number = -state;
        let start: number = i;
        let end: number = 0;
        let waveCount: number = 0;
        let endAvg: number = 0;
        for (; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            let sw: boolean = false;
            // switching polarity?
            if (state === 1) {
                if (maxV[ip] < mid) {
                    sw = true;
                }
            } else if (minV[ip] > mid) {
                sw = true;
            }
            if (sw) {
                state = -state;
                // completed a full cycle?
                if (firstState === state) {
                    if (waveCount === 0) {
                        start = i;
                        firstState = state;
                        avg = 0;
                    }
                    waveCount++;
                    end = i;
                    endAvg = avg;
                }
            }
            if (waveCount > 0) {
                let m: number = (maxV[ip] + minV[ip]) * .5;
                avg += m * m;
            }
        }
        let rms: number = 0;
        if (waveCount > 1) {
            rms = Math.sqrt(endAvg / (end - start));
            this.drawInfoText(g, plot.getUnitText(rms) + "rms");
        }
    }
    drawScale(plot: ScopePlot, g: Graphics): void {
        if (!this.isManualScale()) {
            if (this.gridStepY !== 0 && (!(this.showV && this.showI))) {
                let vScaleText: string = " V=" + plot.getUnitText(this.gridStepY) + "/div";
                this.drawInfoText(g, "H=" + CircuitElm.getUnitText$2(this.gridStepX, "s") + "/div" + vScaleText);
            }
        } else {
            if (this.rect.y + this.rect.height <= this.textY + 5) {
                return;
            }
            let x: number = 0;
            let hs: string = "H=" + CircuitElm.getUnitText$2(this.gridStepX, "s") + "/div";
            g.drawString(hs, 0, this.textY);
            x += g.measureWidth(hs);
            let bulletWidth: number = 17;
            for (let i: number = 0; i < this.visiblePlots.size(); i++) {
                let p: ScopePlot = this.visiblePlots.get(i);
                let s: string = p.getUnitText(p.manScale);
                if (p != null) {
                    let vScaleText: string = "=" + s + "/div";
                    let vScaleWidth: number = g.measureWidth(vScaleText);
                    if (x + bulletWidth + vScaleWidth > this.rect.width) {
                        x = 0;
                        this.textY += 15;
                        if (this.rect.y + this.rect.height <= this.textY + 5) {
                            return;
                        }
                    }
                    g.setColor(p.color);
                    g.fillOval(toInt(x) + 7, this.textY - 9, 8, 8);
                    x += bulletWidth;
                    g.setColor(CircuitElm.whiteColor);
                    g.drawString(vScaleText, toInt(x), this.textY);
                    x += vScaleWidth;
                }
            }
            this.textY += 15;
        }
    }
    drawAverage(g: Graphics): void {
        let plot: ScopePlot = this.visiblePlots.first();
        let i: number = 0;
        let avg: number = 0;
        let ipa: number = plot.ptr + this.scopePointCount - this.rect.width;
        let maxV: number[] = plot.maxValues;
        let minV: number[] = plot.minValues;
        let mid: number = (this.maxValue + this.minValue) / 2;
        let state: number = -1;
        // skip zeroes
        for (i = 0; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            if (maxV[ip] !== 0) {
                if (maxV[ip] > mid) {
                    state = 1;
                }
                break;
            }
        }
        let firstState: number = -state;
        let start: number = i;
        let end: number = 0;
        let waveCount: number = 0;
        let endAvg: number = 0;
        for (; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            let sw: boolean = false;
            // switching polarity?
            if (state === 1) {
                if (maxV[ip] < mid) {
                    sw = true;
                }
            } else if (minV[ip] > mid) {
                sw = true;
            }
            if (sw) {
                state = -state;
                // completed a full cycle?
                if (firstState === state) {
                    if (waveCount === 0) {
                        start = i;
                        firstState = state;
                        avg = 0;
                    }
                    waveCount++;
                    end = i;
                    endAvg = avg;
                }
            }
            if (waveCount > 0) {
                let m: number = (maxV[ip] + minV[ip]) * .5;
                avg += m;
            }
        }
        if (waveCount > 1) {
            avg = (endAvg / (end - start));
            this.drawInfoText(g, plot.getUnitText(avg) + CirSim.LS(" average"));
        }
    }
    drawDutyCycle(g: Graphics): void {
        let plot: ScopePlot = this.visiblePlots.first();
        let i: number = 0;
        let ipa: number = plot.ptr + this.scopePointCount - this.rect.width;
        let maxV: number[] = plot.maxValues;
        let minV: number[] = plot.minValues;
        let mid: number = (this.maxValue + this.minValue) / 2;
        let state: number = -1;
        // skip zeroes
        for (i = 0; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            if (maxV[ip] !== 0) {
                if (maxV[ip] > mid) {
                    state = 1;
                }
                break;
            }
        }
        let firstState: number = 1;
        let start: number = i;
        let end: number = 0;
        let waveCount: number = 0;
        let dutyLen: number = 0;
        let middle: number = 0;
        for (; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            let sw: boolean = false;
            // switching polarity?
            if (state === 1) {
                if (maxV[ip] < mid) {
                    sw = true;
                }
            } else if (minV[ip] > mid) {
                sw = true;
            }
            if (sw) {
                state = -state;
                // completed a full cycle?
                if (firstState === state) {
                    if (waveCount === 0) {
                        start = end = i;
                    } else {
                        end = start;
                        start = i;
                        dutyLen = end - middle;
                    }
                    waveCount++;
                } else {
                    middle = i;
                }
            }
        }
        if (waveCount > 1) {
            let duty: number = idiv(100 * dutyLen, (end - start));
            this.drawInfoText(g, CirSim.LS("Duty cycle ") + duty + "%");
        }
    }
    // calc frequency if possible and display it
    drawFrequency(g: Graphics): void {
        // try to get frequency
        // get average
        let avg: number = 0;
        let i: number = 0;
        let plot: ScopePlot = this.visiblePlots.first();
        let ipa: number = plot.ptr + this.scopePointCount - this.rect.width;
        let minV: number[] = plot.minValues;
        let maxV: number[] = plot.maxValues;
        for (i = 0; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            avg += minV[ip] + maxV[ip];
        }
        avg /= i * 2;
        let state: number = 0;
        let thresh: number = avg * .05;
        let oi: number = 0;
        let avperiod: number = 0;
        let periodct: number = -1;
        let avperiod2: number = 0;
        // count period lengths
        for (i = 0; i !== this.rect.width; i++) {
            let ip: number = (i + ipa) & (this.scopePointCount - 1);
            let q: number = maxV[ip] - avg;
            let os: number = state;
            if (q < thresh) {
                state = 1;
            } else if (q > -thresh) {
                state = 2;
            }
            if (state === 2 && os === 1) {
                let pd: number = i - oi;
                oi = i;
                // short periods can't be counted properly
                if (pd < 12) {
                    continue;
                }
                // skip first period, it might be too short
                if (periodct >= 0) {
                    avperiod += pd;
                    avperiod2 += pd * pd;
                }
                periodct++;
            }
        }
        avperiod /= periodct;
        avperiod2 /= periodct;
        let periodstd: number = Math.sqrt(avperiod2 - avperiod * avperiod);
        let freq: number = 1 / (avperiod * this.sim.maxTimeStep * this.speed);
        // don't show freq if standard deviation is too great
        if (periodct < 1 || periodstd > 2) {
            freq = 0;
        }
        // System.out.println(freq + " " + periodstd + " " + periodct);
        if (freq !== 0) {
            this.drawInfoText(g, CircuitElm.getUnitText$2(freq, "Hz"));
        }
    }
    declare textY: number;
    drawInfoText(g: Graphics, text: string): void {
        if (this.rect.y + this.rect.height <= this.textY + 5) {
            return;
        }
        g.drawString(text, 0, this.textY);
        this.textY += 15;
    }
    drawInfoTexts(g: Graphics): void {
        g.setColor(CircuitElm.whiteColor);
        this.textY = 10;
        /*
    	String x = position +" " + plots.size()+" ";
	int i;
    	for (i = 0; i < plots.size(); i++) {
    	    x+=",";
    	    ScopePlot p = plots.get(i);
    	  //  if (i > 0)
    		x += " " + sim.locateElm(p.elm) + " " + p.value;
    	    // dump scale if units are not V or A
    	    if (p.units > UNITS_A)
    		x += " " + scale[p.units];
    	}
    	drawInfoText(g, x);
    	*/
        let plot: ScopePlot = this.visiblePlots.first();
        if (this.showScale$f) {
            this.drawScale(plot, g);
        }
        //    	if (showMax || showMin)
        //    	    calcMaxAndMin(plot.units);
        if (this.showMax$f) {
            this.drawInfoText(g, "Max=" + plot.getUnitText(this.maxValue));
        }
        if (this.showMin$f) {
            let ym: number = this.rect.height - 5;
            g.drawString("Min=" + plot.getUnitText(this.minValue), 0, ym);
        }
        if (this.showRMS) {
            this.drawRMS(g);
        }
        if (this.showAverage) {
            this.drawAverage(g);
        }
        if (this.showDutyCycle) {
            this.drawDutyCycle(g);
        }
        let t: string = this.getScopeLabelOrText();
        if (t != null && t !== "") {
            this.drawInfoText(g, t);
        }
        if (this.showFreq$f) {
            this.drawFrequency(g);
        }
    }
    getScopeText(): string {
        // stacked scopes?  don't show text
        if (this.stackCount !== 1) {
            return null;
        }
        // multiple elms?  don't show text (unless one is selected)
        if (this.selectedPlot < 0 && this.getSingleElm() == null) {
            return null;
        }
        let plot: ScopePlot = this.visiblePlots.first();
        if (this.selectedPlot >= 0 && this.visiblePlots.size() > this.selectedPlot) {
            plot = this.visiblePlots.get(this.selectedPlot);
        }
        if (plot.elm == null) {
            return "";
        } else {
            return plot.elm.getScopeText(plot.value);
        }
    }
    getScopeLabelOrText(): string {
        let t: string = this.text;
        if (t == null) {
            t = this.getScopeText();
            if (t == null) {
                return "";
            }
            return CirSim.LS(t);
        } else {
            return t;
        }
    }
    setSpeed(sp: number): void {
        if (sp < 1) {
            sp = 1;
        }
        if (sp > 1024) {
            sp = 1024;
        }
        this.speed = sp;
        this.resetGraph$0();
    }
    properties(): void {
        this.properties$f = new ScopePropertiesDialog(this.sim, this);
        CirSim.dialogShowing = this.properties$f;
    }
    speedUp(): void {
        if (this.speed > 1) {
            this.speed = idiv(this.speed, 2);
            this.resetGraph$0();
        }
    }
    slowDown(): void {
        if (this.speed < 1024) {
            this.speed = this.speed * 2;
        }
        this.resetGraph$0();
    }
    setPlotPosition(plot: number, v: number): void {
        this.visiblePlots.get(plot).manVPosition = v;
    }
    // get scope element, returning null if there's more than one
    getSingleElm(): CircuitElm {
        let elm: CircuitElm = this.plots.get(0).elm;
        let i: number = 0;
        for (i = 1; i < this.plots.size(); i++) {
            if (this.plots.get(i).elm !== elm) {
                return null;
            }
        }
        return elm;
    }
    canMenu(): boolean {
        return (this.plots.get(0).elm != null);
    }
    canShowResistance(): boolean {
        let elm: CircuitElm = this.getSingleElm();
        return elm != null && elm.canShowValueInScope(Scope.VAL_R);
    }
    isShowingVceAndIc(): boolean {
        return this.plot2d && this.plots.size() === 2 && this.plots.get(0).value === Scope.VAL_VCE && this.plots.get(1).value === Scope.VAL_IC;
    }
    getFlags(): number {
        let flags: number = (this.showI ? 1 : 0) | (this.showV ? 2 : 0) | (this.showMax$f ? 0 : 4) | (this.showFreq$f ? 8 : 0) | (this.isManualScale() ? (this.FLAG_MAN_SCALE | this.FLAG_PERPLOT_MAN_SCALE) : 0) | (this.plot2d ? 64 : 0) | (this.plotXY ? 128 : 0) | (this.showMin$f ? 256 : 0) | (this.showScale$f ? 512 : 0) | (this.showFFT$f ? 1024 : 0) | (this.maxScale$f ? 8192 : 0) | (this.showRMS ? 16384 : 0) | (this.showDutyCycle ? 32768 : 0) | (this.logSpectrum ? 65536 : 0) | (this.showAverage ? (1 << 17) : 0);
        flags |= this.FLAG_PLOTS;
        // 4096
        let allPlotFlags: number = 0;
        for (const p of this.plots) {
            allPlotFlags |= p.getPlotFlags();
        }
        // If none of our plots has a flag set we will use the old format with no plot flags, or
        // else we will set FLAG_PLOTFLAGS and include flags in all plots
        flags |= (allPlotFlags !== 0) ? this.FLAG_PERPLOTFLAGS : 0;
        // (1<<18)
        return flags;
    }
    dump(): string {
        let vPlot: ScopePlot = this.plots.get(0);
        let elm: CircuitElm = vPlot.elm;
        if (elm == null) {
            return null;
        }
        let flags: number = this.getFlags();
        let eno: number = this.sim.locateElm(elm);
        if (eno < 0) {
            return null;
        }
        let x: string = "o " + eno + " " + vPlot.scopePlotSpeed + " " + vPlot.value + " " + Scope.exportAsDecOrHex(flags, this.FLAG_PERPLOTFLAGS) + " " + this.scale[Scope.UNITS_V] + " " + this.scale[Scope.UNITS_A] + " " + this.position + " " + this.plots.size();
        let i: number = 0;
        for (i = 0; i < this.plots.size(); i++) {
            let p: ScopePlot = this.plots.get(i);
            if ((flags & this.FLAG_PERPLOTFLAGS) !== 0) {
                x += " " + (p.getPlotFlags()).toString(16);
            }
            // NB always export in Hex (no prefix)
            if (i > 0) {
                x += " " + this.sim.locateElm(p.elm) + " " + p.value;
            }
            // dump scale if units are not V or A
            if (p.units > Scope.UNITS_A) {
                x += " " + this.scale[p.units];
            }
            if (this.isManualScale()) {
                // In this version we always dump manual settings using the PERPLOT format
                x += " " + p.manScale + " " + p.manVPosition;
            }
        }
        if (this.text != null) {
            x += " " + CustomLogicModel.escape(this.text);
        }
        return x;
    }
    undump(st: StringTokenizer): void {
        this.initialize();
        let e: number = parseJInt(st.nextToken$0());
        if (e === -1) {
            return;
        }
        let ce: CircuitElm = this.sim.getElm(e);
        this.setElm(ce);
        this.speed = parseJInt(st.nextToken$0());
        let value: number = parseJInt(st.nextToken$0());
        // fix old value for VAL_POWER which doesn't work for transistors (because it's the same as VAL_IB)
        if (!(ce instanceof TransistorElm) && value === Scope.VAL_POWER_OLD) {
            value = Scope.VAL_POWER;
        }
        let flags: number = Scope.importDecOrHex(st.nextToken$0());
        this.scale[Scope.UNITS_V] = parseJDouble(st.nextToken$0());
        this.scale[Scope.UNITS_A] = parseJDouble(st.nextToken$0());
        if (this.scale[Scope.UNITS_V] === 0) {
            this.scale[Scope.UNITS_V] = .5;
        }
        if (this.scale[Scope.UNITS_A] === 0) {
            this.scale[Scope.UNITS_A] = 1;
        }
        this.scaleX = this.scale[Scope.UNITS_V];
        this.scaleY = this.scale[Scope.UNITS_A];
        this.scale[Scope.UNITS_OHMS] = this.scale[Scope.UNITS_W] = this.scale[Scope.UNITS_V];
        this.text = null;
        let plot2dFlag: boolean = (flags & 64) !== 0;
        let hasPlotFlags: boolean = (flags & this.FLAG_PERPLOTFLAGS) !== 0;
        if ((flags & this.FLAG_PLOTS) !== 0) {
            // new-style dump
            try {
                this.position = parseJInt(st.nextToken$0());
                let sz: number = parseJInt(st.nextToken$0());
                let i: number = 0;
                let u: number = ce.getScopeUnits(value);
                if (u > Scope.UNITS_A) {
                    this.scale[u] = parseJDouble(st.nextToken$0());
                }
                this.setValue$1(value);
                // setValue(0) creates an extra plot for current, so remove that
                while (this.plots.size() > 1) {
                    this.plots.removeAt(1);
                }
                let plotFlags: number = 0;
                for (i = 0; i !== sz; i++) {
                    if (hasPlotFlags) {
                        plotFlags = parseJInt(st.nextToken$0(), 16);
                    }
                    // Import in hex (no prefix)
                    if (i !== 0) {
                        let ne: number = parseJInt(st.nextToken$0());
                        let val: number = parseJInt(st.nextToken$0());
                        let elm: CircuitElm = this.sim.getElm(ne);
                        u = elm.getScopeUnits(val);
                        if (u > Scope.UNITS_A) {
                            this.scale[u] = parseJDouble(st.nextToken$0());
                        }
                        this.plots.add(new ScopePlot().init$4(elm, u, val, this.getManScaleFromMaxScale(u, false)));
                    }
                    let p: ScopePlot = this.plots.get(i);
                    p.acCoupled = (plotFlags & ScopePlot.FLAG_AC) !== 0;
                    if ((flags & this.FLAG_PERPLOT_MAN_SCALE) !== 0) {
                        p.manScaleSet = true;
                        p.manScale = parseJDouble(st.nextToken$0());
                        p.manVPosition = parseJInt(st.nextToken$0());
                    }
                }
                while (st.hasMoreTokens()) {
                    if (this.text == null) {
                        this.text = st.nextToken$0();
                    } else {
                        this.text += " " + st.nextToken$0();
                    }
                }
            } catch (ee) {
            }
        } else {
            // old-style dump
            let yElm: CircuitElm = null as any;
            let ivalue: number = 0;
            try {
                this.position = parseJInt(st.nextToken$0());
                let ye: number = -1;
                if ((flags & this.FLAG_YELM) !== 0) {
                    ye = parseJInt(st.nextToken$0());
                    if (ye !== -1) {
                        yElm = this.sim.getElm(ye);
                    }
                    // sinediode.txt has yElm set to something even though there's no xy plot...?
                    if (!plot2dFlag) {
                        yElm = null;
                    }
                }
                if ((flags & this.FLAG_IVALUE) !== 0) {
                    ivalue = parseJInt(st.nextToken$0());
                }
                while (st.hasMoreTokens()) {
                    if (this.text == null) {
                        this.text = st.nextToken$0();
                    } else {
                        this.text += " " + st.nextToken$0();
                    }
                }
            } catch (ee) {
            }
            this.setValues(value, ivalue, this.sim.getElm(e), yElm);
        }
        if (this.text != null) {
            this.text = CustomLogicModel.unescape(this.text);
        }
        this.plot2d = plot2dFlag;
        this.setFlags(flags);
    }
    setFlags(flags: number): void {
        this.showI = (flags & 1) !== 0;
        this.showV = (flags & 2) !== 0;
        this.showMax$f = (flags & 4) === 0;
        this.showFreq$f = (flags & 8) !== 0;
        this.manualScale = (flags & this.FLAG_MAN_SCALE) !== 0;
        this.plotXY = (flags & 128) !== 0;
        this.showMin$f = (flags & 256) !== 0;
        this.showScale$f = (flags & 512) !== 0;
        this.showFFT((flags & 1024) !== 0);
        this.maxScale$f = (flags & 8192) !== 0;
        this.showRMS = (flags & 16384) !== 0;
        this.showDutyCycle = (flags & 32768) !== 0;
        this.logSpectrum = (flags & 65536) !== 0;
        this.showAverage = (flags & (1 << 17)) !== 0;
    }
    saveAsDefault(): void {
        let stor: Storage = Storage.getLocalStorageIfSupported();
        if (stor == null) {
            return;
        }
        let vPlot: ScopePlot = this.plots.get(0);
        let flags: number = this.getFlags();
        // store current scope settings as default.  1 is a version code
        stor.setItem("scopeDefaults", "1 " + flags + " " + vPlot.scopePlotSpeed);
        CirSim.console("saved defaults " + flags);
    }
    loadDefaults(): boolean {
        let stor: Storage = Storage.getLocalStorageIfSupported();
        if (stor == null) {
            return false;
        }
        let str: string = stor.getItem("scopeDefaults");
        if (str == null) {
            return false;
        }
        let arr: string[] = javaSplit(str, " ");
        let flags: number = parseJInt(arr[1]);
        this.setFlags(flags);
        this.speed = parseJInt(arr[2]);
        return true;
    }
    allocImage(): void {
        if (this.imageCanvas != null) {
            this.imageCanvas.setWidth(this.rect.width + "PX");
            this.imageCanvas.setHeight(this.rect.height + "PX");
            this.imageCanvas.setCoordinateSpaceWidth(this.rect.width);
            this.imageCanvas.setCoordinateSpaceHeight(this.rect.height);
            this.clear2dView();
        }
    }
    handleMenu(mi: string, state: boolean): void {
        if (mi === "maxscale") {
            this.maxScale();
        }
        if (mi === "showvoltage") {
            this.showVoltage(state);
        }
        if (mi === "showcurrent") {
            this.showCurrent(state);
        }
        if (mi === "showscale") {
            this.showScale(state);
        }
        if (mi === "showpeak") {
            this.showMax(state);
        }
        if (mi === "shownegpeak") {
            this.showMin(state);
        }
        if (mi === "showfreq") {
            this.showFreq(state);
        }
        if (mi === "showfft") {
            this.showFFT(state);
        }
        if (mi === "logspectrum") {
            this.logSpectrum = state;
        }
        if (mi === "showrms") {
            this.showRMS = state;
        }
        if (mi === "showaverage") {
            this.showAverage = state;
        }
        if (mi === "showduty") {
            this.showDutyCycle = state;
        }
        if (mi === "showpower") {
            this.setValue$1(Scope.VAL_POWER);
        }
        if (mi === "showib") {
            this.setValue$1(Scope.VAL_IB);
        }
        if (mi === "showic") {
            this.setValue$1(Scope.VAL_IC);
        }
        if (mi === "showie") {
            this.setValue$1(Scope.VAL_IE);
        }
        if (mi === "showvbe") {
            this.setValue$1(Scope.VAL_VBE);
        }
        if (mi === "showvbc") {
            this.setValue$1(Scope.VAL_VBC);
        }
        if (mi === "showvce") {
            this.setValue$1(Scope.VAL_VCE);
        }
        if (mi === "showvcevsic") {
            this.plot2d = true;
            this.plotXY = false;
            this.setValues(Scope.VAL_VCE, Scope.VAL_IC, this.getElm(), null);
            this.resetGraph$0();
        }
        if (mi === "showvvsi") {
            this.plot2d = state;
            this.plotXY = false;
            this.resetGraph$0();
        }
        if (mi === "manualscale") {
            this.setManualScale(state, true);
        }
        if (mi === "plotxy") {
            this.plotXY = this.plot2d = state;
            if (this.plot2d) {
                this.plots = this.visiblePlots;
            }
            if (this.plot2d && this.plots.size() === 1) {
                this.selectY();
            }
            this.resetGraph$0();
        }
        if (mi === "showresistance") {
            this.setValue$1(Scope.VAL_R);
        }
    }
    //    void select() {
    //    	sim.setMouseElm(elm);
    //    	if (plotXY) {
    //    		sim.plotXElm = elm;
    //    		sim.plotYElm = yElm;
    //    	}
    //    }
    selectY(): void {
        let yElm: CircuitElm = (this.plots.size() === 2) ? this.plots.get(1).elm : null;
        let e: number = (yElm == null) ? -1 : this.sim.locateElm(yElm);
        let firstE: number = e;
        while (true) {
            for (e++; e < this.sim.elmList.size(); e++) {
                let ce: CircuitElm = this.sim.getElm(e);
                if ((ce instanceof OutputElm || ce instanceof ProbeElm) && ce !== this.plots.get(0).elm) {
                    yElm = ce;
                    if (this.plots.size() === 1) {
                        this.plots.add(new ScopePlot().init$2(yElm, Scope.UNITS_V));
                    } else {
                        this.plots.get(1).elm = yElm;
                        this.plots.get(1).units = Scope.UNITS_V;
                    }
                    return;
                }
            }
            if (firstE === -1) {
                return;
            }
            e = firstE = -1;
        }
        // not reached
    }
    onMouseWheel(e: MouseWheelEvent): void {
        this.wheelDeltaY += e.getDeltaY();
        if (this.wheelDeltaY > 5) {
            this.slowDown();
            this.wheelDeltaY = 0;
        }
        if (this.wheelDeltaY < -5) {
            this.speedUp();
            this.wheelDeltaY = 0;
        }
    }
    getElm(): CircuitElm {
        if (this.selectedPlot >= 0 && this.visiblePlots.size() > this.selectedPlot) {
            return this.visiblePlots.get(this.selectedPlot).elm;
        }
        return this.visiblePlots.size() > 0 ? this.visiblePlots.get(0).elm : this.plots.get(0).elm;
    }
    viewingWire(): boolean {
        let i: number = 0;
        for (i = 0; i !== this.plots.size(); i++) {
            if (this.plots.get(i).elm instanceof WireElm) {
                return true;
            }
        }
        return false;
    }
    getXElm(): CircuitElm {
        return this.getElm();
    }
    getYElm(): CircuitElm {
        if (this.plots.size() === 2) {
            return this.plots.get(1).elm;
        }
        return null;
    }
    needToRemove(): boolean {
        let ret: boolean = true;
        let removed: boolean = false;
        let i: number = 0;
        for (i = 0; i !== this.plots.size(); i++) {
            let plot: ScopePlot = this.plots.get(i);
            if (this.sim.locateElm(plot.elm) < 0) {
                this.plots.removeAt(i--);
                removed = true;
            } else {
                ret = false;
            }
        }
        if (removed) {
            this.calcVisiblePlots();
        }
        return ret;
    }
    isManualScale(): boolean {
        return this.manualScale;
    }
    getManScaleFromMaxScale(units: number, roundUp: boolean): number {
        // When the user manually switches to manual scale (and we don't already have a setting) then
        // call with "roundUp=true" to get a "sensible" suggestion for the scale. When importing from
        // a legacy file then call with "roundUp=false" to stay as close as possible to the old presentation
        let s: number = this.scale[units];
        if (units > Scope.UNITS_A) {
            s = 0.5 * s;
        }
        if (roundUp) {
            return ScopePropertiesDialog.nextHighestScale((2 * s) / (this.manDivisions));
        } else {
            return (2 * s) / (this.manDivisions);
        }
    }
    static exportAsDecOrHex(v: number, thresh: number): string {
        // If v>=thresh then export as hex value prefixed by "x", else export as decimal
        // Allows flags to be exported as dec if in an old value (for compatibility) or in hex if new value
        if (v >= thresh) {
            return "x" + (v).toString(16);
        } else {
            return numToString(v);
        }
    }
    static importDecOrHex(s: string): number {
        if (charAt(s, 0) === 120) {
            return parseJInt(s.substring(1), 16);
        } else {
            return parseJInt(s);
        }
    }
    constructor() {}
}
Object.assign(Scope.prototype, { "FLAG_YELM": 32, "FLAG_IVALUE": 2048, "FLAG_PLOTS": 4096, "FLAG_PERPLOTFLAGS": 1 << 18, "FLAG_PERPLOT_MAN_SCALE": 1 << 19, "FLAG_MAN_SCALE": 16, "scopePointCount": 0, "fft": null, "position": 0, "speed": 0, "stackCount": 0, "text": null, "rect": null, "manualScale": false, "showI": false, "showV": false, "showScale$f": false, "showMax$f": false, "showMin$f": false, "showFreq$f": false, "plot2d": false, "plotXY": false, "maxScale$f": false, "logSpectrum": false, "showFFT$f": false, "showNegative": false, "showRMS": false, "showAverage": false, "showDutyCycle": false, "plots": null, "visiblePlots": null, "pixels": null, "draw_ox": 0, "draw_oy": 0, "dpixels": null, "sim": null, "imageCanvas": null, "imageContext": null, "alphadiv": 0, "scopeTimeStep": 0, "scale": null, "reduceRange": null, "scaleX": 0, "scaleY": 0, "wheelDeltaY": 0, "selectedPlot": 0, "properties$f": null, "curColor": null, "voltColor": null, "gridStepX": 0, "gridStepY": 0, "maxValue": 0, "minValue": 0, "manDivisions": 0, "drawGridLines": false, "somethingSelected": false, "textY": 0 });
