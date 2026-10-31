// Part of CircuitJS1.  GPL version 2 or later, see COPYING.txt.

// Changed 2026-10-31: converted from PDarlingtonElm.java to TypeScript.
/* eslint-disable */
import { DarlingtonElm } from '../core/internal';

export class PDarlingtonElm extends DarlingtonElm {
    init$2(xx: number, yy: number): this {
        DarlingtonElm.prototype.init$3.call(this, xx, yy, true);
        return this;
    }
    getDumpClass(): any {
        return DarlingtonElm;
    }
}
