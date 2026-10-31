// Reference designators as on a printed schematic: R1, R2, C1, U1.  They aren't stored in the file:
// each element is numbered by its place among those of its kind, so old circuits get them too.
import { CircuitElm, VoltageElm, type Graphics } from './internal';

const GAP = 4;
// a diagonal element's bounding box is far wider than its symbol
const DIAGONAL_REACH = 12;

// by dump type; a type left out (wire, ground, rail, text, scope, meter...) is not a component
const PREFIXES: Record<number, string> = {
    114: 'R', 374: 'R', 350: 'R', 109: 'R', 174: 'RV',
    99: 'C', 209: 'C',
    108: 'L',
    100: 'D', 122: 'D', 162: 'D', 175: 'D', 176: 'D', 203: 'D',
    157: 'DS', 405: 'DS',
    116: 'Q', 400: 'Q', 102: 'Q', 106: 'Q', 177: 'Q', 206: 'Q', 173: 'Q',
    118: 'V', 110: 'V', 170: 'V', 200: 'V', 201: 'V', 212: 'V', 214: 'V',
    105: 'I', 213: 'I', 215: 'I',
    115: 'S', 83: 'S', 416: 'S',
    404: 'F',
    84: 'T', 169: 'T', 406: 'T',
    178: 'K', 414: 'K',
    412: 'Y',
    415: 'M',
    181: 'LP',
    73: 'U', 97: 'U', 150: 'U', 151: 'U', 152: 'U', 153: 'U', 154: 'U', 155: 'U', 156: 'U', 158: 'U',
    159: 'U', 160: 'U', 161: 'U', 163: 'U', 164: 'U', 165: 'U', 166: 'U', 167: 'U', 168: 'U', 179: 'U',
    180: 'U', 182: 'U', 183: 'U', 184: 'U', 185: 'U', 186: 'U', 188: 'U', 189: 'U', 193: 'U', 194: 'U',
    195: 'U', 196: 'U', 197: 'U', 208: 'U', 401: 'U', 402: 'U', 407: 'U', 409: 'U', 410: 'U', 413: 'U',
};

export function assignDesignators(elements: Iterable<CircuitElm>): Map<CircuitElm, string> {
    const counts = new Map<string, number>();
    const names = new Map<CircuitElm, string>();
    for (const ce of elements) {
        const prefix = PREFIXES[ce.getDumpType()];
        if (prefix === undefined) continue;
        const n = (counts.get(prefix) ?? 0) + 1;
        counts.set(prefix, n);
        names.set(ce, prefix + n);
    }
    return names;
}

// drawValues() puts a value above a horizontal element and to one side of any other, so a
// designator takes the opposite side.  It stays out of the bounding box, which is the hit area.
function placeLabel(ce: CircuitElm, width: number, height: number): [number, number] {
    const box = ce.boundingBox;
    const xc = box.x + box.width / 2;
    if (ce.getPostCount() !== 2) return [xc - width / 2, box.y - GAP];
    if (ce.y === ce.y2) return [xc - width / 2, box.y + box.height + height + GAP];
    const valueOnLeft = ce instanceof VoltageElm || (ce.x < ce.x2 && ce.y > ce.y2);
    const reach = (ce.x === ce.x2 ? box.width / 2 : DIAGONAL_REACH) + GAP;
    return [valueOnLeft ? xc + reach : xc - reach - width, box.y + box.height / 2 + height / 2];
}

export function drawDesignators(g: Graphics, elements: Iterable<CircuitElm>): void {
    g.setFont(CircuitElm.unitsFont);
    g.setColor(CircuitElm.lightGrayColor);
    for (const [ce, name] of assignDesignators(elements)) {
        const [x, y] = placeLabel(ce, g.context.measureText(name).getWidth(), g.currentFontSize);
        g.drawString(name, x, y);
    }
}
