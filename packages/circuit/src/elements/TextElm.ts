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

// Changed 2026-10-31: converted from TextElm.java to TypeScript.
/* eslint-disable */
import { Checkbox, CirSim, CircuitElm, CustomLogicModel, EditInfo, Font, GraphicElm, Graphics, StringBuffer, StringBuilder, StringTokenizer, Vector, charAt, parseJInt, toInt } from '../core/internal';

export class TextElm extends GraphicElm {
    declare text: string;
    declare lines: Vector<string>;
    declare size: number;
    declare FLAG_CENTER: number;
    declare FLAG_BAR: number;
    declare FLAG_ESCAPE: number;
    init$2(xx: number, yy: number): this {
        GraphicElm.prototype.init$2.call(this, xx, yy);
        this.text = "hello";
        this.lines = new Vector();
        this.lines.add(this.text);
        this.size = 24;
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        GraphicElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.size = parseJInt(st.nextToken$0());
        this.text = st.nextToken$0();
        if ((this.flags & this.FLAG_ESCAPE) === 0) {
            // old-style dump before escape/unescape
            while (st.hasMoreTokens()) {
                this.text += String.fromCharCode(32) + st.nextToken$0();
            }
            this.text = this.text.replace(new RegExp("%2[bB]", 'g'), "+");
        } else {
            // new-style dump
            this.text = CustomLogicModel.unescape(this.text);
        }
        this.split();
        return this;
    }
    split(): void {
        let i: number = 0;
        this.lines = new Vector();
        let sb: StringBuffer = new StringBuilder(this.text);
        for (i = 0; i < sb.length(); i++) {
            let c: number = sb.charAt(i);
            if (c === 92) {
                sb.deleteCharAt(i);
                c = sb.charAt(i);
                if (c === 110) {
                    this.lines.add(sb.substring(0, i));
                    sb.delete(0, i + 1);
                    i = -1;
                    continue;
                }
            }
        }
        this.lines.add(sb.toString());
    }
    dump(): string {
        this.flags |= this.FLAG_ESCAPE;
        return super.dump() + " " + this.size + " " + CustomLogicModel.escape(this.text);
        //return super.dump() + " " + size + " " + text;
    }
    getDumpType(): number {
        return 120;
    }
    drag(xx: number, yy: number): void {
        this.x = xx;
        this.y = yy;
        this.x2 = xx + 16;
        this.y2 = yy;
    }
    draw(g: Graphics): void {
        //Graphics2D g2 = (Graphics2D)g;
        //g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
        //	RenderingHints.VALUE_ANTIALIAS_ON);
        let oldfont: Font = g.getFont();
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        let f: Font = new Font().init$3("SansSerif", 0, this.size);
        g.setFont(f);
        //	FontMetrics fm = g.getFontMetrics();
        let i: number = 0;
        let maxw: number = -1;
        for (i = 0; i !== this.lines.size(); i++) {
            //	    int w = fm.stringWidth((String) (lines.elementAt(i)));
            let w: number = toInt(g.context.measureText(((this.lines.get(i)) as string)).getWidth());
            if (w > maxw) {
                maxw = w;
            }
        }
        let cury: number = this.y;
        this.setBbox$4(this.x, this.y, this.x, this.y);
        for (i = 0; i !== this.lines.size(); i++) {
            let s: string = ((this.lines.get(i)) as string);
            s = CirSim.LS(s);
            let sw: number = toInt(g.context.measureText(s).getWidth());
            if ((this.flags & this.FLAG_CENTER) !== 0) {
                this.x = (g.context.getCanvas().getWidth() - sw) / 2;
            }
            g.drawString(s, this.x, cury);
            if ((this.flags & this.FLAG_BAR) !== 0) {
                let by: number = cury - g.currentFontSize;
                g.drawLine(this.x, by, this.x + sw - 1, by);
            }
            this.adjustBbox$4(this.x, cury - g.currentFontSize, this.x + sw, cury + 3);
            cury += g.currentFontSize + 3;
        }
        this.x2 = this.boundingBox.x + this.boundingBox.width;
        this.y2 = this.boundingBox.y + this.boundingBox.height;
        g.setFont(oldfont);
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            let ei: EditInfo = new EditInfo("Text", 0, -1, -1);
            ei.text = this.text;
            return ei;
        }
        if (n === 1) {
            return new EditInfo("Size", this.size, 5, 100);
        }
        if (n === 2) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Center", (this.flags & this.FLAG_CENTER) !== 0);
            return ei;
        }
        if (n === 3) {
            let ei: EditInfo = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Draw Bar On Top", (this.flags & this.FLAG_BAR) !== 0);
            return ei;
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.text = ei.textf.getText();
            this.split();
        }
        if (n === 1) {
            this.size = toInt(ei.value);
        }
        if (n === 3) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_BAR;
            } else {
                this.flags &= ~this.FLAG_BAR;
            }
        }
        if (n === 2) {
            if (ei.checkbox.getState()) {
                this.flags |= this.FLAG_CENTER;
            } else {
                this.flags &= ~this.FLAG_CENTER;
            }
        }
    }
    isCenteredText(): boolean {
        return (this.flags & this.FLAG_CENTER) !== 0;
    }
    getInfo(arr: string[]): void {
        arr[0] = this.text;
    }
    getShortcut(): number {
        return 116;
    }
}
Object.assign(TextElm.prototype, { "text": null, "lines": null, "size": 0, "FLAG_CENTER": 1, "FLAG_BAR": 2, "FLAG_ESCAPE": 4 });
