// Groups for the "add element" list, following the menus of the GWT version.  Elements not named
// here still appear, under Other, so a newly generated element is never hidden.
const GROUPS: [string, string[]][] = [
    ['Basic', ['WireElm', 'GroundElm', 'ResistorElm', 'CapacitorElm', 'PolarCapacitorElm', 'InductorElm', 'SwitchElm', 'PushSwitchElm', 'Switch2Elm', 'MBBSwitchElm', 'PotElm', 'TransformerElm', 'TappedTransformerElm', 'CustomTransformerElm', 'TransLineElm', 'RelayElm', 'MemristorElm', 'SparkGapElm', 'FuseElm', 'CrystalElm', 'DCMotorElm', 'LampElm', 'LDRElm', 'ThermistorNTCElm']],
    ['Sources', ['VoltageElm', 'DCVoltageElm', 'ACVoltageElm', 'SquareRailElm', 'RailElm', 'ACRailElm', 'VarRailElm', 'ClockElm', 'CurrentElm', 'AntennaElm', 'SweepElm', 'AMElm', 'FMElm', 'NoiseElm']],
    ['Semiconductors', ['DiodeElm', 'ZenerElm', 'LEDElm', 'LEDArrayElm', 'VaractorElm', 'TunnelDiodeElm', 'NTransistorElm', 'PTransistorElm', 'TransistorElm', 'DarlingtonElm', 'NDarlingtonElm', 'PDarlingtonElm', 'NMosfetElm', 'PMosfetElm', 'MosfetElm', 'NJfetElm', 'PJfetElm', 'JfetElm', 'SCRElm', 'DiacElm', 'TriacElm', 'TriodeElm', 'OptocouplerElm']],
    ['Analog', ['OpAmpElm', 'OpAmpSwapElm', 'OpAmpRealElm', 'ComparatorElm', 'OTAElm', 'VCOElm', 'VCVSElm', 'VCCSElm', 'CCVSElm', 'CCCSElm', 'AnalogSwitchElm', 'AnalogSwitch2Elm', 'TimerElm', 'PhaseCompElm', 'CC2Elm', 'CC2NegElm', 'TimeDelayRelayElm']],
    ['Logic', ['LogicInputElm', 'LogicOutputElm', 'InverterElm', 'AndGateElm', 'NandGateElm', 'OrGateElm', 'NorGateElm', 'XorGateElm', 'SchmittElm', 'InvertingSchmittElm', 'TriStateElm', 'DFlipFlopElm', 'JKFlipFlopElm', 'TFlipFlopElm', 'LatchElm', 'MultiplexerElm', 'DeMultiplexerElm', 'CounterElm', 'DecadeElm', 'RingCounterElm', 'SipoShiftElm', 'PisoShiftElm', 'SevenSegElm', 'SevenSegDecoderElm', 'FullAdderElm', 'HalfAdderElm', 'MonostableElm', 'SeqGenElm', 'SRAMElm', 'DACElm', 'ADCElm', 'CustomLogicElm', 'UserDefinedLogicElm', 'CustomCompositeElm']],
    ['Instruments', ['OutputElm', 'ProbeElm', 'AmmeterElm', 'OhmMeterElm', 'TestPointElm', 'DataRecorderElm', 'AudioOutputElm', 'AudioInputElm', 'ScopeElm', 'StopTriggerElm', 'LabeledNodeElm']],
    ['Graphics', ['TextElm', 'BoxElm']],
];

export function paletteGroups(available: string[]): [string, string[]][] {
    const left = new Set(available);
    const out: [string, string[]][] = [];
    for (const [title, names] of GROUPS) {
        const present = names.filter((n) => left.delete(n));
        if (present.length) out.push([title, present]);
    }
    if (left.size) out.push(['Other', [...left].sort()]);
    return out;
}
