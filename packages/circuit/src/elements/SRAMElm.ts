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

// Changed 2026-10-31: converted from SRAMElm.java to TypeScript.
/* eslint-disable */
import { ChipElm, ChipElm_Pin, CircuitElm, EditInfo, HashMap, StringTokenizer, TextArea, javaSplit, newArray, parseJInt, toInt } from '../core/internal';

export class SRAMElm extends ChipElm {
    declare addressNodes: number;
    declare dataNodes: number;
    declare internalNodes: number;
    declare addressBits: number;
    declare dataBits: number;
    declare map: HashMap<number,number>;
    init$2(xx: number, yy: number): this {
        ChipElm.prototype.init$2.call(this, xx, yy);
        this.addressBits = this.dataBits = 4;
        this.map = new HashMap();
        this.setupPins();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        ChipElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.map = new HashMap();
        this.addressBits = parseJInt(st.nextToken$0());
        this.dataBits = parseJInt(st.nextToken$0());
        this.setupPins();
        try {
            // load contents
            // format: addr val(addr) val(addr+1) val(addr+2) ... -1 addr val val ... -1 ... -2
            while (true) {
                let a: number = parseJInt(st.nextToken$0());
                if (a < 0) {
                    break;
                }
                let v: number = parseJInt(st.nextToken$0());
                this.map.put(a, v);
                while (true) {
                    v = parseJInt(st.nextToken$0());
                    if (v < 0) {
                        break;
                    }
                    this.map.put(++a, v);
                }
            }
        } catch (e) {
        }
        return this;
    }
    dump(): string {
        let s: string = super.dump() + " " + this.addressBits + " " + this.dataBits;
        // dump contents
        let maxI: number = 1 << this.addressBits;
        let i: number = 0;
        for (i = 0; i < maxI; i++) {
            let val: number = this.map.get(i);
            if (val == null) {
                continue;
            }
            s += " " + i + " " + val;
            while (true) {
                val = this.map.get(++i);
                if (val == null) {
                    break;
                }
                s += " " + val;
            }
            s += " -1";
        }
        s += " -2";
        return s;
    }
    nonLinear(): boolean {
        return true;
    }
    getChipName(): string {
        return "Static RAM";
    }
    setupPins(): void {
        this.sizeX = 2;
        this.sizeY = CircuitElm.max(this.addressBits, this.dataBits) + 1;
        this.pins = newArray(null, this.getPostCount());
        this.pins[0] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_W, "WE");
        this.pins[0].lineOver = true;
        this.pins[1] = new ChipElm_Pin().init$3(this, 0, ChipElm.SIDE_E, "OE");
        this.pins[1].lineOver = true;
        let i: number = 0;
        this.addressNodes = 2;
        this.dataNodes = 2 + this.addressBits;
        this.internalNodes = 2 + this.addressBits + this.dataBits;
        for (i = 0; i !== this.addressBits; i++) {
            let ii: number = i + this.addressNodes;
            this.pins[ii] = new ChipElm_Pin().init$3(this, this.sizeY - this.addressBits + i, ChipElm.SIDE_W, "A" + (this.addressBits - i - 1));
        }
        for (i = 0; i !== this.dataBits; i++) {
            let ii: number = i + this.dataNodes;
            this.pins[ii] = new ChipElm_Pin().init$3(this, this.sizeY - this.dataBits + i, ChipElm.SIDE_E, "D" + (this.dataBits - i - 1));
            this.pins[ii].output = true;
        }
        this.allocNodes();
    }
    getPostCount(): number {
        return 2 + this.addressBits + this.dataBits;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 2) {
            return new EditInfo("# of Address Bits", this.addressBits, 1, 1).setDimensionless();
        }
        if (n === 3) {
            return new EditInfo("# of Data Bits", this.dataBits, 1, 1).setDimensionless();
        }
        if (n === 4) {
            let ei: EditInfo = new EditInfo("Contents", 0);
            ei.textArea = new TextArea();
            ei.textArea.setVisibleLines(5);
            let s: string = "";
            let i: number = 0;
            let maxI: number = 1 << this.addressBits;
            for (i = 0; i < maxI; i++) {
                let val: number = this.map.get(i);
                if (val == null) {
                    continue;
                }
                s += i + ": " + val;
                let ct: number = 1;
                while (true) {
                    val = this.map.get(++i);
                    if (val == null) {
                        break;
                    }
                    s += " " + val;
                    if (++ct === 8) {
                        break;
                    }
                }
                s += "\n";
                //    	    	    sim.console("got " + i + " " + s);
            }
            ei.textArea.setText(s);
            return ei;
        }
        return super.getEditInfo(n);
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n < 2) {
            super.setEditValue(n, ei);
        }
        if (n === 2 && ei.value >= 2 && ei.value <= 16) {
            this.addressBits = toInt(ei.value);
            this.setupPins();
            this.setPoints();
        }
        if (n === 3 && ei.value >= 2 && ei.value <= 16) {
            this.dataBits = toInt(ei.value);
            this.setupPins();
            this.setPoints();
        }
        if (n === 4) {
            let s: string = ei.textArea.getText();
            let lines: string[] = javaSplit(s, "\n");
            let i: number = 0;
            this.map.clear();
            for (i = 0; i !== lines.length; i++) {
                try {
                    let line: string = lines[i];
                    let args: string[] = javaSplit(line, ": *");
                    let addr: number = parseJInt(args[0]);
                    let vals: string[] = javaSplit(args[1], " +");
                    let j: number = 0;
                    for (j = 0; j !== vals.length; j++) {
                        let val: number = parseJInt(vals[j]);
                        this.map.put(addr++, val);
                    }
                } catch (e) {
                }
            }
        }
    }
    getVoltageSourceCount(): number {
        return this.dataBits;
    }
    getInternalNodeCount(): number {
        return this.dataBits;
    }
    declare address: number;
    stamp(): void {
        let i: number = 0;
        for (i = 0; i !== this.dataBits; i++) {
            let p: ChipElm_Pin = this.pins[i + this.dataNodes];
            CircuitElm.sim.stampVoltageSource(0, this.nodes[this.internalNodes + i], p.voltSource);
            CircuitElm.sim.stampNonLinear(this.nodes[this.internalNodes + i]);
            CircuitElm.sim.stampNonLinear(this.nodes[this.dataNodes + i]);
        }
    }
    doStep(): void {
        let i: number = 0;
        let writeEnabled: boolean = this.volts[0] < 2.5;
        let outputEnabled: boolean = (this.volts[1] < 2.5) && !writeEnabled;
        // get address
        this.address = 0;
        for (i = 0; i !== this.addressBits; i++) {
            this.address |= (this.volts[this.addressNodes + i] > 2.5) ? 1 << (this.addressBits - 1 - i) : 0;
        }
        let dataObj: number = this.map.get(this.address);
        let data: number = (dataObj == null) ? 0 : dataObj;
        for (i = 0; i !== this.dataBits; i++) {
            let p: ChipElm_Pin = this.pins[i + this.dataNodes];
            CircuitElm.sim.updateVoltageSource(0, this.nodes[this.internalNodes + i], p.voltSource, (data & (1 << (this.dataBits - 1 - i))) === 0 ? 0 : 5);
            // stamp resistor from internal voltage source to data pin.
            // if output enabled, make it a small resistor.  otherwise large.
            CircuitElm.sim.stampResistor(this.nodes[this.internalNodes + i], this.nodes[this.dataNodes + i], outputEnabled ? 1 : 1e8);
        }
    }
    stepFinished(): void {
        let i: number = 0;
        let data: number = 0;
        let writeEnabled: boolean = this.volts[0] < 2.5;
        if (!writeEnabled) {
            return;
        }
        // store data in RAM
        for (i = 0; i !== this.dataBits; i++) {
            data |= (this.volts[this.dataNodes + i] > 2.5) ? 1 << (this.dataBits - 1 - i) : 0;
        }
        this.map.put(this.address, data);
    }
    getDumpType(): number {
        return 413;
    }
}
Object.assign(SRAMElm.prototype, { "addressNodes": 0, "dataNodes": 0, "internalNodes": 0, "addressBits": 0, "dataBits": 0, "map": null, "address": 0 });
