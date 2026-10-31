# Circuit Simulator

An electronic circuit simulator: a TypeScript library, a Node command line tool and a canvas editor.
Circuits are stored in a plain text format.  The editor runs inside the Next.js app in `server/`,
and `server/public/templates/` holds a few hundred sample circuits with their menu, `setuplist.txt`.

```sh
pnpm simulate path/to/circuit.txt --steps 2000 --every 100    # CSV of node voltages
pnpm test                                                     # type check, physics tests, all samples
```

From the app, in the browser only:

```ts
import { mountEditor } from '@app/circuit/editor';
import '@app/circuit/editor.css';

const editor = mountEditor(element, { text, onChange: () => markDirty() });
editor.getText();
editor.destroy();
```

## Layout

| Path | Contents |
|---|---|
| `src/core/CirSim.ts` | Engine: analysis, matrix stamping, LU solver, time stepping, file format |
| `src/core/runtime.ts`, `gwt.ts`, `Graphics.ts`, `editinfo.ts` | Runtime support for the elements |
| `src/elements/` | All elements, scopes and device models |
| `src/core/internal.ts` | Module order; a new element file has to be listed here after its superclass |
| `src/core/factory.ts` | Element types in the file format, and the list of elements the UI can create |
| `src/ui/editor.ts` | Canvas editor |
| `src/ui/api.ts` | The editor's types, which are all the app's type checker sees of this package |
| `test/` | Tests; `test/circuits/` holds circuits for elements the samples don't use |
| `INTERNALS.md` | How the simulation works |

## Building

The Next.js app compiles this package from source, so there is no build step here.

- The app must be built with webpack.  The modules are circular and rely on the order in
  `internal.ts`, which Turbopack does not keep: the build succeeds and the editor then fails in the
  browser with `Cannot access 'CircuitElm' before initialization`.
- `"sideEffects": true` in `package.json` stops a bundler from skipping `internal.ts`.
- Imports have no `.js` suffix, and `useDefineForClassFields` is on, so a subclass can't redeclare a
  field without `declare`: the type check reports it.  The simulator does not type check under the
  app's `strict` settings, which is why `package.json` points TypeScript at `src/ui/api.ts`.

## Conventions in element code

The elements were converted from Java, and Java semantics are kept where JavaScript would silently
differ.  New code should follow the same rules:

- Integer arithmetic: `idiv(a, b)` for `int / int` and `toInt(x)` for `(int) x`, which behaves as the
  GWT-compiled cast does.  A `char` is a number, as in Java.
- Overloads have suffixes: `setBbox$3`, `setBbox$4`, or the parameter types when arity is not enough.
- Constructors are `init$N` methods called as `new Foo().init$2(x, y)`, because Java constructors can
  be overloaded and can call virtual methods before fields are set.
- A field that hides an inherited one or shares a method's name is renamed: `current$TransformerElm`,
  `reset$f`.

## Touch

A tap selects an element and opens its properties, and toggles a switch.  A drag pans and two fingers
pan and zoom.  A long press picks up the element under the finger, or one of its ends if the finger is
on a post; the drag then moves it.  With an element chosen in the palette, a drag draws it.

## Not implemented

- Dialogs for Dropbox and scope properties, and the diode, transistor and subcircuit model editors.
  Their buttons show a notice.  Element properties are edited in the side panel.
- Loading an audio file into `AudioInputElm` in the UI.
- Translations: `CirSim.translations` is empty, so the editor is in English.
- Copy and paste, element flipping and the right-click menu.

## Tests

`pnpm test` runs closed-form checks (divider, RC, RL, LC, sine source, diode, op amp, logic), Kirchhoff's
current law at every node of every sample, a comparison of `dump()` with the sample files, and a
headless draw of every element.

The results have **not** been compared number by number with the Java version this code came from.

`test/circuits/lm324-sub.txt`, `test/circuits/polarcap.txt` and the template `blank.txt` are expected
not to load: the first two use an old format and the third is empty.

## License

GNU General Public License, version 2 or (at your option) any later version.  See [COPYING.txt](COPYING.txt).

Copyright (C) Paul Falstad and Iain Sharp.  `Rectangle` and `Polygon` come from OpenJDK, copyright Sun
Microsystems.  `StringTokenizer` comes from GNU Classpath, copyright Free Software Foundation.  Each file
keeps its original notice.

Changes from the original, made on 2026-10-31: the simulator was converted from Java and GWT to
TypeScript, and the GWT user interface was replaced by a canvas UI.  Every converted file says so at the
top.  The canvas UI then became `mountEditor()` for use from a React page, relative imports lost their
`.js` suffix, the sample menu moved to the app, and a crash on resizing the view with scopes was fixed.

This program comes with ABSOLUTELY NO WARRANTY.
