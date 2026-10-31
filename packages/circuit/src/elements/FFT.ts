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

// Changed 2026-10-31: converted from FFT.java to TypeScript.
/* eslint-disable */
import { idiv, newArray, toInt } from '../core/internal';

export class FFT {
    declare size: number;
    declare bits: number;
    declare cosTable: number[];
    declare sinTable: number[];
    init$1(n: number): this {
        this.size = n;
        this.bits = toInt((Math.log(this.size) / Math.log(2)));
        this.cosTable = newArray(0, idiv(this.size, 2));
        this.sinTable = newArray(0, idiv(this.size, 2));
        let dtheta: number = -2 * Math.PI / this.size;
        for (let i: number = 0; i < this.cosTable.length; i++) {
            this.cosTable[i] = Math.cos(dtheta * i);
            this.sinTable[i] = Math.sin(dtheta * i);
        }
        return this;
    }
    /*
     * This uses the radix-2 decimation-in-time FFT algorithm.
     * Based on
     * http://www.ee.columbia.edu/~ronw/code/MEAPsoft/doc/html/FFT_8java-source.html
     * Douglas L. Jones 
     * University of Illinois at Urbana-Champaign 
     * January 19, 1992 
     * http://cnx.rice.edu/content/m12016/latest/
     */
    fft(real: number[], imag: number[]): void {
        let j: number = 0;
        let n2: number = idiv(real.length, 2);
        for (let i: number = 1; i < real.length - 1; i++) {
            let n1: number = n2;
            while (j >= n1) {
                j -= n1;
                n1 = idiv(n1, 2);
            }
            j += n1;
            if (i < j) {
                let t1: number = real[i];
                real[i] = real[j];
                real[j] = t1;
                t1 = imag[i];
                imag[i] = imag[j];
                imag[j] = t1;
            }
        }
        n2 = 1;
        for (let i: number = 0; i < this.bits; i++) {
            let n1: number = n2;
            n2 <<= 1;
            let a: number = 0;
            for (j = 0; j < n1; j++) {
                let c: number = this.cosTable[a];
                let s: number = this.sinTable[a];
                a += 1 << (this.bits - i - 1);
                for (let k: number = j; k < real.length; k += n2) {
                    let t: number = k + n1;
                    let t1: number = c * real[t] - s * imag[t];
                    let t2: number = s * real[t] + c * imag[t];
                    real[k + n1] = real[k] - t1;
                    imag[k + n1] = imag[k] - t2;
                    real[k] += t1;
                    imag[k] += t2;
                }
            }
        }
    }
    getSize(): number {
        return this.size;
    }
    magnitude(real: number, imag: number): number {
        return Math.sqrt(real * real + imag * imag) / this.size;
    }
    constructor() {}
}
Object.assign(FFT.prototype, { "size": 0, "bits": 0, "cosTable": null, "sinTable": null });
