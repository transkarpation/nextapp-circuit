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

// Changed 2026-10-31: converted from AudioInputElm.java to TypeScript.
/* eslint-disable */
import { AudioOutputElm, CircuitElm, EditInfo, FileUpload, Graphics, HashMap, JsArrayNumber, RailElm, StringTokenizer, VoltageElm, parseJDouble, parseJInt, toInt } from '../core/internal';

export class AudioFileEntry {
    declare fileName: string;
    declare data: JsArrayNumber;
    init$0(): this {
        return this;
    }
    constructor() {}
}
Object.assign(AudioFileEntry.prototype, { "fileName": null, "data": null });

export class AudioInputElm extends RailElm {
    declare data: JsArrayNumber;
    declare timeOffset: number;
    declare samplingRate: number;
    declare fileNum: number;
    declare fileName: string;
    declare maxVoltage$AudioInputElm: number;
    declare startPosition: number;
    static lastSamplingRate: number = 0;
    // cache to preserve audio data when doing cut/paste, or undo/redo
    static fileNumCounter: number = 1;
    static audioFileMap: HashMap<number,AudioFileEntry> = new HashMap();
    init$2(xx: number, yy: number): this {
        RailElm.prototype.init$3.call(this, xx, yy, VoltageElm.WF_AC);
        this.maxVoltage$AudioInputElm = 5;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        RailElm.prototype.init$6.call(this, xa, ya, xb, yb, f, st);
        this.waveform = VoltageElm.WF_AC;
        this.maxVoltage$AudioInputElm = parseJDouble(st.nextToken$0());
        this.startPosition = parseJDouble(st.nextToken$0());
        this.fileNum = parseJInt(st.nextToken$0());
        let ent: AudioFileEntry = AudioInputElm.audioFileMap.get(this.fileNum);
        if (ent != null) {
            this.fileName = ent.fileName;
            this.data = ent.data;
        }
        this.samplingRate = AudioInputElm.lastSamplingRate;
        return this;
    }
    declare fmphase: number;
    dump(): string {
        // add a file number to the dump so we can preserve the audio file data when doing cut and paste, or undo/redo.
        // we don't save the entire file in the dump because it would be huge.
        if (this.data != null) {
            if (this.fileNum === 0) {
                this.fileNum = AudioInputElm.fileNumCounter++;
            }
            let ent: AudioFileEntry = new AudioFileEntry().init$0();
            ent.fileName = this.fileName;
            ent.data = this.data;
            AudioInputElm.audioFileMap.put(this.fileNum, ent);
        }
        return super.dump() + " " + this.maxVoltage$AudioInputElm + " " + this.startPosition + " " + this.fileNum;
    }
    reset(): void {
        this.timeOffset = this.startPosition;
    }
    drawRail(g: Graphics): void {
        this.drawRailText(g, this.fileName == null ? "No file" : this.fileName);
    }
    getRailText(): string {
        return this.fileName == null ? "No file" : this.fileName;
    }
    setSamplingRate(sr: number): void {
        this.samplingRate = sr;
    }
    getVoltage(): number {
        if (this.data == null) {
            return 0;
        }
        if (this.timeOffset < this.startPosition) {
            this.timeOffset = this.startPosition;
        }
        let ptr: number = toInt((this.timeOffset * this.samplingRate));
        if (ptr >= this.data.length()) {
            ptr = 0;
            this.timeOffset = 0;
        }
        return this.data.get(ptr) * this.maxVoltage$AudioInputElm;
    }
    stepFinished(): void {
        this.timeOffset += CircuitElm.sim.timeStep;
    }
    getDumpType(): number {
        return 411;
    }
    getShortcut(): number {
        return 0;
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            let thisElm: AudioInputElm = this;
            let file: FileUpload = new FileUpload();
            ei.widget = file;
            file.addChangeHandler({ onChange: (event) => {
        this.fileName = file.getFilename().replaceAll("^.*\\\\", "").replaceAll("\\.[^.]*$", "");
        AudioInputElm.fetchLoadFileData(thisElm, file.getElement());
    } });
            return ei;
        }
        if (n === 1) {
            return new EditInfo("Max Voltage", this.maxVoltage$AudioInputElm);
        }
        if (n === 2) {
            return new EditInfo("Start Position (s)", this.startPosition);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 1) {
            this.maxVoltage$AudioInputElm = ei.value;
        }
        if (n === 2) {
            this.startPosition = ei.value;
        }
    }
    // fetch audio data for a selected file
    static fetchLoadFileData(elm: AudioInputElm, uploadElement: Element): string { throw new Error('AudioInputElm.fetchLoadFileData is not supported in this port'); }
    gotAudioData(d: JsArrayNumber): void {
        this.data = d;
        AudioInputElm.lastSamplingRate = this.samplingRate;
        AudioOutputElm.lastSamplingRate = this.samplingRate;
    }
    getInfo(arr: string[]): void {
        arr[0] = "audio input";
        if (this.data == null) {
            arr[1] = "no file loaded";
            return;
        }
        arr[1] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
        arr[2] = "pos = " + CircuitElm.getUnitText$2(this.timeOffset, "s");
        let dur: number = this.data.length() / this.samplingRate;
        arr[3] = "dur = " + CircuitElm.getUnitText$2(dur, "s");
    }
    static clearCache(): void {
        AudioInputElm.audioFileMap.clear();
    }
}
Object.assign(AudioInputElm.prototype, { "data": null, "timeOffset": 0, "samplingRate": 0, "fileNum": 0, "fileName": null, "maxVoltage$AudioInputElm": 0, "startPosition": 0, "fmphase": 0 });
