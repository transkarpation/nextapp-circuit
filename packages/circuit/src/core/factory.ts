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
// GWT conversion (c) 2015 by Iain Sharp
// For information about the theory behind this, see Electronic Circuit & System Simulation Methods by Pillage

// Changed 2026-10-31: converted from CirSim.createCe() and CirSim.constructElement() in CirSim.java to TypeScript.
import { CircuitElm, StringTokenizer, ACRailElm, ACVoltageElm, ADCElm, AMElm, AmmeterElm, AnalogSwitch2Elm, AnalogSwitchElm, AndGateElm, AntennaElm, AudioInputElm, AudioOutputElm, BoxElm, CC2Elm, CC2NegElm, CCCSElm, CCVSElm, CapacitorElm, ClockElm, ComparatorElm, CounterElm, CrystalElm, CurrentElm, CustomCompositeElm, CustomLogicElm, CustomTransformerElm, DACElm, DCMotorElm, DCVoltageElm, DFlipFlopElm, DarlingtonElm, DataRecorderElm, DeMultiplexerElm, DiacElm, DiodeElm, FMElm, FullAdderElm, FuseElm, GroundElm, HalfAdderElm, InductorElm, InverterElm, InvertingSchmittElm, JKFlipFlopElm, JfetElm, LDRElm, LEDArrayElm, LEDElm, LabeledNodeElm, LampElm, LatchElm, LogicInputElm, LogicOutputElm, MBBSwitchElm, MemristorElm, MonostableElm, MosfetElm, MultiplexerElm, NDarlingtonElm, NJfetElm, NMosfetElm, NTransistorElm, NandGateElm, NoiseElm, NorGateElm, OTAElm, OhmMeterElm, OpAmpElm, OpAmpRealElm, OpAmpSwapElm, OptocouplerElm, OrGateElm, OutputElm, PDarlingtonElm, PJfetElm, PMosfetElm, PTransistorElm, PhaseCompElm, PisoShiftElm, PolarCapacitorElm, PotElm, ProbeElm, PushSwitchElm, RailElm, RelayElm, ResistorElm, RingCounterElm, SCRElm, SRAMElm, SchmittElm, ScopeElm, SeqGenElm, SevenSegDecoderElm, SevenSegElm, SipoShiftElm, SparkGapElm, SquareRailElm, StopTriggerElm, SweepElm, Switch2Elm, SwitchElm, TFlipFlopElm, TappedTransformerElm, TestPointElm, TextElm, ThermistorNTCElm, TimeDelayRelayElm, TimerElm, TransLineElm, TransformerElm, TransistorElm, TriStateElm, TriacElm, TriodeElm, TunnelDiodeElm, VCCSElm, VCOElm, VCVSElm, VarRailElm, VaractorElm, VoltageElm, WireElm, XorGateElm, ZenerElm } from './internal';

export function createCe(tint: number, x1: number, y1: number, x2: number, y2: number, f: number, st: StringTokenizer): CircuitElm | null {
    switch (tint) {
    case 65: return new AntennaElm().init$6(x1, y1, x2, y2, f, st);
    case 73: return new InverterElm().init$6(x1, y1, x2, y2, f, st);
    case 76: return new LogicInputElm().init$6(x1, y1, x2, y2, f, st);
    case 77: return new LogicOutputElm().init$6(x1, y1, x2, y2, f, st);
    case 79: return new OutputElm().init$6(x1, y1, x2, y2, f, st);
    case 82: return new RailElm().init$6(x1, y1, x2, y2, f, st);
    case 83: return new Switch2Elm().init$6(x1, y1, x2, y2, f, st);
    case 84: return new TransformerElm().init$6(x1, y1, x2, y2, f, st);
    case 97: return new OpAmpElm().init$6(x1, y1, x2, y2, f, st);
    case 98: return new BoxElm().init$6(x1, y1, x2, y2, f, st);
    case 99: return new CapacitorElm().init$6(x1, y1, x2, y2, f, st);
    case 100: return new DiodeElm().init$6(x1, y1, x2, y2, f, st);
    case 102: return new MosfetElm().init$6(x1, y1, x2, y2, f, st);
    case 103: return new GroundElm().init$6(x1, y1, x2, y2, f, st);
    case 105: return new CurrentElm().init$6(x1, y1, x2, y2, f, st);
    case 106: return new JfetElm().init$6(x1, y1, x2, y2, f, st);
    case 108: return new InductorElm().init$6(x1, y1, x2, y2, f, st);
    case 109: return new MemristorElm().init$6(x1, y1, x2, y2, f, st);
    case 110: return new NoiseElm().init$6(x1, y1, x2, y2, f, st);
    case 112: return new ProbeElm().init$6(x1, y1, x2, y2, f, st);
    case 114: return new ResistorElm().init$6(x1, y1, x2, y2, f, st);
    case 115: return new SwitchElm().init$6(x1, y1, x2, y2, f, st);
    case 116: return new TransistorElm().init$6(x1, y1, x2, y2, f, st);
    case 118: return new VoltageElm().init$6(x1, y1, x2, y2, f, st);
    case 119: return new WireElm().init$6(x1, y1, x2, y2, f, st);
    case 120: return new TextElm().init$6(x1, y1, x2, y2, f, st);
    case 122: return new ZenerElm().init$6(x1, y1, x2, y2, f, st);
    case 150: return new AndGateElm().init$6(x1, y1, x2, y2, f, st);
    case 151: return new NandGateElm().init$6(x1, y1, x2, y2, f, st);
    case 152: return new OrGateElm().init$6(x1, y1, x2, y2, f, st);
    case 153: return new NorGateElm().init$6(x1, y1, x2, y2, f, st);
    case 154: return new XorGateElm().init$6(x1, y1, x2, y2, f, st);
    case 155: return new DFlipFlopElm().init$6(x1, y1, x2, y2, f, st);
    case 156: return new JKFlipFlopElm().init$6(x1, y1, x2, y2, f, st);
    case 157: return new SevenSegElm().init$6(x1, y1, x2, y2, f, st);
    case 158: return new VCOElm().init$6(x1, y1, x2, y2, f, st);
    case 159: return new AnalogSwitchElm().init$6(x1, y1, x2, y2, f, st);
    case 160: return new AnalogSwitch2Elm().init$6(x1, y1, x2, y2, f, st);
    case 161: return new PhaseCompElm().init$6(x1, y1, x2, y2, f, st);
    case 162: return new LEDElm().init$6(x1, y1, x2, y2, f, st);
    case 163: return new RingCounterElm().init$6(x1, y1, x2, y2, f, st);
    case 164: return new CounterElm().init$6(x1, y1, x2, y2, f, st);
    case 165: return new TimerElm().init$6(x1, y1, x2, y2, f, st);
    case 166: return new DACElm().init$6(x1, y1, x2, y2, f, st);
    case 167: return new ADCElm().init$6(x1, y1, x2, y2, f, st);
    case 168: return new LatchElm().init$6(x1, y1, x2, y2, f, st);
    case 169: return new TappedTransformerElm().init$6(x1, y1, x2, y2, f, st);
    case 170: return new SweepElm().init$6(x1, y1, x2, y2, f, st);
    case 171: return new TransLineElm().init$6(x1, y1, x2, y2, f, st);
    case 172: return new VarRailElm().init$6(x1, y1, x2, y2, f, st);
    case 173: return new TriodeElm().init$6(x1, y1, x2, y2, f, st);
    case 174: return new PotElm().init$6(x1, y1, x2, y2, f, st);
    case 175: return new TunnelDiodeElm().init$6(x1, y1, x2, y2, f, st);
    case 176: return new VaractorElm().init$6(x1, y1, x2, y2, f, st);
    case 177: return new SCRElm().init$6(x1, y1, x2, y2, f, st);
    case 178: return new RelayElm().init$6(x1, y1, x2, y2, f, st);
    case 179: return new CC2Elm().init$6(x1, y1, x2, y2, f, st);
    case 180: return new TriStateElm().init$6(x1, y1, x2, y2, f, st);
    case 181: return new LampElm().init$6(x1, y1, x2, y2, f, st);
    case 182: return new SchmittElm().init$6(x1, y1, x2, y2, f, st);
    case 183: return new InvertingSchmittElm().init$6(x1, y1, x2, y2, f, st);
    case 184: return new MultiplexerElm().init$6(x1, y1, x2, y2, f, st);
    case 185: return new DeMultiplexerElm().init$6(x1, y1, x2, y2, f, st);
    case 186: return new PisoShiftElm().init$6(x1, y1, x2, y2, f, st);
    case 187: return new SparkGapElm().init$6(x1, y1, x2, y2, f, st);
    case 188: return new SeqGenElm().init$6(x1, y1, x2, y2, f, st);
    case 189: return new SipoShiftElm().init$6(x1, y1, x2, y2, f, st);
    case 193: return new TFlipFlopElm().init$6(x1, y1, x2, y2, f, st);
    case 194: return new MonostableElm().init$6(x1, y1, x2, y2, f, st);
    case 195: return new HalfAdderElm().init$6(x1, y1, x2, y2, f, st);
    case 196: return new FullAdderElm().init$6(x1, y1, x2, y2, f, st);
    case 197: return new SevenSegDecoderElm().init$6(x1, y1, x2, y2, f, st);
    case 200: return new AMElm().init$6(x1, y1, x2, y2, f, st);
    case 201: return new FMElm().init$6(x1, y1, x2, y2, f, st);
    case 203: return new DiacElm().init$6(x1, y1, x2, y2, f, st);
    case 206: return new TriacElm().init$6(x1, y1, x2, y2, f, st);
    case 207: return new LabeledNodeElm().init$6(x1, y1, x2, y2, f, st);
    case 208: return new CustomLogicElm().init$6(x1, y1, x2, y2, f, st);
    case 209: return new PolarCapacitorElm().init$6(x1, y1, x2, y2, f, st);
    case 210: return new DataRecorderElm().init$6(x1, y1, x2, y2, f, st);
    case 211: return new AudioOutputElm().init$6(x1, y1, x2, y2, f, st);
    case 212: return new VCVSElm().init$6(x1, y1, x2, y2, f, st);
    case 213: return new VCCSElm().init$6(x1, y1, x2, y2, f, st);
    case 214: return new CCVSElm().init$6(x1, y1, x2, y2, f, st);
    case 215: return new CCCSElm().init$6(x1, y1, x2, y2, f, st);
    case 216: return new OhmMeterElm().init$6(x1, y1, x2, y2, f, st);
    case 350: return new ThermistorNTCElm().init$6(x1, y1, x2, y2, f, st);
    case 368: return new TestPointElm().init$6(x1, y1, x2, y2, f, st);
    case 370: return new AmmeterElm().init$6(x1, y1, x2, y2, f, st);
    case 374: return new LDRElm().init$6(x1, y1, x2, y2, f, st);
    case 400: return new DarlingtonElm().init$6(x1, y1, x2, y2, f, st);
    case 401: return new ComparatorElm().init$6(x1, y1, x2, y2, f, st);
    case 402: return new OTAElm().init$6(x1, y1, x2, y2, f, st);
    case 403: return new ScopeElm().init$6(x1, y1, x2, y2, f, st);
    case 404: return new FuseElm().init$6(x1, y1, x2, y2, f, st);
    case 405: return new LEDArrayElm().init$6(x1, y1, x2, y2, f, st);
    case 406: return new CustomTransformerElm().init$6(x1, y1, x2, y2, f, st);
    case 407: return new OptocouplerElm().init$6(x1, y1, x2, y2, f, st);
    case 408: return new StopTriggerElm().init$6(x1, y1, x2, y2, f, st);
    case 409: return new OpAmpRealElm().init$6(x1, y1, x2, y2, f, st);
    case 410: return new CustomCompositeElm().init$6(x1, y1, x2, y2, f, st);
    case 411: return new AudioInputElm().init$6(x1, y1, x2, y2, f, st);
    case 412: return new CrystalElm().init$6(x1, y1, x2, y2, f, st);
    case 413: return new SRAMElm().init$6(x1, y1, x2, y2, f, st);
    case 414: return new TimeDelayRelayElm().init$6(x1, y1, x2, y2, f, st);
    case 415: return new DCMotorElm().init$6(x1, y1, x2, y2, f, st);
    case 416: return new MBBSwitchElm().init$6(x1, y1, x2, y2, f, st);
    }
    return null;
}

export const elementCreators: Record<string, (x: number, y: number) => CircuitElm> = {
    GroundElm: (x, y) => new GroundElm().init$2(x, y),
    ResistorElm: (x, y) => new ResistorElm().init$2(x, y),
    RailElm: (x, y) => new RailElm().init$2(x, y),
    SwitchElm: (x, y) => new SwitchElm().init$2(x, y),
    Switch2Elm: (x, y) => new Switch2Elm().init$2(x, y),
    MBBSwitchElm: (x, y) => new MBBSwitchElm().init$2(x, y),
    NTransistorElm: (x, y) => new NTransistorElm().init$2(x, y),
    TransistorElm: (x, y) => new NTransistorElm().init$2(x, y),
    PTransistorElm: (x, y) => new PTransistorElm().init$2(x, y),
    WireElm: (x, y) => new WireElm().init$2(x, y),
    CapacitorElm: (x, y) => new CapacitorElm().init$2(x, y),
    PolarCapacitorElm: (x, y) => new PolarCapacitorElm().init$2(x, y),
    InductorElm: (x, y) => new InductorElm().init$2(x, y),
    DCVoltageElm: (x, y) => new DCVoltageElm().init$2(x, y),
    VoltageElm: (x, y) => new DCVoltageElm().init$2(x, y),
    VarRailElm: (x, y) => new VarRailElm().init$2(x, y),
    PotElm: (x, y) => new PotElm().init$2(x, y),
    OutputElm: (x, y) => new OutputElm().init$2(x, y),
    CurrentElm: (x, y) => new CurrentElm().init$2(x, y),
    ProbeElm: (x, y) => new ProbeElm().init$2(x, y),
    DiodeElm: (x, y) => new DiodeElm().init$2(x, y),
    ZenerElm: (x, y) => new ZenerElm().init$2(x, y),
    ACVoltageElm: (x, y) => new ACVoltageElm().init$2(x, y),
    ACRailElm: (x, y) => new ACRailElm().init$2(x, y),
    SquareRailElm: (x, y) => new SquareRailElm().init$2(x, y),
    SweepElm: (x, y) => new SweepElm().init$2(x, y),
    LEDElm: (x, y) => new LEDElm().init$2(x, y),
    AntennaElm: (x, y) => new AntennaElm().init$2(x, y),
    LogicInputElm: (x, y) => new LogicInputElm().init$2(x, y),
    LogicOutputElm: (x, y) => new LogicOutputElm().init$2(x, y),
    TransformerElm: (x, y) => new TransformerElm().init$2(x, y),
    TappedTransformerElm: (x, y) => new TappedTransformerElm().init$2(x, y),
    TransLineElm: (x, y) => new TransLineElm().init$2(x, y),
    RelayElm: (x, y) => new RelayElm().init$2(x, y),
    MemristorElm: (x, y) => new MemristorElm().init$2(x, y),
    SparkGapElm: (x, y) => new SparkGapElm().init$2(x, y),
    ClockElm: (x, y) => new ClockElm().init$2(x, y),
    AMElm: (x, y) => new AMElm().init$2(x, y),
    FMElm: (x, y) => new FMElm().init$2(x, y),
    LampElm: (x, y) => new LampElm().init$2(x, y),
    PushSwitchElm: (x, y) => new PushSwitchElm().init$2(x, y),
    OpAmpElm: (x, y) => new OpAmpElm().init$2(x, y),
    OpAmpSwapElm: (x, y) => new OpAmpSwapElm().init$2(x, y),
    NMosfetElm: (x, y) => new NMosfetElm().init$2(x, y),
    MosfetElm: (x, y) => new NMosfetElm().init$2(x, y),
    PMosfetElm: (x, y) => new PMosfetElm().init$2(x, y),
    NJfetElm: (x, y) => new NJfetElm().init$2(x, y),
    JfetElm: (x, y) => new NJfetElm().init$2(x, y),
    PJfetElm: (x, y) => new PJfetElm().init$2(x, y),
    AnalogSwitchElm: (x, y) => new AnalogSwitchElm().init$2(x, y),
    AnalogSwitch2Elm: (x, y) => new AnalogSwitch2Elm().init$2(x, y),
    SchmittElm: (x, y) => new SchmittElm().init$2(x, y),
    InvertingSchmittElm: (x, y) => new InvertingSchmittElm().init$2(x, y),
    TriStateElm: (x, y) => new TriStateElm().init$2(x, y),
    SCRElm: (x, y) => new SCRElm().init$2(x, y),
    DiacElm: (x, y) => new DiacElm().init$2(x, y),
    TriacElm: (x, y) => new TriacElm().init$2(x, y),
    TriodeElm: (x, y) => new TriodeElm().init$2(x, y),
    VaractorElm: (x, y) => new VaractorElm().init$2(x, y),
    TunnelDiodeElm: (x, y) => new TunnelDiodeElm().init$2(x, y),
    CC2Elm: (x, y) => new CC2Elm().init$2(x, y),
    CC2NegElm: (x, y) => new CC2NegElm().init$2(x, y),
    InverterElm: (x, y) => new InverterElm().init$2(x, y),
    NandGateElm: (x, y) => new NandGateElm().init$2(x, y),
    NorGateElm: (x, y) => new NorGateElm().init$2(x, y),
    AndGateElm: (x, y) => new AndGateElm().init$2(x, y),
    OrGateElm: (x, y) => new OrGateElm().init$2(x, y),
    XorGateElm: (x, y) => new XorGateElm().init$2(x, y),
    DFlipFlopElm: (x, y) => new DFlipFlopElm().init$2(x, y),
    JKFlipFlopElm: (x, y) => new JKFlipFlopElm().init$2(x, y),
    SevenSegElm: (x, y) => new SevenSegElm().init$2(x, y),
    MultiplexerElm: (x, y) => new MultiplexerElm().init$2(x, y),
    DeMultiplexerElm: (x, y) => new DeMultiplexerElm().init$2(x, y),
    SipoShiftElm: (x, y) => new SipoShiftElm().init$2(x, y),
    PisoShiftElm: (x, y) => new PisoShiftElm().init$2(x, y),
    PhaseCompElm: (x, y) => new PhaseCompElm().init$2(x, y),
    CounterElm: (x, y) => new CounterElm().init$2(x, y),
    DecadeElm: (x, y) => new RingCounterElm().init$2(x, y),
    RingCounterElm: (x, y) => new RingCounterElm().init$2(x, y),
    TimerElm: (x, y) => new TimerElm().init$2(x, y),
    DACElm: (x, y) => new DACElm().init$2(x, y),
    ADCElm: (x, y) => new ADCElm().init$2(x, y),
    LatchElm: (x, y) => new LatchElm().init$2(x, y),
    SeqGenElm: (x, y) => new SeqGenElm().init$2(x, y),
    VCOElm: (x, y) => new VCOElm().init$2(x, y),
    BoxElm: (x, y) => new BoxElm().init$2(x, y),
    TextElm: (x, y) => new TextElm().init$2(x, y),
    TFlipFlopElm: (x, y) => new TFlipFlopElm().init$2(x, y),
    SevenSegDecoderElm: (x, y) => new SevenSegDecoderElm().init$2(x, y),
    FullAdderElm: (x, y) => new FullAdderElm().init$2(x, y),
    HalfAdderElm: (x, y) => new HalfAdderElm().init$2(x, y),
    MonostableElm: (x, y) => new MonostableElm().init$2(x, y),
    LabeledNodeElm: (x, y) => new LabeledNodeElm().init$2(x, y),
    UserDefinedLogicElm: (x, y) => new CustomLogicElm().init$2(x, y),
    CustomLogicElm: (x, y) => new CustomLogicElm().init$2(x, y),
    TestPointElm: (x, y) => new TestPointElm().init$2(x, y),
    AmmeterElm: (x, y) => new AmmeterElm().init$2(x, y),
    DataRecorderElm: (x, y) => new DataRecorderElm().init$2(x, y),
    AudioOutputElm: (x, y) => new AudioOutputElm().init$2(x, y),
    NDarlingtonElm: (x, y) => new NDarlingtonElm().init$2(x, y),
    DarlingtonElm: (x, y) => new NDarlingtonElm().init$2(x, y),
    PDarlingtonElm: (x, y) => new PDarlingtonElm().init$2(x, y),
    ComparatorElm: (x, y) => new ComparatorElm().init$2(x, y),
    OTAElm: (x, y) => new OTAElm().init$2(x, y),
    NoiseElm: (x, y) => new NoiseElm().init$2(x, y),
    VCVSElm: (x, y) => new VCVSElm().init$2(x, y),
    VCCSElm: (x, y) => new VCCSElm().init$2(x, y),
    CCVSElm: (x, y) => new CCVSElm().init$2(x, y),
    CCCSElm: (x, y) => new CCCSElm().init$2(x, y),
    OhmMeterElm: (x, y) => new OhmMeterElm().init$2(x, y),
    LEDArrayElm: (x, y) => new LEDArrayElm().init$2(x, y),
    CustomTransformerElm: (x, y) => new CustomTransformerElm().init$2(x, y),
    OptocouplerElm: (x, y) => new OptocouplerElm().init$2(x, y),
    StopTriggerElm: (x, y) => new StopTriggerElm().init$2(x, y),
    OpAmpRealElm: (x, y) => new OpAmpRealElm().init$2(x, y),
    CustomCompositeElm: (x, y) => new CustomCompositeElm().init$2(x, y),
    AudioInputElm: (x, y) => new AudioInputElm().init$2(x, y),
    CrystalElm: (x, y) => new CrystalElm().init$2(x, y),
    SRAMElm: (x, y) => new SRAMElm().init$2(x, y),
    TimeDelayRelayElm: (x, y) => new TimeDelayRelayElm().init$2(x, y),
    DCMotorElm: (x, y) => new DCMotorElm().init$2(x, y),
    LDRElm: (x, y) => new LDRElm().init$2(x, y),
    ThermistorNTCElm: (x, y) => new ThermistorNTCElm().init$2(x, y),
};
