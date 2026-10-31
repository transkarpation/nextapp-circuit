// Java runtime semantics the generated code relies on.

// (int) cast as compiled by GWT: NaN becomes 0 and out-of-range values saturate
export function toInt(x: number): number {
    if (Number.isNaN(x)) return 0;
    if (x >= 2147483647) return 2147483647;
    if (x <= -2147483648) return -2147483648;
    return x < 0 ? Math.ceil(x) + 0 : Math.floor(x);
}
export function toByte(x: number): number { return (toInt(x) << 24) >> 24; }
export function toChar(x: number): number { return toInt(x) & 0xffff; }
export function idiv(a: number, b: number): number { return (a / b) | 0; }
export function ldiv(a: number, b: number): number { return Math.trunc(a / b); }

export function boolOp(op: string, a: boolean, b: boolean): boolean {
    return op === '&' ? a && b : op === '|' ? a || b : a !== b;
}

export function newArray(fill: any, ...dims: number[]): any {
    const [n, ...rest] = dims;
    if (n < 0) throw new RangeError('negative array size');
    const a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = rest.length ? newArray(fill, ...rest) : fill;
    return a;
}

export function arraycopy(src: any[], sp: number, dst: any[], dp: number, n: number): void {
    const tmp = src.slice(sp, sp + n);
    for (let i = 0; i < n; i++) dst[dp + i] = tmp[i];
}

// new Integer(s) and Integer.parseInt(s) throw on bad input; the file loader depends on that
export function parseJInt(s: string, radix = 10): number {
    const ok = radix === 16 ? /^[+-]?[0-9a-fA-F]+$/.test(s) : /^[+-]?[0-9]+$/.test(s);
    if (typeof s !== 'string' || !ok) throw new Error(`NumberFormatException: ${s}`);
    return parseInt(s, radix);
}
export function parseJDouble(s: string): number {
    const t = typeof s === 'string' ? s.trim() : s;
    if (typeof t !== 'string' || t === '' || !/^[+-]?(NaN|Infinity|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?)$/.test(t))
        throw new Error(`NumberFormatException: ${s}`);
    return parseFloat(t);
}
// new Boolean(String) ignores case; elements also pass real booleans
export function javaBoolean(x: string | boolean): boolean {
    return typeof x === 'string' ? x.toLowerCase() === 'true' : !!x;
}
export function highestOneBit(x: number): number { return x === 0 ? 0 : (1 << (31 - Math.clz32(x))) >>> 0; }
export function numToString(x: number, radix = 10): string { return x.toString(radix); }
export function bitCount(x: number): number { let n = 0; for (x >>>= 0; x; x >>>= 1) n += x & 1; return n; }
export function isInfinite(x: number): boolean { return x === Infinity || x === -Infinity; }

export function charAt(s: string, i: number): number {
    if (i < 0 || i >= s.length) throw new RangeError(`string index ${i}`);
    return s.charCodeAt(i);
}
export function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
export function stringHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return h;
}
export function javaSplit(s: string, regex: string): string[] {
    const parts = s.split(new RegExp(regex));
    while (parts.length && parts[parts.length - 1] === '') parts.pop();
    return parts;
}
export function javaEquals(a: any, b: any): boolean {
    if (a == null) return false;
    return typeof a.equals$1 === 'function' ? a.equals$1(b) : typeof a.equals === 'function' ? a.equals(b) : a === b;
}

export function Character_isDigit(c: number): boolean { return c >= 48 && c <= 57; }
export function Character_isLetter(c: number): boolean { return /\p{L}/u.test(String.fromCharCode(c)); }
export function Character_isLetterOrDigit(c: number): boolean { return Character_isLetter(c) || Character_isDigit(c); }
export function Character_isWhitespace(c: number): boolean { return c === 32 || (c >= 9 && c <= 13); }
export function Character_isUpperCase(c: number): boolean { return c >= 65 && c <= 90; }
export function Character_isLowerCase(c: number): boolean { return c >= 97 && c <= 122; }
export function Character_toLowerCase(c: number): number { return String.fromCharCode(c).toLowerCase().charCodeAt(0); }
export function Character_toUpperCase(c: number): number { return String.fromCharCode(c).toUpperCase().charCodeAt(0); }

export const System = {
    out: { println: (...a: any[]) => { if (a.length) void a; }, print: (..._a: any[]) => {} },
    currentTimeMillis: () => Date.now(),
};

export interface Iterator<T> { hasNext(): boolean; next(): T; }

export class Vector<T> implements Iterable<T> {
    items: T[] = [];
    constructor(from?: any) { if (from instanceof Vector) this.items = from.items.slice(); }
    size(): number { return this.items.length; }
    isEmpty(): boolean { return this.items.length === 0; }
    get(i: number): T {
        if (i < 0 || i >= this.items.length) throw new RangeError(`Vector index ${i}`);
        return this.items[i];
    }
    set(i: number, v: T): T { const old = this.items[i]; this.items[i] = v; return old; }
    add(v: T): boolean { this.items.push(v); return true; }
    insertAt(i: number, v: T): void { this.items.splice(i, 0, v); }
    removeAt(i: number): T {
        if (i < 0 || i >= this.items.length) throw new RangeError(`Vector index ${i}`);
        return this.items.splice(i, 1)[0];
    }
    removeItem(v: T): boolean {
        const i = this.items.indexOf(v);
        if (i < 0) return false;
        this.items.splice(i, 1);
        return true;
    }
    clear(): void { this.items.length = 0; }
    contains(v: T): boolean { return this.items.includes(v); }
    indexOf(v: T): number { return this.items.indexOf(v); }
    first(): T { return this.get(0); }
    last(): T { return this.get(this.items.length - 1); }
    addAll(o: Vector<T>): boolean { this.items.push(...o.items); return true; }
    toArray(): T[] { return this.items.slice(); }
    iterator(): Iterator<T> {
        let i = 0;
        const items = this.items;
        return { hasNext: () => i < items.length, next: () => items[i++] };
    }
    [Symbol.iterator](): globalThis.Iterator<T> { return this.items[Symbol.iterator](); }
}

export class MapEntry<K, V> {
    constructor(private key: K, private value: V, private owner: HashMap<K, V>) {}
    getKey(): K { return this.key; }
    getValue(): V { return this.value; }
    setValue(v: V): V { const old = this.value; this.value = v; this.owner.put(this.key, v); return old; }
}

// Keys compare by value.  Points are the only composite keys used as map keys.
function hashKey(k: any): any {
    return k !== null && typeof k === 'object' && 'x' in k && 'y' in k ? `${k.x},${k.y}` : k;
}

export class HashMap<K, V> {
    private m = new Map<any, [K, V]>();
    size(): number { return this.m.size; }
    isEmpty(): boolean { return this.m.size === 0; }
    get(k: K): V { const e = this.m.get(hashKey(k)); return (e ? e[1] : null) as V; }
    put(k: K, v: V): V {
        const key = hashKey(k);
        const old = this.m.get(key);
        this.m.set(key, [old ? old[0] : k, v]);
        return (old ? old[1] : null) as V;
    }
    containsKey(k: K): boolean { return this.m.has(hashKey(k)); }
    remove(k: K): V { const key = hashKey(k); const e = this.m.get(key); this.m.delete(key); return (e ? e[1] : null) as V; }
    clear(): void { this.m.clear(); }
    entrySet(): Vector<MapEntry<K, V>> {
        const v = new Vector<MapEntry<K, V>>();
        for (const [k, x] of this.m.values()) v.add(new MapEntry(k, x, this));
        return v;
    }
    keySet(): Vector<K> { const v = new Vector<K>(); for (const [k] of this.m.values()) v.add(k); return v; }
    values(): Vector<V> { const v = new Vector<V>(); for (const [, x] of this.m.values()) v.add(x); return v; }
}
export { HashMap as Map_ };

export class HashSet<T> extends Vector<T> {
    add(v: T): boolean { if (this.contains(v)) return false; return super.add(v); }
}

export class StringBuilder {
    private s = '';
    constructor(init?: any) { if (typeof init === 'string') this.s = init; }
    append(x: any): this { this.s += String(x); return this; }
    length(): number { return this.s.length; }
    charAt(i: number): number { return this.s.charCodeAt(i); }
    substring(a: number, b?: number): string { return this.s.substring(a, b); }
    deleteCharAt(i: number): this { this.s = this.s.slice(0, i) + this.s.slice(i + 1); return this; }
    delete(a: number, b: number): this { this.s = this.s.slice(0, a) + this.s.slice(b); return this; }
    toString(): string { return this.s; }
}

export { StringBuilder as StringBuffer };

export class Random {
    nextDouble(): number { return Math.random(); }
    nextInt(n?: number): number {
        return n === undefined ? (Math.random() * 4294967296 - 2147483648) | 0 : Math.floor(Math.random() * n);
    }
}

export const Collections = {
    sort<T>(v: Vector<T>): void {
        v.items.sort((a: any, b: any) => (typeof a?.compareTo === 'function' ? a.compareTo(b) : compareStrings(a, b)));
    },
};
