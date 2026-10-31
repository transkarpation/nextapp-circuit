// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from VaractorElm.java to TypeScript.
/* eslint-disable */
import { CircuitElm, Color, DiodeElm, EditInfo, Graphics, Point, StringTokenizer, parseJDouble } from '../core/internal';

export class VaractorElm extends DiodeElm {
    declare baseCapacitance: number;
    init$2(xx: number, yy: number): this {
        DiodeElm.prototype.init$2.call(this, xx, yy);
        this.baseCapacitance = 4e-12;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        DiodeElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.capvoltdiff = parseJDouble(st.nextToken$0());
        this.baseCapacitance = parseJDouble(st.nextToken$0());
        return this;
    }
    getDumpType(): number {
        return 176;
    }
    getInfo(arr: string[]): void {
        super.getInfo(arr);
        arr[0] = "varactor";
        arr[5] = "C = " + CircuitElm.getUnitText$2(this.capacitance, "F");
    }
    declare capacitance: number;
    declare capCurrent: number;
    // DiodeElm.lastvoltdiff = volt diff from last iteration
    // capvoltdiff = volt diff from last timestep
    declare compResistance: number;
    declare capvoltdiff: number;
    declare plate1: Point[];
    declare plate2: Point[];
    setNodeVoltage(n: number, c: number): void {
        super.setNodeVoltage(n, c);
        this.capvoltdiff = this.volts[0] - this.volts[1];
    }
    calculateCurrent(): void {
        super.calculateCurrent();
        this.current += this.capCurrent;
    }
    reset(): void {
        super.reset();
        this.capvoltdiff = 0;
    }
    dump(): string {
        return super.dump() + " " + this.capvoltdiff + " " + this.baseCapacitance;
    }
    setPoints(): void {
        super.setPoints();
        let platef: number = .6;
        let pa: Point[] = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
        this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], platef, this.hs);
        let arrowPoint: Point = this.interpPoint$3(this.lead1, this.lead2, platef);
        this.poly = this.createPolygon$3(pa[0], pa[1], arrowPoint);
        // calc plates
        this.plate1 = this.newPointArray(2);
        this.plate2 = this.newPointArray(2);
        this.interpPoint2(this.lead1, this.lead2, this.plate1[0], this.plate1[1], platef, this.hs);
        this.interpPoint2(this.lead1, this.lead2, this.plate2[0], this.plate2[1], 1, this.hs);
    }
    draw(g: Graphics): void {
        // draw leads and diode arrow
        this.drawDiode(g);
        // draw first plate
        this.setVoltageColor(g, this.volts[0]);
        this.setPowerColor$Graphics_bool(g, false);
        CircuitElm.drawThickLine$3(g, this.plate1[0], this.plate1[1]);
        if (CircuitElm.sim.powerCheckItem.getState()) {
            g.setColor(Color.gray);
        }
        // draw second plate
        this.setVoltageColor(g, this.volts[1]);
        this.setPowerColor$Graphics_bool(g, false);
        CircuitElm.drawThickLine$3(g, this.plate2[0], this.plate2[1]);
        this.doDots(g);
        this.drawPosts(g);
    }
    stamp(): void {
        super.stamp();
        CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[2], this.voltSource);
        CircuitElm.sim.stampNonLinear(this.nodes[2]);
    }
    startIteration(): void {
        super.startIteration();
        // capacitor companion model using trapezoidal approximation
        // (Thevenin equivalent) consists of a voltage source in
        // series with a resistor
        let c0: number = this.baseCapacitance;
        if (this.capvoltdiff > 0) {
            this.capacitance = c0;
        } else {
            this.capacitance = c0 / Math.pow(1 - this.capvoltdiff / this.model.fwdrop, .5);
        }
        this.compResistance = CircuitElm.sim.timeStep / (2 * this.capacitance);
        this.voltSourceValue = -this.capvoltdiff - this.capCurrent * this.compResistance;
    }
    doStep(): void {
        super.doStep();
        CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[1], this.compResistance);
        CircuitElm.sim.updateVoltageSource(this.nodes[0], this.nodes[2], this.voltSource, this.voltSourceValue);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 1) {
            return new EditInfo("Capacitance @ 0V (F)", this.baseCapacitance, 10, 1000);
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 1) {
            this.baseCapacitance = ei.value;
            return;
        }
        super.setEditValue(n, ei);
    }
    getShortcut(): number {
        return 0;
    }
    setCurrent(x: number, c: number): void {
        this.capCurrent = c;
    }
    declare voltSourceValue: number;
    getVoltageSourceCount(): number {
        return 1;
    }
    getInternalNodeCount(): number {
        return 1;
    }
}
Object.assign(VaractorElm.prototype, { "baseCapacitance": 0, "capacitance": 0, "capCurrent": 0, "compResistance": 0, "capvoltdiff": 0, "plate1": null, "plate2": null, "voltSourceValue": 0 });
