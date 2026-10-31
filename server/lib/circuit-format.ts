// Опис формату для LLM: без нього модель не має звідки дізнатися синтаксис схеми.
// Поля звірені з dump() елементів у packages/circuit/src/elements.
export const CIRCUIT_FORMAT_GUIDE = `Circuits are plain text, one item per line. Tokens are separated by spaces.

The first line holds the simulator settings. Use it unchanged:
$ 1 5.0E-6 10 50 5.0

Every other line is one element:
<type> <x1> <y1> <x2> <y2> <flags> <parameters...>

Rules:
- (x1,y1) and (x2,y2) are the element's two terminals. Use multiples of 16 so the circuit fits the editor grid.
- Two terminals are connected only when their coordinates are exactly equal. A wire that merely passes over a terminal does not connect to it, so end the wire there.
- Use flags 0 unless a template shows otherwise.
- Values are plain numbers in SI units: 1000 for 1 kOhm, 0.00001 for 10 uF. Suffixes such as k or u are not accepted.
- Every circuit needs a ground element or a rail.
- Do not create loops of wires and voltage sources with no resistance, or the simulator stops.

Elements:
w x1 y1 x2 y2 0                                      wire
g x1 y1 x2 y2 0                                      ground; (x1,y1) is the terminal, (x2,y2) only sets where the symbol points
r x1 y1 x2 y2 0 <ohms>                               resistor
c x1 y1 x2 y2 0 <farads> <initial volts> 0           capacitor
l x1 y1 x2 y2 0 <henries> <initial amps>             inductor
v x1 y1 x2 y2 0 <wave> <hz> <volts> <bias> <phase> <duty>   voltage source; (x1,y1) is the negative side
R x1 y1 x2 y2 0 <wave> <hz> <volts> <bias> <phase> <duty>   rail: one terminal at (x1,y1), voltage to ground
s x1 y1 x2 y2 0 <position> false                     switch; position 0 is closed, 1 is open
d x1 y1 x2 y2 0 default                              diode; (x1,y1) is the anode
t x1 y1 x2 y2 0 <polarity> 0 0 <beta>                bipolar transistor; polarity 1 is NPN, -1 is PNP
x x1 y1 x2 y2 0 16 <text>                            label

<wave> is 0 DC, 1 sine, 2 square, 3 triangle, 4 sawtooth, 5 pulse. For DC set <hz> to 40, <bias> and <phase> to 0, and <duty> to 0.5. A sine's <volts> is its amplitude. <duty> is a fraction from 0 to 1.

Example, a 10 V source with two 1 kOhm resistors in series:
$ 1 5.0E-6 10 50 5.0
v 0 0 0 96 0 0 40 10 0 0 0.5
r 0 96 96 96 0 1000
r 96 96 96 0 0 1000
w 96 0 0 0 0
g 0 0 0 32 0

For anything else (logic gates, op-amps, MOSFETs, timers, oscilloscope lines), call list_templates and get_template, and copy the syntax from a sample that uses that element.`;
