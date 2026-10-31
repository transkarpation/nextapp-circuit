// based on https://ctms.engin.umich.edu/CTMS/index.php?example=MotorPosition&section=SystemModeling

// Changed 2026-10-31: converted from DCMotorElm.java to TypeScript.
/* eslint-disable */
import { CirSim, CircuitElm, Color, EditInfo, Graphics, Inductor, Point, StringTokenizer, boolOp, newArray, parseJDouble, toInt } from '../core/internal';

export class DCMotorElm extends CircuitElm {
    declare ind: Inductor;
    declare indInertia: Inductor;
    // Electrical parameters
    declare resistance: number;
    declare inductance: number;
    // Electro-mechanical parameters
    declare K: number;
    declare Kb: number;
    declare J: number;
    declare b: number;
    declare gearRatio: number;
    declare tau: number;
    //tau reserved for static friction parameterization
    declare angle: number;
    declare speed: number;
    declare coilCurrent: number;
    declare inertiaCurrent: number;
    declare voltSources: number[];
    init$2(xx: number, yy: number): this {
        CircuitElm.prototype.init$2.call(this, xx, yy);
        this.voltSources = newArray(0, 2);
        this.ind = new Inductor().init$1(CircuitElm.sim);
        this.indInertia = new Inductor().init$1(CircuitElm.sim);
        this.inductance = .5;
        this.resistance = 1;
        this.angle = CircuitElm.pi / 2;
        this.speed = 0;
        this.K = 0.15;
        this.b = 0.05;
        this.J = 0.02;
        this.Kb = 0.15;
        this.gearRatio = 1;
        this.tau = 0;
        this.ind.setup(this.inductance, 0, Inductor.FLAG_BACK_EULER);
        this.indInertia.setup(this.J, 0, Inductor.FLAG_BACK_EULER);
        return this;
    }
    init$6(xa: number, ya: number, xb: number, yb: number, f: number, st: StringTokenizer): this {
        CircuitElm.prototype.init$5.call(this, xa, ya, xb, yb, f);
        this.voltSources = newArray(0, 2);
        this.angle = CircuitElm.pi / 2;
        this.speed = 0;
        //read:
        // inductance; resistance, K, Kb, J, b, gearRatio, tau
        this.inductance = parseJDouble(st.nextToken$0());
        this.resistance = parseJDouble(st.nextToken$0());
        this.K = parseJDouble(st.nextToken$0());
        this.Kb = parseJDouble(st.nextToken$0());
        this.J = parseJDouble(st.nextToken$0());
        this.b = parseJDouble(st.nextToken$0());
        this.gearRatio = parseJDouble(st.nextToken$0());
        this.tau = parseJDouble(st.nextToken$0());
        this.ind = new Inductor().init$1(CircuitElm.sim);
        this.indInertia = new Inductor().init$1(CircuitElm.sim);
        this.ind.setup(this.inductance, 0, Inductor.FLAG_BACK_EULER);
        this.indInertia.setup(this.J, 0, Inductor.FLAG_BACK_EULER);
        return this;
    }
    getDumpType(): number {
        return 415;
    }
    dump(): string {
        // dump: inductance; resistance, K, Kb, J, b, gearRatio, tau
        return super.dump() + " " + this.inductance + " " + this.resistance + " " + this.K + " " + this.Kb + " " + this.J + " " + this.b + " " + this.gearRatio + " " + this.tau;
    }
    getAngle(): number {
        return (this.angle);
    }
    declare motorCenter: Point;
    setPoints(): void {
        super.setPoints();
        this.calcLeads(36);
        this.motorCenter = this.interpPoint$3(this.point1, this.point2, .5);
        this.allocNodes();
    }
    getPostCount(): number {
        return 2;
    }
    getInternalNodeCount(): number {
        return 4;
    }
    getVoltageSourceCount(): number {
        return 2;
    }
    setVoltageSource(n: number, v: number): void {
        this.voltSources[n] = v;
    }
    reset(): void {
        super.reset();
        this.ind.reset();
        this.indInertia.reset();
        this.coilCurrent = 0;
        this.inertiaCurrent = 0;
    }
    stamp(): void {
        // stamp a bunch of internal parts to help us simulate the motor.  It would be better to simulate this mini-circuit in code to reduce
        // the size of the matrix.
        //nodes[0] nodes [1] are the external nodes
        //Electrical part:
        // inductor from motor nodes[0] to internal nodes[2]
        this.ind.stamp(this.nodes[0], this.nodes[2]);
        // resistor from internal nodes[2] to internal nodes[3] // motor post 2
        CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[3], this.resistance);
        // Back emf voltage source from internal nodes[3] to external nodes [1]
        CircuitElm.sim.stampVoltageSource(this.nodes[3], this.nodes[1], this.voltSources[0]);
        //
        //Mechanical part:
        // inertia inductor from internal nodes[4] to internal nodes[5]
        this.indInertia.stamp(this.nodes[4], this.nodes[5]);
        // resistor from  internal nodes[5] to  ground
        CircuitElm.sim.stampResistor(this.nodes[5], 0, this.b);
        // Voltage Source from  internal nodes[4] to ground
        //System.out.println("doing stamp voltage");
        CircuitElm.sim.stampVoltageSource(this.nodes[4], 0, this.voltSources[1]);
        //System.out.println("doing stamp voltage "+voltSource);
    }
    startIteration(): void {
        this.ind.startIteration(this.volts[0] - this.volts[2]);
        this.indInertia.startIteration(this.volts[4] - this.volts[5]);
        // update angle:
        this.angle = this.angle + this.speed * CircuitElm.sim.timeStep;
    }
    /*  boolean hasGroundConnection(int n1) {
	if (n1==4|n1==5) return true;
	else return false;
    }
    boolean getConnection(int n1, int n2) { 
	if((n1==0&n2==2)|(n1==2&n2==3)|(n1==1&n2==3)|(n1==4&n2==5))
	    return true;
	else
	    return false;
    }
     */
    doStep(): void {
        CircuitElm.sim.updateVoltageSource(this.nodes[4], 0, this.voltSources[1], this.coilCurrent * this.K);
        CircuitElm.sim.updateVoltageSource(this.nodes[3], this.nodes[1], this.voltSources[0], this.inertiaCurrent * this.Kb);
        this.ind.doStep(this.volts[0] - this.volts[2]);
        this.indInertia.doStep(this.volts[4] - this.volts[5]);
    }
    calculateCurrent(): void {
        this.coilCurrent = this.ind.calculateCurrent(this.volts[0] - this.volts[2]);
        this.inertiaCurrent = this.indInertia.calculateCurrent(this.volts[4] - this.volts[5]);
        //	current = (volts[2]-volts[3])/resistance;
        this.speed = this.inertiaCurrent;
    }
    //    public double getCurrent() { current = (volts[2]-volts[3])/resistance; return current; }
    setCurrent(vn: number, c: number): void {
        if (vn === this.voltSources[0]) {
            this.current = c;
        }
    }
    draw(g: Graphics): void {
        let cr: number = 18;
        let hs: number = 8;
        this.setBbox$3(this.point1, this.point2, cr);
        this.draw2Leads(g);
        //getCurrent();
        this.doDots(g);
        this.setPowerColor$Graphics_bool(g, true);
        let cc: Color = new Color().init$int_int_int((165), (165), (165));
        g.setColor(cc);
        g.fillOval(this.motorCenter.x - (cr), this.motorCenter.y - (cr), (cr) * 2, (cr) * 2);
        cc = new Color().init$int_int_int((10), (10), (10));
        g.setColor(cc);
        let angleAux: number = Math.round(this.angle * 300.0) / 300.0;
        g.fillOval(this.motorCenter.x - toInt((cr / 2.2)), this.motorCenter.y - toInt((cr / 2.2)), toInt((2 * cr / 2.2)), toInt((2 * cr / 2.2)));
        g.setColor(cc);
        this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps1, 0.5 + .28 * Math.cos(angleAux * this.gearRatio), .28 * Math.sin(angleAux * this.gearRatio));
        this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps2, 0.5 - .28 * Math.cos(angleAux * this.gearRatio), -.28 * Math.sin(angleAux * this.gearRatio));
        DCMotorElm.drawThickerLine(g, CircuitElm.ps1, CircuitElm.ps2);
        this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps1, 0.5 + .28 * Math.cos(angleAux * this.gearRatio + CircuitElm.pi / 3), .28 * Math.sin(angleAux * this.gearRatio + CircuitElm.pi / 3));
        this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps2, 0.5 - .28 * Math.cos(angleAux * this.gearRatio + CircuitElm.pi / 3), -.28 * Math.sin(angleAux * this.gearRatio + CircuitElm.pi / 3));
        DCMotorElm.drawThickerLine(g, CircuitElm.ps1, CircuitElm.ps2);
        this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps1, 0.5 + .28 * Math.cos(angleAux * this.gearRatio + 2 * CircuitElm.pi / 3), .28 * Math.sin(angleAux * this.gearRatio + 2 * CircuitElm.pi / 3));
        this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps2, 0.5 - .28 * Math.cos(angleAux * this.gearRatio + 2 * CircuitElm.pi / 3), -.28 * Math.sin(angleAux * this.gearRatio + 2 * CircuitElm.pi / 3));
        DCMotorElm.drawThickerLine(g, CircuitElm.ps1, CircuitElm.ps2);
        this.drawPosts(g);
    }
    static drawThickerLine(g: Graphics, pa: Point, pb: Point): void {
        g.setLineWidth(6.0);
        g.drawLine(pa.x, pa.y, pb.x, pb.y);
        g.setLineWidth(1.0);
    }
    interpPointFix(a: Point, b: Point, c: Point, f: number, g: number): void {
        let gx: number = b.y - a.y;
        let gy: number = a.x - b.x;
        c.x = (Math.round(a.x * (1 - f) + b.x * f + g * gx) | 0);
        c.y = (Math.round(a.y * (1 - f) + b.y * f + g * gy) | 0);
    }
    getInfo(arr: string[]): void {
        arr[0] = "DC Motor";
        this.getBasicInfo(arr);
        arr[3] = CirSim.LS("speed") + " = " + CircuitElm.getUnitText$2(60 * Math.abs(this.speed) / (2 * Math.PI), CirSim.LS("RPM"));
        arr[4] = "L = " + CircuitElm.getUnitText$2(this.inductance, "H");
        arr[5] = "R = " + CircuitElm.getUnitText$2(this.resistance, CirSim.ohmString);
        arr[6] = "P = " + CircuitElm.getUnitText$2(this.getPower(), "W");
    }
    getEditInfo(n: number): EditInfo {
        if (n === 0) {
            return new EditInfo("Armature inductance (H)", this.inductance, 0, 0);
        }
        if (n === 1) {
            return new EditInfo("Armature Resistance (ohms)", this.resistance, 0, 0);
        }
        if (n === 2) {
            return new EditInfo("Torque constant (Nm/A)", this.K, 0, 0);
        }
        if (n === 3) {
            return new EditInfo("Back emf constant (Vs/rad)", this.Kb, 0, 0);
        }
        if (n === 4) {
            return new EditInfo("Moment of inertia (Kg.m^2", this.J, 0, 0);
        }
        if (n === 5) {
            return new EditInfo("Friction coefficient (Nms/rad)", this.b, 0, 0);
        }
        if (n === 6) {
            return new EditInfo("Gear Ratio", this.gearRatio, 0, 0);
        }
        return null;
    }
    setEditValue(n: number, ei: EditInfo): void {
        if (boolOp('&', ei.value > 0, n === 0)) {
            this.inductance = ei.value;
            this.ind.setup(this.inductance, this.current, Inductor.FLAG_BACK_EULER);
        }
        if (boolOp('&', ei.value > 0, n === 1)) {
            this.resistance = ei.value;
        }
        if (boolOp('&', ei.value > 0, n === 2)) {
            this.K = ei.value;
        }
        if (boolOp('&', ei.value > 0, n === 3)) {
            this.Kb = ei.value;
        }
        if (boolOp('&', ei.value > 0, n === 4)) {
            this.J = ei.value;
            this.indInertia.setup(this.J, this.inertiaCurrent, Inductor.FLAG_BACK_EULER);
        }
        if (boolOp('&', ei.value > 0, n === 5)) {
            this.b = ei.value;
        }
        if (boolOp('&', ei.value > 0, n === 6)) {
            this.gearRatio = ei.value;
        }
    }
}
Object.assign(DCMotorElm.prototype, { "ind": null, "indInertia": null, "resistance": 0, "inductance": 0, "K": 0, "Kb": 0, "J": 0, "b": 0, "gearRatio": 0, "tau": 0, "angle": 0, "speed": 0, "coilCurrent": 0, "inertiaCurrent": 0, "voltSources": null, "motorCenter": null });
