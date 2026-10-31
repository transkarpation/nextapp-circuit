// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from DataRecorderElm.java to TypeScript.
/* eslint-disable */
import { Anchor, CircuitElm, DateTimeFormat, EditInfo, Font, Graphics, Point, StringTokenizer, idiv, newArray, parseJInt, toInt } from '../core/internal';

export class DataRecorderElm extends CircuitElm {
    declare dataCount: number;
    declare dataPtr: number;
    declare lastTimeStepCount: number;
    declare data: number[];
    declare dataFull: boolean;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.setDataCount$1(10240);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.setDataCount$1(parseJInt(st.nextToken$0()));
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.dataCount;
    }
    getDumpType(): number {
        return 210;
    }
    getPostCount(): number {
        return 1;
    }
    reset(): void {
        this.dataPtr = 0;
        this.dataFull = false;
        this.lastTimeStepCount = 0;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = new Point().init$0();
    }
    draw(g: Graphics): void {
        let selected: boolean = (this.needsHighlight());
        let f: Font = new Font().init$3("SansSerif", selected ? Font.BOLD : 0, 14);
        g.setFont(f);
        g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
        let s: string = "export";
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.lead1, 1 - (idiv(toInt(g.context.measureText(s).getWidth()), 2) + 8) / this.dn);
        this.setBbox$3(this.point1, this.lead1, 0);
        this.drawCenteredText(g, s, this.x2, this.y2, true);
        this.setVoltageColor(g, this.volts[0]);
        if (selected) {
            g.setColor(CircuitElm.selectColor);
        }
        CircuitElm.drawThickLine$3(g, this.point1, this.lead1);
        this.drawPosts(g);
    }
    getVoltageDiff(): number {
        return this.volts[0];
    }
    getInfo(arr: string[]): void {
        arr[0] = "data export";
        arr[1] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[2] = (this.dataFull ? this.dataCount : this.dataPtr) + "/" + this.dataCount;
    }
    stepFinished(): void {
        if (this.lastTimeStepCount === CircuitElm.sim.timeStepCount) {
            return;
        }
        this.data[this.dataPtr++] = this.volts[0];
        this.lastTimeStepCount = CircuitElm.sim.timeStepCount;
        if (this.dataPtr >= this.dataCount) {
            this.dataPtr = 0;
            this.dataFull = true;
        }
    }
    setDataCount$1(ct: number): void {
        this.dataCount = ct;
        this.data = newArray(0, this.dataCount);
        this.dataPtr = 0;
        this.dataFull = false;
    }
    static getBlobUrl(data: string): string {

                var datain=[""];
                datain[0]=data;
		var oldblob = (document as any).recorderBlob;
		// remove old blob if any.  We should do this when dialog is dismissed, but this is easier
		if (oldblob)
		    URL.revokeObjectURL(oldblob);
                var blob=new Blob(datain, {type: 'text/plain' } );
                var url = URL.createObjectURL(blob);
                (document as any).recorderBlob = url;
                return url;
        
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("# of Data Points", this.dataCount, -1, -1).setDimensionless();
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            let dataStr: string = "# time step = " + CircuitElm.sim.timeStep + " sec\n";
            let i: number = 0;
            if (this.dataFull) {
                for (i = 0; i !== this.dataCount; i++) {
                    dataStr += this.data[(i + this.dataPtr) % this.dataCount] + "\n";
                }
            } else {
                for (i = 0; i !== this.dataPtr; i++) {
                    dataStr += this.data[i] + "\n";
                }
            }
            let url: string = DataRecorderElm.getBlobUrl(dataStr);
            let date: any = new Date();
            let dtf: DateTimeFormat = DateTimeFormat.getFormat("yyyyMMdd-HHmm");
            let fname: string = "data-" + dtf.format(date) + ".circuitjs.txt";
            let a: Anchor = new Anchor(fname, url);
            a.getElement().setAttribute("Download", fname);
            ei.widget = a;
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.setDataCount$1(toInt(ei.value));
        }
        if (n === 1) {
            return;
        }
    }
}
Object.assign(DataRecorderElm.prototype, { "dataCount": 0, "dataPtr": 0, "lastTimeStepCount": 0, "data": null, "dataFull": false });
