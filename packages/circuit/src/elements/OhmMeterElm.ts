// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from OhmMeterElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, CurrentElm, Graphics, Scope, StringTokenizer } from '../core/internal';

export class OhmMeterElm extends CurrentElm {
    init$2(xx: number, yy: number): this {
        CurrentElm.prototype.init$2.call(this, xx, yy);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CurrentElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        return this;
    }
    getDumpType(): number {
        return 216;
    }
    setPoints(): void {
        super.setPoints();
        this.calcLeads(26);
    }
    draw(g: Graphics): void {
        let cr: number = 12;
        this.draw2Leads(g);
        this.setVoltageColor(g, (this.volts[0] + this.volts[1]) / 2);
        this.setPowerColor$Graphics_bool(g, false);
        CircuitElm.drawThickCircle(g, this.center.x, this.center.y, cr);
        this.drawCenteredText(g, CirSim.ohmString, this.center.x, this.center.y, true);
        this.setBbox$3(this.point1, this.point2, cr);
        this.doDots(g);
        if (CircuitElm.sim.showValuesCheckItem.getState() && this.current !== 0) {
            let s: string = CircuitElm.getShortUnitText(this.getVoltageDiff() / this.current, CirSim.ohmString);
            if (this.dx === 0 || this.dy === 0) {
                this.drawValues$3(g, s, cr);
            }
        }
        this.drawPosts(g);
    }
    getScopeValue(x: number): number {
        return (x === Scope.VAL_R) ? this.getVoltageDiff() / this.current : super.getScopeValue(x);
    }
    getScopeUnits(x: number): number {
        return (x === Scope.VAL_R) ? Scope.UNITS_OHMS : super.getScopeUnits(x);
    }
    canShowValueInScope(x: number): boolean {
        return x === Scope.VAL_R;
    }
    /*
	public EditInfo getEditInfo(int n) {
	    if (n == 0)
		return new EditInfo("Current (A)", currentValue, 0, .1);
	    return null;
	}
	public void setEditValue(int n, EditInfo ei) {
	    currentValue = ei.value;
	}
	*/
    getInfo(arr: string[]): void {
        arr[0] = "ohmmeter";
        if (this.current === 0) {
            arr[1] = "R = \u221e";
        } else {
            arr[1] = "R = " + CircuitElm.getUnitText$2(this.getVoltageDiff() / this.current, CirSim.ohmString);
        }
    }
}
