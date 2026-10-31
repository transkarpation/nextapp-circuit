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
// info about each row/column of the matrix for simplification purposes

// Changed 2026-10-31: converted from RowInfo.java to TypeScript.
/* eslint-disable */

export class RowInfo {
    static ROW_NORMAL: number = 0;
    // ordinary value
    static ROW_CONST: number = 1;
    // value is constant
    declare type: number;
    declare mapCol: number;
    declare mapRow: number;
    declare value: number;
    declare rsChanges: boolean;
    // row's right side changes
    declare lsChanges: boolean;
    // row's left side changes
    declare dropRow: boolean;
    // row is not needed in matrix
    init$0(): this {
        this.type = RowInfo.ROW_NORMAL;
        return this;
    }
    constructor() {}
}
Object.assign(RowInfo.prototype, { "type": 0, "mapCol": 0, "mapRow": 0, "value": 0, "rsChanges": false, "lsChanges": false, "dropRow": false });
