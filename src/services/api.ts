import {
  Machine,
  PMSchedule,
  MaintenanceLog,
  FactoryKPIs,
  User,
  UserRole,
  ChecklistItem,
} from '../types';
import {
  INITIAL_MACHINES,
  INITIAL_PM_SCHEDULES,
  INITIAL_MAINTENANCE_LOGS,
  INITIAL_USERS,
  LOADER_CHECKLIST_TEMPLATE,
} from '../data/initialData';

const STORAGE_KEYS = {
  MACHINES: 'cmms_machines_v1',
  PM_SCHEDULES: 'cmms_pm_schedules_v1',
  MAINTENANCE_LOGS: 'cmms_logs_v1',
  CURRENT_USER: 'cmms_current_user_v1',
};

// Safe JSON parse from LocalStorage with fallback
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export class CMMSApiService {
  private static machines: Machine[] = loadFromStorage(STORAGE_KEYS.MACHINES, INITIAL_MACHINES);
  private static schedules: PMSchedule[] = loadFromStorage(STORAGE_KEYS.PM_SCHEDULES, INITIAL_PM_SCHEDULES);
  private static logs: MaintenanceLog[] = loadFromStorage(STORAGE_KEYS.MAINTENANCE_LOGS, INITIAL_MAINTENANCE_LOGS);
  private static currentUser: User = loadFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);

  // Current User & RBAC
  static getCurrentUser(): User {
    return this.currentUser;
  }

  static setCurrentUser(user: User): void {
    this.currentUser = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  }

  static getUsers(): User[] {
    return INITIAL_USERS;
  }

  static resetToDefault(): void {
    this.machines = [...INITIAL_MACHINES];
    this.schedules = [...INITIAL_PM_SCHEDULES];
    this.logs = [...INITIAL_MAINTENANCE_LOGS];
    saveToStorage(STORAGE_KEYS.MACHINES, this.machines);
    saveToStorage(STORAGE_KEYS.PM_SCHEDULES, this.schedules);
    saveToStorage(STORAGE_KEYS.MAINTENANCE_LOGS, this.logs);
  }

  // ---------------------------------------------------------------------------
  // Machines CRUD
  // ---------------------------------------------------------------------------
  static async getMachines(): Promise<Machine[]> {
    return [...this.machines];
  }

  static async getMachineById(id: string): Promise<Machine | undefined> {
    return this.machines.find((m) => m.id === id || m.code === id);
  }

  static async createMachine(
    machineData: Omit<Machine, 'id' | 'runningHours' | 'lastPmDate'>
  ): Promise<{ success: boolean; machine?: Machine; error?: string }> {
    // Validation
    if (!machineData.code?.trim() || !machineData.name?.trim()) {
      return { success: false, error: 'กรุณากรอกรหัสเครื่องจักรและชื่อเครื่องจักร' };
    }
    const exists = this.machines.some((m) => m.code.toLowerCase() === machineData.code.trim().toLowerCase());
    if (exists) {
      return { success: false, error: `รหัสเครื่องจักร ${machineData.code} มีอยู่ในระบบแล้ว` };
    }

    const newMachine: Machine = {
      ...machineData,
      id: machineData.code.trim(),
      code: machineData.code.trim(),
      runningHours: 0,
      lastPmDate: null,
      nextPmDate: machineData.nextPmDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    };

    this.machines = [newMachine, ...this.machines];
    saveToStorage(STORAGE_KEYS.MACHINES, this.machines);
    return { success: true, machine: newMachine };
  }

  static async updateMachine(
    id: string,
    updates: Partial<Machine>
  ): Promise<{ success: boolean; machine?: Machine; error?: string }> {
    const idx = this.machines.findIndex((m) => m.id === id || m.code === id);
    if (idx === -1) {
      return { success: false, error: 'ไม่พบเครื่องจักรที่ระบุ' };
    }

    const current = this.machines[idx];

    // If changing to breakdown, log an emergency event
    if (updates.status === 'breakdown' && current.status !== 'breakdown') {
      const breakdownLog: MaintenanceLog = {
        id: `WO-${Date.now().toString().slice(-6)}`,
        machineId: current.id,
        machineCode: current.code,
        machineName: current.name,
        logType: 'breakdown',
        title: `เครื่องจักรชำรุดฉุกเฉิน: ${updates.breakdownReason || 'ระบบตรวจพบความผิดปกติ'}`,
        issueDescription: updates.breakdownReason || 'หยุดการทำงานกะทันหัน',
        actionTaken: 'กำลังรอวิศวกรเข้าตรวจเช็กหน้างาน',
        technicianId: this.currentUser.id,
        technicianName: this.currentUser.fullName,
        laborHours: 0,
        costSpareParts: 0,
        costLabor: 0,
        totalCost: 0,
        sparePartsUsed: [],
        status: 'pending',
        performedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      this.logs = [breakdownLog, ...this.logs];
      saveToStorage(STORAGE_KEYS.MAINTENANCE_LOGS, this.logs);
    }

    this.machines[idx] = { ...current, ...updates };
    saveToStorage(STORAGE_KEYS.MACHINES, this.machines);
    return { success: true, machine: this.machines[idx] };
  }

  static async deleteMachine(id: string): Promise<{ success: boolean; error?: string }> {
    const machine = this.machines.find((m) => m.id === id);
    if (!machine) return { success: false, error: 'ไม่พบเครื่องจักร' };

    // Check if there are active PM schedules
    const hasActiveSchedules = this.schedules.some(
      (s) => s.machineId === id && (s.status === 'scheduled' || s.status === 'in_progress')
    );
    if (hasActiveSchedules) {
      return {
        success: false,
        error: 'ไม่สามารถลบเครื่องจักรที่มีแผน PM หรือใบสั่งงานค้างอยู่ได้ กรุณาปิดใบงานก่อน',
      };
    }

    this.machines = this.machines.filter((m) => m.id !== id);
    saveToStorage(STORAGE_KEYS.MACHINES, this.machines);
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // PM Schedules CRUD & Checklist Operations
  // ---------------------------------------------------------------------------
  static async getPMSchedules(): Promise<PMSchedule[]> {
    return [...this.schedules];
  }

  static async getPMScheduleById(id: string): Promise<PMSchedule | undefined> {
    return this.schedules.find((s) => s.id === id);
  }

  static async createPMSchedule(
    data: Omit<PMSchedule, 'id' | 'createdAt' | 'status' | 'lastPerformedDate'>
  ): Promise<{ success: boolean; schedule?: PMSchedule; error?: string }> {
    // Input Validation: Date must NOT be in the past
    const today = new Date().toISOString().split('T')[0];
    if (data.nextDueDate < today) {
      return {
        success: false,
        error: 'ไม่อนุญาตให้กำหนดวันทำ PM ย้อนหลัง (ต้องเป็นวันที่ปัจจุบันหรือในอนาคต)',
      };
    }

    if (!data.machineId || !data.planName?.trim()) {
      return { success: false, error: 'กรุณาเลือกเครื่องจักรและระบุชื่อแผนงาน PM' };
    }

    const machine = this.machines.find((m) => m.id === data.machineId);
    if (!machine) return { success: false, error: 'เครื่องจักรที่ระบุไม่ถูกต้อง' };

    const newId = `PM-${new Date().getFullYear()}-${String(this.schedules.length + 1).padStart(3, '0')}`;
    const newSchedule: PMSchedule = {
      ...data,
      id: newId,
      machineCode: machine.code,
      machineName: machine.name,
      machineModel: machine.model,
      lineOperation: machine.lineOperation,
      status: 'scheduled',
      lastPerformedDate: null,
      createdAt: today,
      checklistItems: data.checklistItems?.length ? data.checklistItems : LOADER_CHECKLIST_TEMPLATE,
    };

    this.schedules = [newSchedule, ...this.schedules];
    saveToStorage(STORAGE_KEYS.PM_SCHEDULES, this.schedules);
    return { success: true, schedule: newSchedule };
  }

  /**
   * Complete PM Task & Update Machine Status
   */
  static async completePMTask(
    scheduleId: string,
    payload: {
      completionNotes: string;
      verifiedByName: string;
      approvedByName: string;
      updatedChecklist: ChecklistItem[];
      laborHours: number;
      costSpareParts: number;
      costLabor: number;
      sparePartsUsed: Array<{ partName: string; partNo: string; quantity: number; unitCost: number }>;
    }
  ): Promise<{ success: boolean; schedule?: PMSchedule; error?: string }> {
    const idx = this.schedules.findIndex((s) => s.id === scheduleId);
    if (idx === -1) return { success: false, error: 'ไม่พบตารางงาน PM ที่ระบุ' };

    const currentSchedule = this.schedules[idx];
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Validate costs
    if (payload.laborHours < 0 || payload.costSpareParts < 0 || payload.costLabor < 0) {
      return { success: false, error: 'ค่าใช้จ่ายและชั่วโมงแรงงานต้องไม่เป็นค่าติดลบ' };
    }

    // 1. Update PM Schedule to Completed
    const updatedSchedule: PMSchedule = {
      ...currentSchedule,
      status: 'completed',
      lastPerformedDate: today,
      completedAt: nowTime,
      completionNotes: payload.completionNotes,
      verifiedByName: payload.verifiedByName,
      approvedByName: payload.approvedByName,
      checklistItems: payload.updatedChecklist,
    };
    this.schedules[idx] = updatedSchedule;
    saveToStorage(STORAGE_KEYS.PM_SCHEDULES, this.schedules);

    // 2. Automatically create Maintenance Log Work Order
    const totalCost = Number(payload.costSpareParts || 0) + Number(payload.costLabor || 0);
    const newLog: MaintenanceLog = {
      id: `WO-${Date.now().toString().slice(-6)}`,
      machineId: currentSchedule.machineId,
      machineCode: currentSchedule.machineCode,
      machineName: currentSchedule.machineName,
      pmScheduleId: scheduleId,
      logType: 'preventive',
      title: `บันทึกปิดใบงาน PM: ${currentSchedule.planName}`,
      issueDescription: `การตรวจเช็กตามแบบฟอร์ม Checklist (${currentSchedule.frequency})`,
      actionTaken: payload.completionNotes || 'ทำการตรวจเช็ก ทำความสะอาด หล่อลื่น และทดสอบฟังก์ชันตามมาตรฐานโรงงาน',
      technicianId: this.currentUser.id,
      technicianName: payload.verifiedByName || this.currentUser.fullName,
      laborHours: payload.laborHours || 1.5,
      costSpareParts: payload.costSpareParts || 0,
      costLabor: payload.costLabor || 0,
      totalCost,
      sparePartsUsed: payload.sparePartsUsed || [],
      status: 'completed',
      performedDate: today,
      createdAt: nowTime,
    };
    this.logs = [newLog, ...this.logs];
    saveToStorage(STORAGE_KEYS.MAINTENANCE_LOGS, this.logs);

    // 3. Update machine status: if it was in maintenance, bring it to active and bump next PM
    const machineIdx = this.machines.findIndex((m) => m.id === currentSchedule.machineId);
    if (machineIdx !== -1) {
      const m = this.machines[machineIdx];
      // calculate next date based on frequency
      let daysToAdd = 30;
      if (currentSchedule.frequency === 'daily') daysToAdd = 1;
      else if (currentSchedule.frequency === 'weekly') daysToAdd = 7;
      else if (currentSchedule.frequency === 'quarterly') daysToAdd = 90;
      else if (currentSchedule.frequency === 'yearly') daysToAdd = 365;

      const nextDate = new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];

      this.machines[machineIdx] = {
        ...m,
        status: m.status === 'maintenance' ? 'active' : m.status,
        lastPmDate: today,
        nextPmDate: nextDate,
        runningHours: m.runningHours + 24,
      };
      saveToStorage(STORAGE_KEYS.MACHINES, this.machines);
    }

    return { success: true, schedule: updatedSchedule };
  }

  // ---------------------------------------------------------------------------
  // Maintenance Logs CRUD
  // ---------------------------------------------------------------------------
  static async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
    return [...this.logs];
  }

  static async createMaintenanceLog(
    logData: Omit<MaintenanceLog, 'id' | 'createdAt' | 'totalCost'>
  ): Promise<{ success: boolean; log?: MaintenanceLog; error?: string }> {
    // Validation: no negative values
    if (logData.laborHours < 0) {
      return { success: false, error: 'ชั่วโมงแรงงานต้องไม่เป็นค่าติดลบ' };
    }
    if (logData.costSpareParts < 0 || logData.costLabor < 0) {
      return { success: false, error: 'ค่าอะไหล่และค่าแรงต้องไม่เป็นค่าติดลบ' };
    }
    if (!logData.machineId || !logData.title?.trim()) {
      return { success: false, error: 'กรุณาระบุเครื่องจักรและหัวข้องานซ่อม' };
    }

    const machine = this.machines.find((m) => m.id === logData.machineId);
    if (!machine) return { success: false, error: 'ไม่พบข้อมูลเครื่องจักร' };

    const totalCost = Number(logData.costSpareParts || 0) + Number(logData.costLabor || 0);
    const newLog: MaintenanceLog = {
      ...logData,
      id: `WO-${Date.now().toString().slice(-6)}`,
      machineCode: machine.code,
      machineName: machine.name,
      totalCost,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    // If log is breakdown & in_progress, update machine status to breakdown
    if (logData.logType === 'breakdown' && logData.status !== 'completed') {
      const mIdx = this.machines.findIndex((m) => m.id === machine.id);
      if (mIdx !== -1) {
        this.machines[mIdx].status = 'breakdown';
        this.machines[mIdx].breakdownReason = logData.issueDescription;
        this.machines[mIdx].breakdownSince = newLog.createdAt;
        saveToStorage(STORAGE_KEYS.MACHINES, this.machines);
      }
    } else if (logData.status === 'completed' && machine.status === 'breakdown') {
      // If closing breakdown log, restore machine to active
      const mIdx = this.machines.findIndex((m) => m.id === machine.id);
      if (mIdx !== -1) {
        this.machines[mIdx].status = 'active';
        this.machines[mIdx].breakdownReason = undefined;
        saveToStorage(STORAGE_KEYS.MACHINES, this.machines);
      }
    }

    this.logs = [newLog, ...this.logs];
    saveToStorage(STORAGE_KEYS.MAINTENANCE_LOGS, this.logs);
    return { success: true, log: newLog };
  }

  // ---------------------------------------------------------------------------
  // KPI Calculations
  // ---------------------------------------------------------------------------
  static async getKPIs(): Promise<FactoryKPIs> {
    const total = this.machines.length;
    const active = this.machines.filter((m) => m.status === 'active').length;
    const maintenance = this.machines.filter((m) => m.status === 'maintenance').length;
    const breakdown = this.machines.filter((m) => m.status === 'breakdown').length;

    // Availability Rate = (Active + 0.5 * Maintenance) / Total * 100
    const availabilityRate = total > 0 ? Number((((active + maintenance * 0.5) / total) * 100).toFixed(1)) : 100;

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const upcomingPmCount = this.schedules.filter(
      (s) => s.status === 'scheduled' && s.nextDueDate >= today && s.nextDueDate <= sevenDaysLater
    ).length;

    const overduePmCount = this.schedules.filter(
      (s) => s.status === 'overdue' || (s.status === 'scheduled' && s.nextDueDate < today)
    ).length;

    const completedPmThisMonth = this.schedules.filter(
      (s) => s.status === 'completed' && s.lastPerformedDate && s.lastPerformedDate.startsWith(today.slice(0, 7))
    ).length;

    const totalMaintenanceCostMonth = this.logs
      .filter((l) => l.performedDate.startsWith(today.slice(0, 7)))
      .reduce((sum, l) => sum + (l.totalCost || 0), 0);

    const totalScheduledOrDone = this.schedules.length;
    const pmComplianceRate =
      totalScheduledOrDone > 0
        ? Number((((totalScheduledOrDone - overduePmCount) / totalScheduledOrDone) * 100).toFixed(1))
        : 100;

    return {
      totalMachines: total,
      activeMachines: active,
      maintenanceMachines: maintenance,
      breakdownMachines: breakdown,
      availabilityRate,
      mtbfHours: 420.5,
      mttrHours: 2.4,
      upcomingPmCount,
      overduePmCount,
      completedPmThisMonth,
      totalMaintenanceCostMonth,
      pmComplianceRate,
    };
  }
}
