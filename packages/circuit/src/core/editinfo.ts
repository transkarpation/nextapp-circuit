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

// Changed 2026-10-31: ported from EditInfo.java, EditDialog.java, Choice.java, Checkbox.java and Scrollbar.java to TypeScript by hand.
// Element property model (ports of EditInfo, Choice, Checkbox, Scrollbar and the unit parsing in
// EditDialog).  The GWT versions were widgets; here they are data that a UI renders.
import { Button, CirSim, CircuitElm, NumberFormat, TextArea, VoltageElm } from './internal';

export interface Editable {
    getEditInfo(n: number): EditInfo | null;
    setEditValue(n: number, ei: EditInfo): void;
}

export class Checkbox {
    state: boolean;
    constructor(public label: string, state = false) { this.label = CirSim.LS(label); this.state = state; }
    getState(): boolean { return this.state; }
    setState(s: boolean): void { this.state = s; }
}

export class CheckboxMenuItem extends Checkbox {}

export class Choice {
    items: string[] = [];
    selected = 0;
    add(s: string): void { this.items.push(CirSim.LS(s)); }
    addItem(s: string): void { this.items.push(s); }
    select(i: number): void { this.selected = i; }
    setSelectedIndex(i: number): void { this.selected = i; }
    getSelectedIndex(): number { return this.selected; }
    getItemCount(): number { return this.items.length; }
    getSelectedItem(): string { return this.items[this.selected]; }
    getItemText(i: number): string { return this.items[i]; }
}

export class Scrollbar {
    static HORIZONTAL = 1;
    static VERTICAL = 2;
    value: number;
    constructor(public orientation: number, value: number, public visible: number, public min: number, public max: number,
        public command: { execute(): void } | null = null, public attachedElm: CircuitElm | null = null) {
        this.value = value;
    }
    getValue(): number { return this.value; }
    setValue(v: number): void { this.value = v; }
    setWidth(_w: number): void {}
    enable(): void {}
    disable(): void {}
    draw(): void {}
    onMouseWheel(_e: any): void {}
    // called by the UI when the user drags the slider
    userSet(v: number): void { this.value = v; this.command?.execute(); }
}

export class EditInfo {
    name: string;
    text: string | null = null;
    value = 0;
    textf: { getText(): string; setText(s: string): void } | null = null;
    choice: Choice | null = null;
    checkbox: Checkbox | null = null;
    button: Button | null = null;
    textArea: TextArea | null = null;
    widget: any = null;
    newDialog = false;
    dimensionless = false;
    noSliders = false;

    constructor(n: string, val?: number | string, _mn?: number, _mx?: number) {
        this.name = n;
        if (typeof val === 'string') this.text = val;
        else this.value = val ?? 0;
    }
    setDimensionless(): this { this.dimensionless = true; return this; }
    disallowSliders(): this { this.noSliders = true; return this; }
    changeFlag(flags: number, bit: number): number {
        return this.checkbox!.getState() ? flags | bit : flags & ~bit;
    }
    canCreateAdjustable(): boolean {
        return this.choice == null && this.checkbox == null && this.button == null && this.textArea == null &&
            this.widget == null && !this.noSliders;
    }
    static makeLink(file: string, text: string): string {
        return `<a href="${file}" target="_blank">${CirSim.LS(text)}</a>`;
    }
}

const ROOT2 = 1.41421356237309504880;
const noCommaFormat = NumberFormat.getFormat('####.##########');

// EditDialog.parseUnits(): "2k2", "10u", "1 Meg", "5rms" -> number.  Throws on bad input.
export function parseUnits(input: string): number {
    let s = input.trim();
    let rmsMult = 1;
    if (s.endsWith('rms')) {
        s = s.slice(0, -3).trim();
        rmsMult = ROOT2;
    }
    s = s.replace(/([0-9]+)([pPnNuUmMkKgG])([0-9]+)/g, '$1.$3$2');
    s = s.replace(/[mM][eE][gG]$/, 'M');
    const mults: Record<string, number> = { f: 1e-15, F: 1e-15, p: 1e-12, P: 1e-12, n: 1e-9, N: 1e-9, u: 1e-6, U: 1e-6,
        m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9, g: 1e9 };
    let mult = 1;
    const last = s[s.length - 1];
    if (last in mults) {
        mult = mults[last];
        s = s.slice(0, -1).trim();
    }
    const v = Number(s);
    if (s === '' || Number.isNaN(v)) throw new Error(`bad number: ${input}`);
    return v * mult * rmsMult;
}

function diffFromInteger(x: number): number { return Math.abs(x - Math.round(x)); }

function formatUnits(ei: EditInfo | null, v: number): string {
    const va = Math.abs(v);
    const f = (x: number) => noCommaFormat.format(x);
    if (ei?.dimensionless || !Number.isFinite(va)) return f(v);
    if (v === 0) return '0';
    if (va < 1e-12) return f(v * 1e15) + 'f';
    if (va < 1e-9) return f(v * 1e12) + 'p';
    if (va < 1e-6) return f(v * 1e9) + 'n';
    if (va < 1e-3) return f(v * 1e6) + 'u';
    if (va < 1) return f(v * 1e3) + 'm';
    if (va < 1e3) return f(v);
    if (va < 1e6) return f(v * 1e-3) + 'k';
    if (va < 1e9) return f(v * 1e-6) + 'M';
    return f(v * 1e-9) + 'G';
}

// EditDialog.unitString(): the text shown in a property field
export function unitString(ei: EditInfo, elm?: unknown): string {
    if (elm instanceof VoltageElm && Math.abs(ei.value) > 1e-4 &&
        diffFromInteger(ei.value * 1e4) > diffFromInteger(ei.value * 1e4 / ROOT2))
        return formatUnits(ei, ei.value / ROOT2) + 'rms';
    return formatUnits(ei, ei.value);
}
