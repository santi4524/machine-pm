export type MachineStatus = 'active' | 'maintenance' | 'breakdown';
export type CriticalLevel = 'critical' | 'high' | 'medium' | 'low';
export type PMFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PMScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';
export type MaintenanceLogType = 'preventive' | 'corrective' | 'breakdown';
export type UserRole = 'admin' | 'manager' | 'technician' | 'engineer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
}

export interface Machine {
  id: string;
  code: string; // e.g. MC-SMT-001
  name: string; // e.g. SMT PCB LOADER
  model: string; // e.g. ESL-500
  serialNumber: string; // e.g. L21020301024E
  lineOperation: string; // e.g. SMT LINE # 2
  department: string; // e.g. SMT Assembly
  status: MachineStatus;
  criticalLevel: CriticalLevel;
  installDate: string;
  location: string;
  runningHours: number;
  lastPmDate: string | null;
  nextPmDate: string;
  powerRatingKw?: number;
  specNotes?: string;
  breakdownReason?: string;
  breakdownSince?: string;
}

export interface ChecklistItem {
  id: string;
  section: string; // หน่วยที่ต้องตรวจสอบ เช่น "ภายนอกเครื่องจักร", "ความปลอดภัย", "แหล่งจ่ายลม", "แกนสไลด์"
  componentName: string; // รายการชิ้นส่วน
  spec: string; // มาตรฐานการตรวจสอบ เช่น "สะอาด", "เครื่องหยุด", "4-6 Kgf/cm^2"
  methods: {
    clean: boolean; // C = ทำความสะอาด
    lubricate: boolean; // L = หล่อลื่น
    inspect: boolean; // I = ตรวจสอบ
    functional: boolean; // F = หน้าที่การทำงาน
  };
  lubricant?: string; // e.g. LCG100
  interval: string; // e.g. 1D, 1W, 1M, 3M, 1Y
  result?: 'OK' | 'NG' | 'APPLIED' | 'NONE';
  remark?: string;
  checkedAt?: string;
}

export interface PMSchedule {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  machineModel: string;
  lineOperation: string;
  planName: string; // e.g. Monthly PM - SMT Loader Calibration
  frequency: PMFrequency;
  nextDueDate: string;
  lastPerformedDate: string | null;
  status: PMScheduleStatus;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  checklistItems: ChecklistItem[];
  verifiedByName?: string;
  approvedByName?: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SparePartUsed {
  partName: string;
  partNo: string;
  quantity: number;
  unitCost: number;
}

export interface MaintenanceLog {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  pmScheduleId?: string;
  logType: MaintenanceLogType;
  title: string;
  issueDescription: string;
  actionTaken: string;
  rootCause?: string;
  technicianId: string;
  technicianName: string;
  laborHours: number;
  costSpareParts: number;
  costLabor: number;
  totalCost: number;
  sparePartsUsed: SparePartUsed[];
  status: 'pending' | 'in_progress' | 'completed';
  performedDate: string;
  createdAt: string;
}

export interface FactoryKPIs {
  totalMachines: number;
  activeMachines: number;
  maintenanceMachines: number;
  breakdownMachines: number;
  availabilityRate: number; // Percentage 0-100
  mtbfHours: number; // Mean Time Between Failures
  mttrHours: number; // Mean Time To Repair
  upcomingPmCount: number; // PMs due in <= 7 days
  overduePmCount: number;
  completedPmThisMonth: number;
  totalMaintenanceCostMonth: number;
  pmComplianceRate: number; // % of on-time PMs
}
