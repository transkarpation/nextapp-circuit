// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from Expr.java to TypeScript.
/* eslint-disable */
import { CirSim, Vector, charAt, compareStrings, newArray, parseJDouble } from '../core/internal';

export class ExprState {
    //int n;
    declare values: number[];
    declare t: number;
    init$1(xx: number): this {
        //n = xx;
        this.values = newArray(0, 9);
        this.values[4] = Math.E;
        return this;
    }
    constructor() {}
}
Object.assign(ExprState.prototype, { "values": null, "t": 0 });

export class Expr {
    init$3(e1: Expr, e2: Expr, v: number): this {
        this.children = new Vector();
        this.children.add(e1);
        if (e2 != null) {
            this.children.add(e2);
        }
        this.type = v;
        return this;
    }
    init$2(v: number, vv: number): this {
        this.type = v;
        this.value = vv;
        return this;
    }
    init$1(v: number): this {
        this.type = v;
        return this;
    }
    eval(es: ExprState): number {
        let left: Expr = null as any;
        let right: Expr = null as any;
        if (this.children != null && this.children.size() > 0) {
            left = this.children.first();
            if (this.children.size() === 2) {
                right = this.children.last();
            }
        }
        switch (this.type) {
            case Expr.E_ADD:
                return left.eval(es) + right.eval(es);
            case Expr.E_SUB:
                return left.eval(es) - right.eval(es);
            case Expr.E_MUL:
                return left.eval(es) * right.eval(es);
            case Expr.E_DIV:
                return left.eval(es) / right.eval(es);
            case Expr.E_POW:
                return Math.pow(left.eval(es), right.eval(es));
            case Expr.E_UMINUS:
                return -left.eval(es);
            case Expr.E_VAL:
                return this.value;
            case Expr.E_T:
                return es.t;
            case Expr.E_SIN:
                return Math.sin(left.eval(es));
            case Expr.E_COS:
                return Math.cos(left.eval(es));
            case Expr.E_ABS:
                return Math.abs(left.eval(es));
            case Expr.E_EXP:
                return Math.exp(left.eval(es));
            case Expr.E_LOG:
                return Math.log(left.eval(es));
            case Expr.E_SQRT:
                return Math.sqrt(left.eval(es));
            case Expr.E_TAN:
                return Math.tan(left.eval(es));
            case Expr.E_MIN:
                {
                    let i: number = 0;
                    let x: number = left.eval(es);
                    for (i = 1; i < this.children.size(); i++) {
                        x = Math.min(x, this.children.get(i).eval(es));
                    }
                    return x;
                }
            case Expr.E_MAX:
                {
                    let i: number = 0;
                    let x: number = left.eval(es);
                    for (i = 1; i < this.children.size(); i++) {
                        x = Math.max(x, this.children.get(i).eval(es));
                    }
                    return x;
                }
            case Expr.E_CLAMP:
                return Math.min(Math.max(left.eval(es), this.children.get(1).eval(es)), this.children.get(2).eval(es));
            case Expr.E_STEP:
                {
                    let x: number = left.eval(es);
                    if (right == null) {
                        return (x < 0) ? 0 : 1;
                    }
                    return (x > right.eval(es)) ? 0 : (x < 0) ? 0 : 1;
                }
            case Expr.E_SELECT:
                {
                    let x: number = left.eval(es);
                    return this.children.get(x > 0 ? 2 : 1).eval(es);
                }
            case Expr.E_TRIANGLE:
                {
                    let x: number = this.posmod(left.eval(es), Math.PI * 2) / Math.PI;
                    return (x < 1) ? -1 + x * 2 : 3 - x * 2;
                }
            case Expr.E_SAWTOOTH:
                {
                    let x: number = this.posmod(left.eval(es), Math.PI * 2) / Math.PI;
                    return x - 1;
                }
            case Expr.E_MOD:
                return left.eval(es) % right.eval(es);
            case Expr.E_PWL:
                return this.pwl(es, this.children);
            case Expr.E_PWR:
                return Math.pow(Math.abs(left.eval(es)), right.eval(es));
            case Expr.E_PWRS:
                {
                    let x: number = left.eval(es);
                    if (x < 0) {
                        return -Math.pow(-x, right.eval(es));
                    }
                    return Math.pow(x, right.eval(es));
                }
            default:
                if (this.type >= Expr.E_A) {
                    return es.values[this.type - Expr.E_A];
                }
                CirSim.console("unknown\n");
        }
        return 0;
    }
    pwl(es: ExprState, args: Vector<Expr>): number {
        let x: number = args.get(0).eval(es);
        let x0: number = args.get(1).eval(es);
        let y0: number = args.get(2).eval(es);
        if (x < x0) {
            return y0;
        }
        let x1: number = args.get(3).eval(es);
        let y1: number = args.get(4).eval(es);
        let i: number = 5;
        while (true) {
            if (x < x1) {
                return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
            }
            if (i + 1 >= args.size()) {
                break;
            }
            x0 = x1;
            y0 = y1;
            x1 = args.get(i).eval(es);
            y1 = args.get(i + 1).eval(es);
            i += 2;
        }
        return y1;
    }
    posmod(x: number, y: number): number {
        x %= y;
        return (x >= 0) ? x : x + y;
    }
    declare children: Vector<Expr>;
    declare value: number;
    declare type: number;
    static E_ADD: number = 1;
    static E_SUB: number = 2;
    static E_T: number = 3;
    static E_VAL: number = 6;
    static E_MUL: number = 7;
    static E_DIV: number = 8;
    static E_POW: number = 9;
    static E_UMINUS: number = 10;
    static E_SIN: number = 11;
    static E_COS: number = 12;
    static E_ABS: number = 13;
    static E_EXP: number = 14;
    static E_LOG: number = 15;
    static E_SQRT: number = 16;
    static E_TAN: number = 17;
    static E_R: number = 18;
    static E_MAX: number = 19;
    static E_MIN: number = 20;
    static E_CLAMP: number = 21;
    static E_PWL: number = 22;
    static E_TRIANGLE: number = 23;
    static E_SAWTOOTH: number = 24;
    static E_MOD: number = 25;
    static E_STEP: number = 26;
    static E_SELECT: number = 27;
    static E_PWR: number = 28;
    static E_PWRS: number = 29;
    static E_A: number = 30;
    // should be at end
    constructor() {}
}
Object.assign(Expr.prototype, { "children": null, "value": 0, "type": 0 });

export class ExprParser {
    declare text: string;
    declare token: string;
    declare pos: number;
    declare tlen: number;
    declare err: boolean;
    getToken(): void {
        while (this.pos < this.tlen && charAt(this.text, this.pos) === 32) {
            this.pos++;
        }
        if (this.pos === this.tlen) {
            this.token = "";
            return;
        }
        let i: number = this.pos;
        let c: number = charAt(this.text, i);
        if ((c >= 48 && c <= 57) || c === 46) {
            for (i = this.pos; i !== this.tlen; i++) {
                if (charAt(this.text, i) === 101 || charAt(this.text, i) === 69) {
                    i++;
                    if (i < this.tlen && (charAt(this.text, i) === 43 || charAt(this.text, i) === 45)) {
                        i++;
                    }
                }
                if (!((charAt(this.text, i) >= 48 && charAt(this.text, i) <= 57) || charAt(this.text, i) === 46)) {
                    break;
                }
            }
        } else if (c >= 97 && c <= 122) {
            for (i = this.pos; i !== this.tlen; i++) {
                if (!(charAt(this.text, i) >= 97 && charAt(this.text, i) <= 122)) {
                    break;
                }
            }
        } else {
            i++;
        }
        this.token = this.text.substring(this.pos, i);
        this.pos = i;
    }
    skip(s: string): boolean {
        if (compareStrings(this.token, s) !== 0) {
            return false;
        }
        this.getToken();
        return true;
    }
    skipOrError(s: string): void {
        if (!this.skip(s)) {
            this.err = true;
        }
    }
    parseExpression(): Expr {
        if (this.token.length === 0) {
            return new Expr().init$2(Expr.E_VAL, 0.);
        }
        let e: Expr = this.parse();
        if (this.token.length > 0) {
            this.err = true;
        }
        return e;
    }
    parse(): Expr {
        let e: Expr = this.parseMult();
        while (true) {
            if (this.skip("+")) {
                e = new Expr().init$3(e, this.parseMult(), Expr.E_ADD);
            } else if (this.skip("-")) {
                e = new Expr().init$3(e, this.parseMult(), Expr.E_SUB);
            } else {
                break;
            }
        }
        return e;
    }
    parseMult(): Expr {
        let e: Expr = this.parseUminus();
        while (true) {
            if (this.skip("*")) {
                e = new Expr().init$3(e, this.parseUminus(), Expr.E_MUL);
            } else if (this.skip("/")) {
                e = new Expr().init$3(e, this.parseUminus(), Expr.E_DIV);
            } else {
                break;
            }
        }
        return e;
    }
    parseUminus(): Expr {
        this.skip("+");
        if (this.skip("-")) {
            return new Expr().init$3(this.parsePow(), null, Expr.E_UMINUS);
        }
        return this.parsePow();
    }
    parsePow(): Expr {
        let e: Expr = this.parseTerm();
        while (true) {
            if (this.skip("^")) {
                e = new Expr().init$3(e, this.parseTerm(), Expr.E_POW);
            } else {
                break;
            }
        }
        return e;
    }
    parseFunc(t: number): Expr {
        this.skipOrError("(");
        let e: Expr = this.parse();
        this.skipOrError(")");
        return new Expr().init$3(e, null, t);
    }
    parseFuncMulti(t: number, minArgs: number, maxArgs: number): Expr {
        let args: number = 1;
        this.skipOrError("(");
        let e1: Expr = this.parse();
        let e: Expr = new Expr().init$3(e1, null, t);
        while (this.skip(",")) {
            let enext: Expr = this.parse();
            e.children.add(enext);
            args++;
        }
        this.skipOrError(")");
        if (args < minArgs || args > maxArgs) {
            this.err = true;
        }
        return e;
    }
    parseTerm(): Expr {
        if (this.skip("(")) {
            let e: Expr = this.parse();
            this.skipOrError(")");
            return e;
        }
        if (this.skip("t")) {
            return new Expr().init$1(Expr.E_T);
        }
        if (this.token.length === 1) {
            let c: number = charAt(this.token, 0);
            if (c >= 97 && c <= 105) {
                this.getToken();
                return new Expr().init$1(Expr.E_A + (c - 97));
            }
        }
        if (this.skip("pi")) {
            return new Expr().init$2(Expr.E_VAL, 3.14159265358979323846);
        }
        //	if (skip("e"))
        //	    return new Expr(Expr.E_VAL, 2.7182818284590452354);
        if (this.skip("sin")) {
            return this.parseFunc(Expr.E_SIN);
        }
        if (this.skip("cos")) {
            return this.parseFunc(Expr.E_COS);
        }
        if (this.skip("abs")) {
            return this.parseFunc(Expr.E_ABS);
        }
        if (this.skip("exp")) {
            return this.parseFunc(Expr.E_EXP);
        }
        if (this.skip("log")) {
            return this.parseFunc(Expr.E_LOG);
        }
        if (this.skip("sqrt")) {
            return this.parseFunc(Expr.E_SQRT);
        }
        if (this.skip("tan")) {
            return this.parseFunc(Expr.E_TAN);
        }
        if (this.skip("tri")) {
            return this.parseFunc(Expr.E_TRIANGLE);
        }
        if (this.skip("saw")) {
            return this.parseFunc(Expr.E_SAWTOOTH);
        }
        if (this.skip("min")) {
            return this.parseFuncMulti(Expr.E_MIN, 2, 1000);
        }
        if (this.skip("max")) {
            return this.parseFuncMulti(Expr.E_MAX, 2, 1000);
        }
        if (this.skip("pwl")) {
            return this.parseFuncMulti(Expr.E_PWL, 2, 1000);
        }
        if (this.skip("mod")) {
            return this.parseFuncMulti(Expr.E_MOD, 2, 2);
        }
        if (this.skip("step")) {
            return this.parseFuncMulti(Expr.E_STEP, 1, 2);
        }
        if (this.skip("select")) {
            return this.parseFuncMulti(Expr.E_SELECT, 3, 3);
        }
        if (this.skip("clamp")) {
            return this.parseFuncMulti(Expr.E_CLAMP, 3, 3);
        }
        if (this.skip("pwr")) {
            return this.parseFuncMulti(Expr.E_PWR, 2, 2);
        }
        if (this.skip("pwrs")) {
            return this.parseFuncMulti(Expr.E_PWRS, 2, 2);
        }
        try {
            let e: Expr = new Expr().init$2(Expr.E_VAL, parseJDouble(this.token));
            this.getToken();
            return e;
        } catch (e) {
            this.err = true;
            CirSim.console("unrecognized token: " + this.token + "\n");
            return new Expr().init$2(Expr.E_VAL, 0);
        }
    }
    init$1(s: string): this {
        this.text = s.toLowerCase();
        this.tlen = this.text.length;
        this.pos = 0;
        this.err = false;
        this.getToken();
        return this;
    }
    gotError(): boolean {
        return this.err;
    }
    constructor() {}
}
Object.assign(ExprParser.prototype, { "text": null, "token": null, "pos": 0, "tlen": 0, "err": false });
