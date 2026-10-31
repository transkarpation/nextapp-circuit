// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from AudioOutputElm.java to TypeScript.
/* eslint-disable */
import { Button, Choice, CirSim, CircuitElm, Color, EditInfo, Font, Graphics, JsArrayInteger, Point, StringTokenizer, Window, idiv, newArray, parseJDouble, parseJInt, toInt } from '../core/internal';

export class AudioOutputElm extends CircuitElm {
    declare dataCount: number;
    declare dataPtr: number;
    declare data: number[];
    declare dataFull: boolean;
    declare button: Button;
    declare samplingRate: number;
    declare labelNum: number;
    declare duration: number;
    declare sampleStep: number;
    declare dataStart: number;
    static lastSamplingRate: number = 8000;
    static okToChangeTimeStep: boolean = false;
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.dataSampleCount = 0;
        this.nextDataSample = 0;
        this.samplingRateChoices = [8000, 11025, 16000, 22050, 44100];
        this.duration = 1;
        this.samplingRate = AudioOutputElm.lastSamplingRate;
        this.labelNum = this.getNextLabelNum();
        this.setDataCount$0();
        this.createButton();
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.dataSampleCount = 0;
        this.nextDataSample = 0;
        this.samplingRateChoices = [8000, 11025, 16000, 22050, 44100];
        this.duration = parseJDouble(st.nextToken$0());
        this.samplingRate = parseJInt(st.nextToken$0());
        this.labelNum = parseJInt(st.nextToken$0());
        this.setDataCount$0();
        this.createButton();
        return this;
    }
    dump(): string {
        return super.dump() + " " + this.duration + " " + this.samplingRate + " " + this.labelNum;
    }
    draggingDone(): void {
        this.setTimeStep();
    }
    // get next unused labelNum value
    getNextLabelNum(): number {
        let i: number = 0;
        let num: number = 1;
        if (CircuitElm.sim.elmList == null) {
            return 0;
        }
        for (i = 0; i !== CircuitElm.sim.elmList.size(); i++) {
            let ce: CircuitElm = CircuitElm.sim.getElm(i);
            if (!(ce instanceof AudioOutputElm)) {
                continue;
            }
            let ln: number = ((ce as any as AudioOutputElm)).labelNum;
            if (ln >= num) {
                num = ln + 1;
            }
        }
        return num;
    }
    getDumpType(): number {
        return 211;
    }
    getPostCount(): number {
        return 1;
    }
    reset(): void {
        this.dataPtr = 0;
        this.dataFull = false;
        this.dataSampleCount = 0;
        this.nextDataSample = 0;
        this.dataSample = 0;
    }
    setPoints(): void {
        super.setPoints();
        this.lead1 = new Point().init$0();
    }
    draw(g: Graphics): void {
        let selected: boolean = (this.needsHighlight());
        let f: Font = new Font().init$3("SansSerif", selected ? Font.BOLD : 0, 14);
        let s: string = "Audio Out";
        if (this.labelNum > 1) {
            s = "Audio " + this.labelNum;
        }
        g.setFont(f);
        let textWidth: number = toInt(g.context.measureText(s).getWidth());
        g.setColor(Color.darkGray);
        let pct: number = (this.dataFull) ? textWidth : idiv(textWidth * this.dataPtr, this.dataCount);
        g.fillRect(this.x2 - idiv(textWidth, 2), this.y2 - 10, pct, 20);
        g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
        this.interpPoint$Point_Point_Point_dbl(this.point1, this.point2, this.lead1, 1 - (textWidth / 2. + 8) / this.dn);
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
        arr[0] = "audio output";
        arr[1] = "V = " + CircuitElm.getVoltageText(this.volts[0]);
        let ct: number = (this.dataFull ? this.dataCount : this.dataPtr);
        let dur: number = this.sampleStep * ct;
        arr[2] = "start = " + CircuitElm.getUnitText$2(this.dataFull ? CircuitElm.sim.t - this.duration : this.dataStart, "s");
        arr[3] = "dur = " + CircuitElm.getUnitText$2(dur, "s");
        arr[4] = "samples = " + ct + (this.dataFull ? "" : "/" + this.dataCount);
    }
    declare dataSampleCount: number;
    declare nextDataSample: number;
    declare dataSample: number;
    stepFinished(): void {
        this.dataSample += this.volts[0];
        this.dataSampleCount++;
        if (CircuitElm.sim.t >= this.nextDataSample) {
            this.nextDataSample += this.sampleStep;
            this.data[this.dataPtr++] = this.dataSample / this.dataSampleCount;
            this.dataSampleCount = 0;
            this.dataSample = 0;
            if (this.dataPtr >= this.dataCount) {
                this.dataPtr = 0;
                this.dataFull = true;
            }
        }
    }
    setDataCount$0(): void {
        this.dataCount = toInt((this.samplingRate * this.duration));
        this.data = newArray(0, this.dataCount);
        this.dataStart = CircuitElm.sim.t;
        this.dataPtr = 0;
        this.dataFull = false;
        this.sampleStep = 1. / this.samplingRate;
        this.nextDataSample = CircuitElm.sim.t + this.sampleStep;
    }
    declare samplingRateChoices: number[];
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Duration (s)", this.duration, 0, 5);
            return ei;
        }
        if (n === 1) {
            let ei: EditInfo = new EditInfo("Sampling Rate", 0, -1, -1);
            ei.choice = new Choice();
            let i: number = 0;
            for (i = 0; i !== this.samplingRateChoices.length; i++) {
                ei.choice.add(this.samplingRateChoices[i] + "");
                if (this.samplingRateChoices[i] === this.samplingRate) {
                    ei.choice.select(i);
                }
            }
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.duration = ei.value;
            this.setDataCount$0();
        }
        if (n === 1) {
            let nsr: number = this.samplingRateChoices[ei.choice.getSelectedIndex()];
            if (nsr !== this.samplingRate) {
                this.samplingRate = nsr;
                AudioOutputElm.lastSamplingRate = nsr;
                this.setDataCount$0();
                this.setTimeStep();
            }
        }
    }
    setTimeStep(): void {
        /*
	    // timestep must be smaller than 1/sampleRate
	    if (sim.timeStep > sampleStep)
		sim.timeStep = sampleStep;
	    else {
		// make sure sampleStep/timeStep is an integer.  otherwise we get distortion
//		int frac = (int)Math.round(sampleStep/sim.timeStep);
//		sim.timeStep = sampleStep / frac;
		
		// actually, just make timestep = 1/sampleRate
		sim.timeStep = sampleStep;
	    }
	    */
        //	    int frac = (int)Math.round(Math.max(sampleStep*33000, 1));
        let target: number = this.sampleStep / 8;
        if (CircuitElm.sim.maxTimeStep !== target) {
            if (AudioOutputElm.okToChangeTimeStep || Window.confirm(CirSim.LS("Adjust timestep for best audio quality and performance?"))) {
                CircuitElm.sim.maxTimeStep = target;
                AudioOutputElm.okToChangeTimeStep = true;
            }
        }
    }
    createButton(): void {
        let label: string = "&#9654; " + CirSim.LS("Play Audio");
        if (this.labelNum > 1) {
            label += " " + this.labelNum;
        }
        CircuitElm.sim.addWidgetToVerticalPanel(this.button = new Button(label));
        this.button.setStylePrimaryName("topButton");
        this.button.addClickHandler({ onClick: (event) => {
        this.play();
    } });
    }
    delete(): void {
        CircuitElm.sim.removeWidgetFromVerticalPanel(this.button);
        super.delete();
    }
    static playJS(samples: JsArrayInteger, sampleRate: number): void {

            var Wav = function(opt_params){
        	this._sampleRate = opt_params && opt_params.sampleRate ? opt_params.sampleRate : 44100;
        	this._channels = opt_params && opt_params.channels ? opt_params.channels : 2;  
        	this._eof = true;
        	this._bufferNeedle = 0;
        	this._buffer;
        	
        	};

        Wav.prototype.setBuffer = function(buffer){
        	this._buffer = this.getWavInt16Array(buffer);
        	this._bufferNeedle = 0;
        	this._internalBuffer = '';
        	this._hasOutputHeader = false;
        	this._eof = false;
        };

        Wav.prototype.getBuffer = function(len){
        	
        	var rt;
        	if( this._bufferNeedle + len >= this._buffer.length ){
        		rt = new Int16Array(this._buffer.length - this._bufferNeedle);
        		this._eof = true;
        	}
        	else {
        		rt = new Int16Array(len);
        	}
        	
        	for(var i=0; i<rt.length; i++){
        		rt[i] = this._buffer[i+this._bufferNeedle];
        	}
        	this._bufferNeedle += rt.length;
        	
        	return  rt.buffer;
        	

        };

        Wav.prototype.eof = function(){
        	return this._eof;
        };

        Wav.prototype.getWavInt16Array = function(buffer){
        		
        	var intBuffer = new Int16Array(buffer.length + 23), tmp;
        	
        	intBuffer[0] = 0x4952; // "RI"
        	intBuffer[1] = 0x4646; // "FF"
        	
        	intBuffer[2] = (2*buffer.length + 15) & 0x0000ffff; // RIFF size
        	intBuffer[3] = ((2*buffer.length + 15) & 0xffff0000) >> 16; // RIFF size
        	
        	intBuffer[4] = 0x4157; // "WA"
        	intBuffer[5] = 0x4556; // "VE"
        		
        	intBuffer[6] = 0x6d66; // "fm"
        	intBuffer[7] = 0x2074; // "t "
        		
        	intBuffer[8] = 0x0012; // fmt chunksize: 18
        	intBuffer[9] = 0x0000; //
        		
        	intBuffer[10] = 0x0001; // format tag : 1 
        	intBuffer[11] = this._channels; // channels: 2
        	
        	intBuffer[12] = this._sampleRate & 0x0000ffff; // sample per sec
        	intBuffer[13] = (this._sampleRate & 0xffff0000) >> 16; // sample per sec
        	
        	intBuffer[14] = (2*this._channels*this._sampleRate) & 0x0000ffff; // byte per sec
        	intBuffer[15] = ((2*this._channels*this._sampleRate) & 0xffff0000) >> 16; // byte per sec
        	
        	intBuffer[16] = 0x0004; // block align
        	intBuffer[17] = 0x0010; // bit per sample
        	intBuffer[18] = 0x0000; // cb size
        	intBuffer[19] = 0x6164; // "da"
        	intBuffer[20] = 0x6174; // "ta"
        	intBuffer[21] = (2*buffer.length) & 0x0000ffff; // data size[byte]
        	intBuffer[22] = ((2*buffer.length) & 0xffff0000) >> 16; // data size[byte]	

        	for (var i = 0; i < buffer.length; i++)
        	    intBuffer[i+23] = buffer[i];
        	
        	return intBuffer;
        };
        var i=0,
            wav = new Wav({sampleRate: sampleRate, channels: 1});
        wav.setBuffer(samples);

        var srclist = [];
        while( !wav.eof() ){
            srclist.push(wav.getBuffer(1000));
        }

	var oldblob = (document as any).audioBlob;
	var oldobj = (document as any).audioObject;
	// remove old blob and audio obj if any.  We should do this when audio is done playing, but this is easier
	if (oldblob) {
	    oldobj.parentNode.removeChild(oldobj);
            URL.revokeObjectURL(oldblob);
	}

        var b = new Blob(srclist, {type:'audio/wav'});
//        var URLObject = window.webkitURL || window.URL;
//        var url = URLObject.createObjectURL(b);
        var url = URL.createObjectURL(b);
        (document as any).audioBlob = url;
//        console.log(url);
	var audio = document.createElement("audio");
	(document as any).audioObject = audio;
	audio.src = url;
	document.body.appendChild(audio);
	audio.play();

    }
    play(): void {
        let i: number = 0;
        let arr: JsArrayInteger = (JsArrayInteger.createArray() as any as JsArrayInteger);
        let ct: number = this.dataPtr;
        let base: number = 0;
        if (this.dataFull) {
            ct = this.dataCount;
            base = this.dataPtr;
        }
        if (ct * this.sampleStep < .05) {
            Window.alert(CirSim.LS("Audio data is not ready yet.  Increase simulation speed to make data ready sooner."));
            return;
        }
        // rescale data to maximize
        let max: number = -1e8;
        let min: number = 1e8;
        for (i = 0; i !== ct; i++) {
            if (this.data[i] > max) {
                max = this.data[i];
            }
            if (this.data[i] < min) {
                min = this.data[i];
            }
        }
        let adj: number = -(max + min) / 2;
        let mult: number = (.25 * 32766) / (max + adj);
        // fade in over 1/20 sec
        let fadeLen: number = idiv(this.samplingRate, 20);
        let fadeOut: number = ct - fadeLen;
        let fadeMult: number = mult / fadeLen;
        for (i = 0; i !== ct; i++) {
            let fade: number = (i < fadeLen) ? i * fadeMult : (i > fadeOut) ? (ct - i) * fadeMult : mult;
            let s: number = toInt(((this.data[(i + base) % this.dataCount] + adj) * fade));
            arr.push(s);
        }
        AudioOutputElm.playJS(arr, this.samplingRate);
    }
}
Object.assign(AudioOutputElm.prototype, { "dataCount": 0, "dataPtr": 0, "data": null, "dataFull": false, "button": null, "samplingRate": 0, "labelNum": 0, "duration": 0, "sampleStep": 0, "dataStart": 0, "dataSampleCount": 0, "nextDataSample": 0, "dataSample": 0, "samplingRateChoices": null });
