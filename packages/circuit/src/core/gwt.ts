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

// Changed 2026-10-31: ported from the GWT-facing parts of the Java sources to TypeScript by hand.
// Minimal stand-ins for the GWT classes used by the element code.  Widgets are plain models:
// the canvas UI renders them, and in Node they simply hold their state.
import { Scope } from './internal';

export type CanvasGradient = any;
export type Element = any;
export type Command = { execute(): void };
export type ClickEvent = any;
export type ChangeEvent = any;
export type MouseWheelEvent = any;
export type ClickHandler = { onClick(e: any): void };
export type ChangeHandler = { onChange(e: any): void };
export type MouseWheelHandler = { onMouseWheel(e: any): void };
export type JsArrayNumber = any;
export type Widget = any;

export const LineCap = { ROUND: 'round', BUTT: 'butt', SQUARE: 'square' } as const;
export type LineCap = string;
export type JsArrayInteger = number[];
export const JsArrayInteger = { createArray: (): number[] => [] };
export const GWT = { getModuleBaseURL: () => '' };

export const Window = {
    alert(msg: string): void { if (typeof alert === 'function') alert(msg); else console.error(msg); },
    confirm(msg: string): boolean { return typeof confirm === 'function' ? confirm(msg) : false; },
    open(url: string, name?: string, features?: string): void { if (typeof open === 'function') open(url, name, features); },
};

export class Storage {
    static getLocalStorageIfSupported(): Storage | null {
        return typeof localStorage === 'undefined' ? null : new Storage();
    }
    getItem(k: string): string | null { return localStorage.getItem(k); }
    setItem(k: string, v: string): void { localStorage.setItem(k, v); }
    removeItem(k: string): void { localStorage.removeItem(k); }
    getLength(): number { return localStorage.length; }
    key(i: number): string | null { return localStorage.key(i); }
}

// Supports the patterns used by the simulator: '#' optional and '0' required digits.
export class NumberFormat {
    private constructor(private maxFrac: number, private minFrac: number) {}
    static getFormat(p: string): NumberFormat {
        const frac = p.split('.')[1] ?? '';
        return new NumberFormat(frac.length, frac.replace(/#/g, '').length);
    }
    format(v: number): string {
        if (!Number.isFinite(v)) return String(v);
        // GWT rounds half to even at the last kept digit
        const scale = 10 ** this.maxFrac;
        const scaled = Math.abs(v) * scale;
        const fl = Math.floor(scaled);
        const diff = scaled - fl;
        const rounded = diff > 0.5 || (diff === 0.5 && fl % 2 === 1) ? fl + 1 : fl;
        let s = (rounded / scale).toFixed(this.maxFrac);
        if (this.maxFrac > this.minFrac && s.includes('.')) {
            let end = s.length;
            const keep = s.indexOf('.') + 1 + this.minFrac;
            while (end > keep && s[end - 1] === '0') end--;
            if (s[end - 1] === '.') end--;
            s = s.slice(0, end);
        }
        return (v < 0 && rounded !== 0 ? '-' : '') + s;
    }
}

export class DateTimeFormat {
    static getFormat(_p: string): DateTimeFormat { return new DateTimeFormat(); }
    format(d: Date): string {
        const p = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
    }
}

export const SafeHtmlUtils = {
    htmlEscape(s: string): string {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
};

class WidgetModel {
    styles: string[] = [];
    addStyleName(s: string): void { this.styles.push(s); }
    setStylePrimaryName(s: string): void { this.styles.push(s); }
    getElement(): any { return { setAttribute() {}, getStyle: () => ({}) }; }
    setWidth(_s: string): void {}
    setHeight(_s: string): void {}
}

export class Label extends WidgetModel {
    constructor(public text: string = '') { super(); }
    setText(s: string): void { this.text = s; }
}
export class Button extends WidgetModel {
    handler: ClickHandler | null = null;
    constructor(public text: string = '', handler?: ClickHandler) { super(); this.handler = handler ?? null; }
    addClickHandler(h: ClickHandler): void { this.handler = h; }
    setText(s: string): void { this.text = s; }
    getText(): string { return this.text; }
    setEnabled(_b: boolean): void {}
    click(): void { this.handler?.onClick(null); }
}
export class TextArea extends WidgetModel {
    text = '';
    getText(): string { return this.text; }
    setText(s: string): void { this.text = s; }
    setVisibleLines(_n: number): void {}
}
export class Anchor extends WidgetModel {
    constructor(public text = '', public asHtml: boolean | string = false, public href = '') { super(); }
}
export class FileUpload extends WidgetModel {
    handler: ChangeHandler | null = null;
    getFilename(): string { return ''; }
    addChangeHandler(h: ChangeHandler): void { this.handler = h; }
}

// Scope's offscreen trace buffer.  Without a DOM the buffer is a no-op.
export class Canvas {
    constructor(private el: any) {}
    static createIfSupported(): Canvas | null {
        return new Canvas(typeof document === 'undefined' ? null : document.createElement('canvas'));
    }
    getContext2d(): Context2d { return new Context2d(this.el?.getContext('2d') ?? null); }
    setWidth(_s: string): void {}
    setHeight(_s: string): void {}
    setCoordinateSpaceWidth(w: number): void { if (this.el) this.el.width = w; }
    setCoordinateSpaceHeight(h: number): void { if (this.el) this.el.height = h; }
    getCoordinateSpaceWidth(): number { return this.el?.width ?? 0; }
    getCoordinateSpaceHeight(): number { return this.el?.height ?? 0; }
    getCanvasElement(): any { return this.el; }
}

// GWT's Context2d API on top of CanvasRenderingContext2D; every call is a no-op when headless.
export class Context2d {
    private fontSize = 12;
    constructor(public c: CanvasRenderingContext2D | null) {}
    save(): void { this.c?.save(); }
    restore(): void { this.c?.restore(); }
    beginPath(): void { this.c?.beginPath(); }
    closePath(): void { this.c?.closePath(); }
    moveTo(x: number, y: number): void { this.c?.moveTo(x, y); }
    lineTo(x: number, y: number): void { this.c?.lineTo(x, y); }
    arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void { this.c?.arc(x, y, r, a0, a1, ccw); }
    rect(x: number, y: number, w: number, h: number): void { this.c?.rect(x, y, w, h); }
    clip(): void { this.c?.clip(); }
    fill(): void { this.c?.fill(); }
    stroke(): void { this.c?.stroke(); }
    fillRect(x: number, y: number, w: number, h: number): void { this.c?.fillRect(x, y, w, h); }
    strokeRect(x: number, y: number, w: number, h: number): void { this.c?.strokeRect(x, y, w, h); }
    clearRect(x: number, y: number, w: number, h: number): void { this.c?.clearRect(x, y, w, h); }
    fillText(s: string, x: number, y: number): void { this.c?.fillText(s, x, y); }
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void { this.c?.transform(a, b, c, d, e, f); }
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void { this.c?.setTransform(a, b, c, d, e, f); }
    scale(x: number, y: number): void { this.c?.scale(x, y); }
    translate(x: number, y: number): void { this.c?.translate(x, y); }
    rotate(a: number): void { this.c?.rotate(a); }
    setLineWidth(w: number): void { if (this.c) this.c.lineWidth = w; }
    setStrokeStyle(s: any): void { if (this.c) this.c.strokeStyle = s; }
    setFillStyle(s: any): void { if (this.c) this.c.fillStyle = s; }
    setFont(f: string): void {
        if (this.c) this.c.font = f;
        this.fontSize = parseInt(/(\d+)px/.exec(f)?.[1] ?? '12', 10);
    }
    setGlobalAlpha(a: number): void { if (this.c) this.c.globalAlpha = a; }
    setTextAlign(a: string): void { if (this.c) this.c.textAlign = a as CanvasTextAlign; }
    setTextBaseline(b: string): void { if (this.c) this.c.textBaseline = b as CanvasTextBaseline; }
    setLineCap(c: string): void { if (this.c) this.c.lineCap = c as CanvasLineCap; }
    setLineDash(d: number[]): void { this.c?.setLineDash(d); }
    drawImage(src: any, ...a: number[]): void {
        const el = src?.el ?? src;
        if (this.c && el) (this.c.drawImage as any)(el, ...a);
    }
    measureText(s: string): { getWidth(): number } {
        // headless estimate; only affects bounding boxes of text
        const w = this.c ? this.c.measureText(s).width : s.length * 0.6 * this.fontSize;
        return { getWidth: () => w };
    }
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): any {
        return this.c ? this.c.createLinearGradient(x0, y0, x1, y1) : { addColorStop() {} };
    }
    getCanvas(): any {
        const el = this.c?.canvas;
        return { el, getWidth: () => el?.width ?? 0, getHeight: () => el?.height ?? 0, getCoordinateSpaceWidth: () => el?.width ?? 0, getCoordinateSpaceHeight: () => el?.height ?? 0 };
    }
}

// The GWT dialogs are gone; the canvas UI edits elements through getEditInfo() instead.  These
// keep the model-editing buttons of some elements harmless.
export class EditDialog {
    constructor(..._a: any[]) {}
    show(): void { Window.alert('This editor is not available in the TypeScript version.'); }
    closeDialog(): void {}
    isShowing(): boolean { return false; }
    setModel(_m: any): void {}
    createDialog(): void {}
}
export class EditDiodeModelDialog extends EditDialog {}
export class EditTransistorModelDialog extends EditDialog {}
export class EditCompositeModelDialog extends EditDialog {}

export class ScopePropertiesDialog extends EditDialog {
    refreshDraw(): void {}
    static nextHighestScale(d: number): number {
        d = d * 1.001; // Go just above last check point
        let s = Scope.MIN_MAN_SCALE;
        for (let a = 0; s < d; a++) s *= Scope.multa[a % 3]; // Iterate until we go over the target
        return s;
    }
}
