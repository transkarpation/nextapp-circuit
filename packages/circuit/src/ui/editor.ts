// Canvas UI.  Elements draw themselves through Graphics, exactly as in the GWT version; this file
// replaces the GWT widgets, menus and mouse handling.
// Changed on 2026-10-31: the page script became mountEditor(), so that a React page can mount and
// unmount the editor, and the sample menu moved to the app's template list.  Touch input was added.
import { Button, CirSim, CircuitElm, Color, Context2d, Graphics, Label, Rectangle, Scope, Scrollbar, SwitchElm, TextArea } from '../core/internal';
import { drawDesignators } from '../core/designators';
import { EditInfo, parseUnits, unitString } from '../core/editinfo';
import { elementCreators } from '../core/factory';
import { paletteGroups } from './palette';
import type { EditorHandle, EditorOptions, MountEditor } from './api';

const POST_GRAB_SQ = 25;
const MIN_POST_GRAB_SIZE = 256;
const SCOPE_HEIGHT_FRACTION = 0.2;
const UNDO_LIMIT = 50;
const LONG_PRESS_MS = 350;
const LONG_PRESS_BUZZ_MS = 20;
// screen pixels: how far a finger may drift before it pans, and how close to a post it grabs the post
const TOUCH_SLOP = 10;
const TOUCH_POST_GRAB = 16;

const MARKUP = `
<header id="toolbar">
  <button id="run" title="Space">Stop</button>
  <button id="reset">Reset</button>
  <button id="dc" title="Find the DC operating point">DC</button>
  <span class="sep"></span>
  <button id="open" title="Replace this circuit with a text file">Import</button>
  <button id="save" title="Download this circuit as a text file">Export</button>
  <button id="text">Text</button>
  <input id="file" type="file" accept=".txt,text/plain" hidden>
  <span class="sep"></span>
  <select id="palette" aria-label="Add element"></select>
  <button id="select" title="Esc">Select</button>
  <button id="undo" title="Ctrl+Z">Undo</button>
  <span class="sep"></span>
  <label>Speed <input id="speed" type="range" min="0" max="260"></label>
  <label>Current <input id="current" type="range" min="1" max="100"></label>
  <label><input id="dots" type="checkbox"> Dots</label>
  <label><input id="volts" type="checkbox"> Volts</label>
  <label><input id="values" type="checkbox"> Values</label>
  <label><input id="names" type="checkbox"> Names</label>
  <label><input id="power" type="checkbox"> Power</label>
</header>
<main>
  <div id="stage"><canvas id="canvas"></canvas><div id="stop" hidden></div><pre id="info"></pre></div>
  <aside id="side">
    <section id="props" hidden><h2 id="props-title"></h2><div id="props-body"></div><div class="row"><button id="scope-add">View in scope</button><button id="delete">Delete</button></div></section>
    <section id="sliders" hidden><h2>Adjustments</h2><div id="sliders-body"></div></section>
    <section><p id="time"></p></section>
    <section id="about"><p>Copyright (C) Paul Falstad and Iain Sharp.</p><p>Free software under the <a href="/COPYING.txt" target="_blank">GNU GPL v2 or later</a>, with no warranty.</p></section>
  </aside>
</main>
<dialog id="text-dialog"><form method="dialog"><textarea id="text-area" spellcheck="false"></textarea><div class="row"><button value="cancel">Cancel</button><button id="text-load" value="load">Load</button></div></form></dialog>
`;

export const mountEditor: MountEditor = (root: HTMLElement, options: EditorOptions): EditorHandle => {
    root.classList.add('cs-editor');
    root.innerHTML = MARKUP;

    const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`) as T;
    const canvas = $<HTMLCanvasElement>('canvas');
    const stage = $('stage');
    const ctx = canvas.getContext('2d')!;
    const context = new Context2d(ctx);
    const listeners = new AbortController();
    const { signal } = listeners;
    const changed = () => options.onChange?.();
    let animationFrame = 0;

    const sim = new CirSim();
    sim.setSimRunning(true);

    let scale = 1;
    let offsetX = 0, offsetY = 0;
    let lastTime = 0;
    let hovered: CircuitElm | null = null;
    let editing: CircuitElm | null = null;
    let addClass: string | null = null;
    const undoStack: string[] = [];

    type Drag =
        | { kind: 'pan'; x: number; y: number }
        | { kind: 'move'; x: number; y: number; moved: boolean }
        | { kind: 'post'; elm: CircuitElm; post: number; x: number; y: number }
        | { kind: 'create' }
        | { kind: 'select'; x: number; y: number; rect: Rectangle };
    let drag: Drag | null = null;

    // a finger that is still down and has not yet become a pan or a long press
    let tap: { x: number; y: number; gx: number; gy: number } | null = null;
    let touchId: number | null = null;
    let longPress = 0;
    let pinch: { distance: number; x: number; y: number } | null = null;

    // ---- view ------------------------------------------------------------------------------------

    function resize(): void {
        const dpr = window.devicePixelRatio || 1;
        const r = stage.getBoundingClientRect();
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
        sim.canvasWidth = Math.round(r.width);
        sim.canvasHeight = Math.round(r.height);
        updateCircuitArea();
    }

    function updateCircuitArea(): void {
        const scopeHeight = sim.scopeCount > 0 ? Math.floor(sim.canvasHeight * SCOPE_HEIGHT_FRACTION) : 0;
        sim.circuitArea = new Rectangle().init$4(0, 0, sim.canvasWidth, sim.canvasHeight - scopeHeight);
    }

    function worldX(x: number): number { return (x - offsetX) / scale; }
    function worldY(y: number): number { return (y - offsetY) / scale; }

    // center the circuit in the view, as CirSim.centreCircuit()
    function centreCircuit(): void {
        if (sim.elmList.isEmpty()) return;
        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
        for (const ce of sim.elmList) {
            if (ce.isCenteredText()) continue;
            minx = Math.min(minx, ce.x, ce.x2);
            miny = Math.min(miny, ce.y, ce.y2);
            maxx = Math.max(maxx, ce.x, ce.x2);
            maxy = Math.max(maxy, ce.y, ce.y2);
        }
        if (!Number.isFinite(minx)) return;
        const w = sim.circuitArea.width, h = sim.circuitArea.height;
        scale = Math.min(1.5, Math.min((w - 80) / Math.max(maxx - minx, 1), (h - 80) / Math.max(maxy - miny, 1)));
        offsetX = (w - (maxx - minx) * scale) / 2 - minx * scale;
        offsetY = (h - (maxy - miny) * scale) / 2 - miny * scale;
    }

    function applyTransform(): void {
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);
        sim.transform = [scale, 0, 0, scale, offsetX, offsetY];
    }

    // ---- frame -----------------------------------------------------------------------------------

    function frame(): void {
        const didAnalyze = sim.analyzeFlag;
        try {
            if (sim.analyzeFlag || sim.dcAnalysisFlag) sim.update();
            updateCircuitArea();
            sim.setupScopes();
            if (sim.simRunning) {
                sim.runFrame(didAnalyze);
                const now = Date.now();
                if (lastTime !== 0) {
                    const c = Math.exp(sim.currentBar.getValue() / 3.5 - 14.2);
                    CircuitElm.currentMult = 1.7 * (now - lastTime) * c;
                    if (!sim.conventionCheckItem.getState()) CircuitElm.currentMult = -CircuitElm.currentMult;
                }
                lastTime = now;
            } else {
                lastTime = 0;
            }
            CircuitElm.powerMult = Math.exp(sim.powerBar.getValue() / 4.762 - 7);
            draw();
        } catch (e) {
            console.error(e);
            sim.stop(`Internal error: ${e}`, null);
        }
        sim.lastFrameTime = Date.now();
        animationFrame = requestAnimationFrame(frame);
    }

    function draw(): void {
        const g = new Graphics(context);
        const dpr = window.devicePixelRatio || 1;
        const printable = sim.printableCheckItem.getState();
        CircuitElm.selectColor = Color.cyan;
        CircuitElm.whiteColor = printable ? Color.black : Color.white;
        CircuitElm.lightGrayColor = printable ? Color.black : Color.lightGray;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = printable ? '#fff' : '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        g.setFont(CircuitElm.unitsFont);

        applyTransform();
        for (const ce of sim.elmList) {
            if (sim.powerCheckItem.getState()) g.setColor(Color.gray);
            ce.draw(g);
        }
        if (sim.designatorsCheckItem.getState()) drawDesignators(g, sim.elmList);
        if (drag?.kind !== 'post')
            for (const p of sim.postDrawList) CircuitElm.drawPost(g, p);
        if (hovered && drag == null) hovered.drawHandles(g, Color.cyan);
        if (sim.dragElm && (sim.dragElm.x !== sim.dragElm.x2 || sim.dragElm.y !== sim.dragElm.y2)) {
            sim.dragElm.draw(g);
            sim.dragElm.drawHandles(g, Color.cyan);
        }
        g.setColor(Color.red);
        for (const p of sim.badConnectionList) g.fillOval(p.x - 3, p.y - 3, 7, 7);
        if (drag?.kind === 'select') {
            g.setColor(Color.cyan);
            g.drawRect(drag.rect.x, drag.rect.y, drag.rect.width, drag.rect.height);
        }

        // scopes use screen coordinates
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (sim.scopeCount > 0) {
            ctx.fillStyle = printable ? '#fff' : '#000';
            ctx.fillRect(0, sim.circuitArea.height, sim.canvasWidth, sim.canvasHeight - sim.circuitArea.height);
        }
        for (let i = 0; i < sim.scopeCount; i++) sim.scopes[i].draw(g);

        updateStatus();
    }

    function updateStatus(): void {
        const stop = $('stop');
        stop.hidden = sim.stopMessage == null;
        if (sim.stopMessage != null) stop.textContent = sim.stopMessage;
        $('run').textContent = sim.simRunning ? 'Stop' : 'Run';
        $('time').textContent = `t = ${CircuitElm.getTimeText(sim.t)}\ndt = ${CircuitElm.getUnitText$2(sim.timeStep, 's')}`;
        const info: string[] = [];
        if (hovered) hovered.getInfo(info);
        else if (sim.mouseCursorY >= sim.circuitArea.height) {
            for (let i = 0; i < sim.scopeCount; i++) {
                const e = sim.scopes[i].getElm();
                if (sim.scopes[i].rect?.contains(sim.mouseCursorX, sim.mouseCursorY) && e) e.getInfo(info);
            }
        }
        $('info').textContent = info.filter((s) => s != null).join('\n');
    }

    // ---- mouse -----------------------------------------------------------------------------------

    function pointer(e: { clientX: number; clientY: number }): { x: number; y: number; gx: number; gy: number } {
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        return { x, y, gx: Math.round(worldX(x)), gy: Math.round(worldY(y)) };
    }

    // the element under the cursor: the smallest bounding box wins, and posts win over bodies
    function findElm(gx: number, gy: number, slop = 0): CircuitElm | null {
        let best: CircuitElm | null = null;
        let bestArea = Infinity;
        for (const ce of sim.elmList) {
            const bb = ce.boundingBox;
            if (gx < bb.x - slop || gx >= bb.x + bb.width + slop || gy < bb.y - slop || gy >= bb.y + bb.height + slop) continue;
            const area = bb.width * bb.height;
            if (area < bestArea) { best = ce; bestArea = area; }
        }
        return best;
    }

    function setHovered(ce: CircuitElm | null): void {
        hovered?.setMouseElm(false);
        hovered = ce;
        ce?.setMouseElm(true);
    }

    function clearSelection(): void {
        for (const ce of sim.elmList) ce.setSelected(false);
    }

    function pushUndo(): void {
        undoStack.push(sim.dumpCircuit());
        if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    }

    function removeElm(ce: CircuitElm): void {
        ce.delete();
        sim.elmList.removeItem(ce);
        if (hovered === ce) setHovered(null);
        if (editing === ce) showProps(null);
    }

    function startCreate(cls: string, gx: number, gy: number): void {
        pushUndo();
        const ce = elementCreators[cls](sim.snapGrid(gx), sim.snapGrid(gy));
        ce.setPoints();
        sim.dragElm = ce;
        drag = { kind: 'create' };
    }

    function startPost(ce: CircuitElm, gx: number, gy: number): void {
        pushUndo();
        drag = { kind: 'post', elm: ce, post: ce.lastHandleGrabbed, x: sim.snapGrid(gx), y: sim.snapGrid(gy) };
    }

    function startMove(ce: CircuitElm, gx: number, gy: number): void {
        ce.setSelected(true);
        pushUndo();
        drag = { kind: 'move', x: sim.snapGrid(gx), y: sim.snapGrid(gy), moved: false };
    }

    function toggleSwitch(ce: CircuitElm | null, gx: number, gy: number): boolean {
        if (!(ce instanceof SwitchElm && ce.getSwitchRect().contains(gx, gy))) return false;
        ce.toggle();
        sim.needAnalyze();
        changed();
        return true;
    }

    canvas.addEventListener('mousedown', (e) => {
        const { y, gx, gy } = pointer(e);
        if (y >= sim.circuitArea.height) return;
        canvas.focus();
        if (addClass) {
            startCreate(addClass, gx, gy);
            return;
        }
        const ce = findElm(gx, gy);
        if (hovered && hovered.getHandleGrabbedClose(gx, gy, POST_GRAB_SQ, MIN_POST_GRAB_SIZE) >= 0) {
            startPost(hovered, gx, gy);
            return;
        }
        if (toggleSwitch(ce, gx, gy)) return;
        if (ce) {
            if (!e.shiftKey && !ce.isSelected()) clearSelection();
            startMove(ce, gx, gy);
            return;
        }
        if (!e.shiftKey) clearSelection();
        if (e.shiftKey || e.button === 0 && e.ctrlKey)
            drag = { kind: 'select', x: gx, y: gy, rect: new Rectangle().init$4(gx, gy, 0, 0) };
        else
            drag = { kind: 'pan', x: e.clientX, y: e.clientY };
    }, { signal });

    function dragTo(e: { clientX: number; clientY: number }): void {
        const { gx, gy } = pointer(e);
        switch (drag?.kind) {
            case 'pan':
                offsetX += e.clientX - drag.x;
                offsetY += e.clientY - drag.y;
                drag.x = e.clientX;
                drag.y = e.clientY;
                break;
            case 'create':
                sim.dragElm!.drag(gx, gy);
                break;
            case 'post': {
                const sx = sim.snapGrid(gx), sy = sim.snapGrid(gy);
                if (sx !== drag.x || sy !== drag.y) {
                    drag.elm.movePoint(drag.post, sx - drag.x, sy - drag.y);
                    drag.x = sx;
                    drag.y = sy;
                    sim.needAnalyze();
                }
                break;
            }
            case 'move': {
                const sx = sim.snapGrid(gx), sy = sim.snapGrid(gy);
                const dx = sx - drag.x, dy = sy - drag.y;
                if (dx !== 0 || dy !== 0) {
                    const selected = sim.elmList.items.filter((ce) => ce.isSelected());
                    if (selected.every((ce) => ce.allowMove(dx, dy))) {
                        for (const ce of selected) ce.move(dx, dy);
                        drag.x = sx;
                        drag.y = sy;
                        drag.moved = true;
                        sim.needAnalyze();
                    }
                }
                break;
            }
            case 'select': {
                const r = drag.rect;
                r.setBounds(Math.min(drag.x, gx), Math.min(drag.y, gy), Math.abs(gx - drag.x), Math.abs(gy - drag.y));
                for (const ce of sim.elmList) ce.selectRect(r);
                break;
            }
        }
    }

    function endDrag(): void {
        if (drag?.kind === 'create') {
            const ce = sim.dragElm!;
            sim.dragElm = null;
            if (ce.creationFailed()) {
                ce.delete();
                undoStack.pop();
            } else {
                sim.elmList.add(ce);
                ce.draggingDone();
                sim.needAnalyze();
                changed();
            }
        } else if (drag?.kind === 'move' && !drag.moved) {
            undoStack.pop();
        } else if (drag?.kind === 'move' || drag?.kind === 'post') {
            changed();
        }
        drag = null;
    }

    window.addEventListener('mousemove', (e) => {
        const { x, y, gx, gy } = pointer(e);
        sim.mouseCursorX = x;
        sim.mouseCursorY = y;
        if (drag) dragTo(e);
        else setHovered(y < sim.circuitArea.height ? findElm(gx, gy) : null);
    }, { signal });

    window.addEventListener('mouseup', endDrag, { signal });

    canvas.addEventListener('dblclick', (e) => {
        const { gx, gy } = pointer(e);
        showProps(findElm(gx, gy));
    }, { signal });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const { x, y } = pointer(e);
        zoomAt(x, y, Math.exp(-e.deltaY * 0.001));
    }, { passive: false, signal });

    function zoomAt(x: number, y: number, factor: number): void {
        const wx = worldX(x), wy = worldY(y);
        scale = Math.min(4, Math.max(0.2, scale * factor));
        offsetX = x - wx * scale;
        offsetY = y - wy * scale;
    }

    // ---- touch -----------------------------------------------------------------------------------

    // A tap selects and a drag pans; only a long press picks an element up, so that panning across a
    // dense circuit moves nothing by accident.  Two fingers pan and zoom.

    // bounding boxes of wires are a pixel wide, too thin for a finger
    function touchElm(gx: number, gy: number): CircuitElm | null {
        return findElm(gx, gy) ?? findElm(gx, gy, TOUCH_SLOP / scale);
    }

    function pinchOf(touches: TouchList): { distance: number; x: number; y: number } {
        const a = touches[0], b = touches[1];
        const r = canvas.getBoundingClientRect();
        return {
            distance: Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)),
            x: (a.clientX + b.clientX) / 2 - r.left,
            y: (a.clientY + b.clientY) / 2 - r.top,
        };
    }

    function grab(ce: CircuitElm, gx: number, gy: number): void {
        tap = null;
        setHovered(ce);
        if (!ce.isSelected()) clearSelection();
        // the middle of a short element stays free for moving it
        const reach = Math.min(TOUCH_POST_GRAB / scale, Math.hypot(ce.x2 - ce.x, ce.y2 - ce.y) / 4);
        if (ce.getHandleGrabbedClose(gx, gy, reach * reach, MIN_POST_GRAB_SIZE) >= 0) startPost(ce, gx, gy);
        else startMove(ce, gx, gy);
        navigator.vibrate?.(LONG_PRESS_BUZZ_MS);
    }

    function tapAt(gx: number, gy: number): void {
        const ce = touchElm(gx, gy);
        if (toggleSwitch(ce, gx, gy)) return;
        clearSelection();
        ce?.setSelected(true);
        setHovered(ce);
        showProps(ce);
    }

    canvas.addEventListener('touchstart', (e) => {
        // no compatibility mouse events, so the mouse handlers above never see a finger.  That also
        // keeps focus where it was, and a property field only commits when it loses focus.
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
        if (e.touches.length > 1) {
            if (drag && drag.kind !== 'pan') return;
            clearTimeout(longPress);
            tap = null;
            drag = null;
            touchId = null;
            pinch = pinchOf(e.touches);
            return;
        }
        const t = e.touches[0];
        const { y, gx, gy } = pointer(t);
        if (y >= sim.circuitArea.height) return;
        touchId = t.identifier;
        if (addClass) {
            startCreate(addClass, gx, gy);
            return;
        }
        tap = { x: t.clientX, y: t.clientY, gx, gy };
        const ce = touchElm(gx, gy);
        if (ce) longPress = window.setTimeout(() => grab(ce, gx, gy), LONG_PRESS_MS);
    }, { passive: false, signal });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (pinch) {
            if (e.touches.length < 2) return;
            const next = pinchOf(e.touches);
            zoomAt(next.x, next.y, next.distance / pinch.distance);
            offsetX += next.x - pinch.x;
            offsetY += next.y - pinch.y;
            pinch = next;
            return;
        }
        const t = Array.from(e.touches).find((f) => f.identifier === touchId);
        if (!t) return;
        if (tap) {
            if (Math.hypot(t.clientX - tap.x, t.clientY - tap.y) < TOUCH_SLOP) return;
            clearTimeout(longPress);
            tap = null;
            drag = { kind: 'pan', x: t.clientX, y: t.clientY };
        }
        dragTo(t);
    }, { passive: false, signal });

    function touchEnd(e: TouchEvent, cancelled: boolean): void {
        if (pinch) {
            if (e.touches.length < 2) pinch = null;
            return;
        }
        if (!Array.from(e.changedTouches).some((f) => f.identifier === touchId)) return;
        touchId = null;
        clearTimeout(longPress);
        if (tap && !cancelled) tapAt(tap.gx, tap.gy);
        tap = null;
        endDrag();
    }

    canvas.addEventListener('touchend', (e) => touchEnd(e, false), { signal });
    canvas.addEventListener('touchcancel', (e) => touchEnd(e, true), { signal });

    window.addEventListener('keydown', (e) => {
        if ((e.target as HTMLElement).matches('input, textarea, select')) return;
        if (e.key === 'Escape') setAddMode(null);
        else if (e.key === ' ') { e.preventDefault(); toggleRun(); }
        else if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
        else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
    }, { signal });

    function deleteSelected(): void {
        const targets = sim.elmList.items.filter((ce) => ce.isSelected());
        if (hovered && !targets.length) targets.push(hovered);
        if (editing && !targets.length) targets.push(editing);
        if (!targets.length) return;
        pushUndo();
        for (const ce of targets) removeElm(ce);
        sim.needAnalyze();
        changed();
    }

    function undo(): void {
        const dump = undoStack.pop();
        if (dump == null) return;
        showProps(null);
        setHovered(null);
        load(dump, false);
        changed();
    }

    // ---- properties panel ----------------------------------------------------------------------------

    function field(label: string, control: HTMLElement, check = false): HTMLElement {
        const el = document.createElement('label');
        el.className = check ? 'field check' : 'field';
        if (check) { el.append(control, label); } else { el.append(label, control); }
        return el;
    }

    function applyEdit(n: number, ei: EditInfo): void {
        if (!editing) return;
        editing.setEditValue(n, ei);
        sim.needAnalyze();
        changed();
        if (ei.newDialog) showProps(editing);
    }

    // An editor keeps its element's EditInfo; element code reads the widgets back in setEditValue().
    function buildField(n: number, ei: EditInfo): HTMLElement {
        if (ei.choice) {
            const sel = document.createElement('select');
            ei.choice.items.forEach((t, i) => sel.add(new Option(t, String(i))));
            sel.selectedIndex = ei.choice.getSelectedIndex();
            sel.onchange = () => { ei.choice!.select(sel.selectedIndex); applyEdit(n, ei); };
            return field(ei.name, sel);
        }
        if (ei.checkbox) {
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.checked = ei.checkbox.getState();
            box.onchange = () => { ei.checkbox!.setState(box.checked); applyEdit(n, ei); };
            return field(ei.checkbox.label || ei.name, box, true);
        }
        if (ei.button) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = ei.button.text;
            b.onclick = () => { ei.button!.click(); changed(); if (editing) showProps(editing); };
            return field(ei.name, b);
        }
        if (ei.textArea) {
            const area = document.createElement('textarea');
            area.value = (ei.textArea as TextArea).getText();
            area.rows = 4;
            area.onchange = () => { ei.textArea!.setText(area.value); applyEdit(n, ei); };
            return field(ei.name, area);
        }
        const input = document.createElement('input');
        input.type = 'text';
        input.value = ei.text ?? unitString(ei, editing);
        ei.textf = { getText: () => input.value, setText: (s) => { input.value = s; } };
        input.onchange = () => {
            try {
                if (ei.text == null) ei.value = parseUnits(input.value);
                pushUndo();
                applyEdit(n, ei);
                input.setCustomValidity('');
            } catch {
                input.setCustomValidity('Not a number');
                input.reportValidity();
            }
        };
        return field(ei.name, input);
    }

    function showProps(ce: CircuitElm | null): void {
        editing = ce;
        const panel = $('props');
        panel.hidden = ce == null;
        if (!ce) return;
        const info: string[] = [];
        ce.getInfo(info);
        $('props-title').textContent = info[0] ?? ce.constructor.name;
        const body = $('props-body');
        body.replaceChildren();
        for (let n = 0; ; n++) {
            const ei = ce.getEditInfo(n);
            if (ei == null) break;
            if (ei.name == null) continue;
            body.append(buildField(n, ei));
        }
    }

    function addToScope(ce: CircuitElm): void {
        const s = new Scope().init$1(sim);
        s.position = sim.scopeCount;
        s.setElm(ce);
        sim.scopes[sim.scopeCount++] = s;
        updateCircuitArea();
        sim.setupScopes();
        changed();
    }

    // sliders and labels that elements put in the GWT vertical panel
    function renderWidgets(): void {
        const body = $('sliders-body');
        body.replaceChildren();
        $('sliders').hidden = sim.widgets.length === 0;
        for (const w of sim.widgets) {
            if (w instanceof Label) {
                const l = document.createElement('div');
                l.textContent = w.text;
                body.append(l);
            } else if (w instanceof Scrollbar) {
                const r = document.createElement('input');
                r.type = 'range';
                r.min = String(w.min);
                r.max = String(w.max - w.visible);
                r.value = String(w.getValue());
                r.oninput = () => { w.userSet(Number(r.value)); sim.needAnalyze(); changed(); };
                r.style.width = '100%';
                body.append(r);
            } else if (w instanceof Button) {
                const b = document.createElement('button');
                b.textContent = w.text;
                b.onclick = () => { w.click(); changed(); };
                body.append(b);
            }
        }
    }
    sim.onWidgetsChanged = renderWidgets;

    // ---- toolbar ----------------------------------------------------------------------------------

    function toggleRun(): void {
        sim.setSimRunning(!sim.simRunning);
        sim.lastIterTime = 0;
    }

    function setAddMode(cls: string | null): void {
        addClass = cls;
        $<HTMLSelectElement>('palette').value = cls ?? '';
        $('select').classList.toggle('active', cls == null);
        canvas.style.cursor = cls ? 'crosshair' : 'default';
    }

    function syncControls(): void {
        $<HTMLInputElement>('speed').valueAsNumber = sim.speedBar.getValue();
        $<HTMLInputElement>('current').valueAsNumber = sim.currentBar.getValue();
        const boxes: [string, typeof sim.dotsCheckItem][] = [['dots', sim.dotsCheckItem], ['volts', sim.voltsCheckItem],
            ['values', sim.showValuesCheckItem], ['names', sim.designatorsCheckItem], ['power', sim.powerCheckItem]];
        for (const [id, item] of boxes) {
            const box = $<HTMLInputElement>(id);
            box.checked = item.getState();
            box.onchange = () => { item.setState(box.checked); changed(); };
        }
    }

    function load(text: string, recentre = true): void {
        sim.widgets.length = 0;
        try {
            sim.readCircuit(text);
        } catch (e) {
            console.error(e);
            sim.stop(`Can't read this circuit: ${e}`, null);
            return;
        }
        sim.setSimRunning(true);
        sim.lastIterTime = 0;
        syncControls();
        renderWidgets();
        updateCircuitArea();
        for (const ce of sim.elmList) ce.setPoints();
        if (recentre) centreCircuit();
    }

    function buildPalette(): void {
        const select = $<HTMLSelectElement>('palette');
        select.add(new Option('Add element…', ''));
        const label = (s: string) => s.replace(/Elm$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
        for (const [title, names] of paletteGroups(Object.keys(elementCreators))) {
            const g = document.createElement('optgroup');
            g.label = title;
            for (const n of names) g.append(new Option(label(n), n));
            select.append(g);
        }
        select.onchange = () => setAddMode(select.value || null);
    }

    $('run').onclick = toggleRun;
    $('reset').onclick = () => sim.resetAction();
    $('dc').onclick = () => { sim.dcAnalysisFlag = true; };
    $('select').onclick = () => setAddMode(null);
    $('undo').onclick = undo;
    $('delete').onclick = deleteSelected;
    $('scope-add').onclick = () => { if (editing) addToScope(editing); };
    $<HTMLInputElement>('speed').oninput = (e) => { sim.speedBar.setValue((e.target as HTMLInputElement).valueAsNumber); changed(); };
    $<HTMLInputElement>('current').oninput = (e) => { sim.currentBar.setValue((e.target as HTMLInputElement).valueAsNumber); changed(); };
    $('open').onclick = () => $('file').click();
    $<HTMLInputElement>('file').onchange = async (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (!f) return;
        pushUndo();
        showProps(null);
        load(await f.text());
        changed();
    };
    $('save').onclick = () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([sim.dumpCircuit()], { type: 'text/plain' }));
        a.download = options.fileName?.() ?? 'circuit.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    };
    const textDialog = $<HTMLDialogElement>('text-dialog');
    $('text').onclick = () => {
        $<HTMLTextAreaElement>('text-area').value = sim.dumpCircuit();
        textDialog.showModal();
    };
    textDialog.addEventListener('close', () => {
        if (textDialog.returnValue === 'load') {
            pushUndo();
            showProps(null);
            load($<HTMLTextAreaElement>('text-area').value);
            changed();
        }
    }, { signal });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();
    buildPalette();
    syncControls();
    setAddMode(null);
    load(options.text);
    animationFrame = requestAnimationFrame(frame);

    return {
        getText: () => sim.dumpCircuit(),
        destroy(): void {
            cancelAnimationFrame(animationFrame);
            clearTimeout(longPress);
            resizeObserver.disconnect();
            listeners.abort();
            sim.setSimRunning(false);
            root.replaceChildren();
            root.classList.remove('cs-editor');
        },
    };
};
