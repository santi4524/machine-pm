import React, { useState, useEffect } from 'react';
import { CMMSApiService } from './services/api';
import {
  Machine,
  PMSchedule,
  MaintenanceLog,
  FactoryKPIs,
  User,
  UserRole,
  ChecklistItem,
} from './types';
import { DashboardView } from './components/DashboardView';
import { MachineRegistryView } from './components/MachineRegistryView';
import { PMSchedulerView } from './components/PMSchedulerView';
import { MaintenanceLogsView } from './components/MaintenanceLogsView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { PMInspectionModal } from './components/PMInspectionModal';
import { MachineHistoryModal } from './components/MachineHistoryModal';
import { MachineFormModal } from './components/MachineFormModal';
import { ReportBreakdownModal } from './components/ReportBreakdownModal';
import { CreatePMScheduleModal } from './components/CreatePMScheduleModal';
import { AddWorkOrderModal } from './components/AddWorkOrderModal';
import {
  Activity,
  Cpu,
  Calendar,
  Wrench,
  Database,
  Flame,
  UserCheck,
  RotateCcw,
  Bell,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'machines' | 'pm' | 'logs' | 'database'>('dashboard');

  const [machines, setMachines] = useState<Machine[]>([]);
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [kpis, setKpis] = useState<FactoryKPIs | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(CMMSApiService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(CMMSApiService.getUsers());

  // Modals state
  const [inspectionSchedule, setInspectionSchedule] = useState<PMSchedule | null>(null);
  const [selectedMachineHistory, setSelectedMachineHistory] = useState<Machine | null>(null);
  const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null);
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [isReportingBreakdown, setIsReportingBreakdown] = useState(false);
  const [breakdownTargetMachineId, setBreakdownTargetMachineId] = useState<string | undefined>();
  const [isCreatingPMSchedule, setIsCreatingPMSchedule] = useState(false);
  const [isAddingWorkOrder, setIsAddingWorkOrder] = useState(false);

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    const [fetchedMachines, fetchedSchedules, fetchedLogs, fetchedKpis] = await Promise.all([
      CMMSApiService.getMachines(),
      CMMSApiService.getPMSchedules(),
      CMMSApiService.getMaintenanceLogs(),
      CMMSApiService.getKPIs(),
    ]);

    setMachines(fetchedMachines);
    setSchedules(fetchedSchedules);
    setLogs(fetchedLogs);
    setKpis(fetchedKpis);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Role Switcher Handler
  const handleRoleChange = (role: UserRole) => {
    const targetUser = users.find((u) => u.role === role) || {
      id: `USR-${role}`,
      username: `${role}.demo`,
      fullName: role === 'manager' ? 'สมชาย มั่นคง (Manager)' : role === 'admin' ? 'System Administrator' : 'วิชัย ช่างทอง (Technician)',
      email: `${role}@factory-tech.co.th`,
      role,
      department: 'Maintenance Dept',
    };
    CMMSApiService.setCurrentUser(targetUser);
    setCurrentUser(targetUser);
    showToast(`เปลี่ยนบทบาทเป็น: ${targetUser.role.toUpperCase()} (${targetUser.fullName.split(' ')[0]})`);
  };

  // Reset demo data
  const handleResetData = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลเครื่องจักรและงาน PM กลับเป็นค่าเริ่มต้นของโรงงานหรือไม่?')) {
      CMMSApiService.resetToDefault();
      loadData();
      showToast('รีเซ็ตข้อมูลเป็นค่าโรงงานเรียบร้อย');
    }
  };

  // Complete PM Task Callback
  const handleCompletePM = async (payload: {
    completionNotes: string;
    verifiedByName: string;
    approvedByName: string;
    updatedChecklist: ChecklistItem[];
    laborHours: number;
    costSpareParts: number;
    costLabor: number;
    sparePartsUsed: Array<{ partName: string; partNo: string; quantity: number; unitCost: number }>;
  }) => {
    if (!inspectionSchedule) return;
    const res = await CMMSApiService.completePMTask(inspectionSchedule.id, payload);
    if (res.success) {
      showToast(`บันทึกปิดใบงาน PM ${inspectionSchedule.id} และอัปเดตเครื่องจักรเรียบร้อย`);
      await loadData();
    } else {
      throw new Error(res.error || 'Failed to complete PM task');
    }
  };

  // Save Machine Callback (Create or Edit)
  const handleSaveMachine = async (data: Omit<Machine, 'id' | 'runningHours' | 'lastPmDate'>) => {
    if (machineToEdit) {
      const res = await CMMSApiService.updateMachine(machineToEdit.id, data);
      if (!res.success) throw new Error(res.error);
      showToast(`อัปเดตข้อมูลเครื่องจักร ${data.code} เรียบร้อย`);
    } else {
      const res = await CMMSApiService.createMachine(data);
      if (!res.success) throw new Error(res.error);
      showToast(`ลงทะเบียนเครื่องจักรใหม่ ${data.code} สำเร็จ`);
    }
    await loadData();
    setMachineToEdit(null);
    setIsAddingMachine(false);
  };

  // Delete Machine Callback
  const handleDeleteMachine = async (machineId: string) => {
    if (confirm(`ยืนยันการลบเครื่องจักร ${machineId} หรือไม่?`)) {
      const res = await CMMSApiService.deleteMachine(machineId);
      if (res.success) {
        showToast('ลบข้อมูลเครื่องจักรเรียบร้อย');
        await loadData();
      } else {
        alert(res.error);
      }
    }
  };

  // Submit Breakdown Alert Callback
  const handleReportBreakdown = async (machineId: string, breakdownReason: string, urgency: string) => {
    const res = await CMMSApiService.updateMachine(machineId, {
      status: 'breakdown',
      breakdownReason,
      breakdownSince: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });
    if (res.success) {
      showToast('ส่งสัญญาณแจ้งเหตุเครื่องชำรุดฉุกเฉินเรียบร้อย ทีมช่างได้รับแจ้งเตือน');
      await loadData();
    } else {
      throw new Error(res.error);
    }
  };

  // Create PM Schedule Callback
  const handleCreatePMSchedule = async (data: any) => {
    const res = await CMMSApiService.createPMSchedule(data);
    if (res.success) {
      showToast(`สร้างแผนงาน PM ${res.schedule?.id} เรียบร้อย`);
      await loadData();
    } else {
      throw new Error(res.error);
    }
  };

  // Create Work Order Callback
  const handleCreateWorkOrder = async (data: any) => {
    const res = await CMMSApiService.createMaintenanceLog(data);
    if (res.success) {
      showToast(`บันทึกใบงาน ${res.log?.id} เรียบร้อย`);
      await loadData();
    } else {
      throw new Error(res.error);
    }
  };

  const breakdownCount = machines.filter((m) => m.status === 'breakdown').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/80 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar adhering to the Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap hover:text-white transition-colors"
          >
            PRECISION CMMS
          </a>

          {/* Zone 2: 4-6 text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              แดชบอร์ด (Dashboard)
            </button>
            <button
              onClick={() => setActiveTab('machines')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'machines'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              ทะเบียนเครื่องจักร (Machines)
            </button>
            <button
              onClick={() => setActiveTab('pm')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'pm'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              แผนบำรุงรักษา (PM Schedule)
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              ประวัติการซ่อม (Work Orders)
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'database'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              PHP Backend & MySQL
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions (Breakdown Alert & Role Switcher) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Emergency Report Button */}
            <button
              onClick={() => {
                setBreakdownTargetMachineId(undefined);
                setIsReportingBreakdown(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
              title="แจ้งเหตุเครื่องจักรชำรุดกะทันหัน"
            >
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">แจ้งเครื่องเสีย</span>
              <span className="sm:hidden">แจ้งซ่อม</span>
              {breakdownCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-red-950 rounded text-[10px] font-mono">
                  {breakdownCount}
                </span>
              )}
            </button>

            {/* RBAC Role Selector Dropdown */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-[11px] text-slate-400 hidden lg:inline px-1.5 font-medium">
                สิทธิ์:
              </span>
              <button
                onClick={() => handleRoleChange('manager')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  currentUser.role === 'manager' || currentUser.role === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="สิทธิ์ผู้จัดการ: เพิ่ม/แก้เครื่องจักร, อนุมัติ PM"
              >
                Manager
              </button>
              <button
                onClick={() => handleRoleChange('technician')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  currentUser.role === 'technician' || currentUser.role === 'engineer'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="สิทธิ์ช่างเทคนิค: บันทึก Checklist, ปิดใบงาน"
              >
                Technician
              </button>
            </div>

            {/* Reset Factory Seed */}
            <button
              onClick={handleResetData}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="รีเซ็ตข้อมูลโรงงานเริ่มต้น"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row (under header on small screens) */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-800/80 px-4 py-2 overflow-x-auto text-xs bg-slate-950">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            แดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('machines')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'machines' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            เครื่องจักร
          </button>
          <button
            onClick={() => setActiveTab('pm')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'pm' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            แผน PM
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'logs' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            ประวัติซ่อม
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'database' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            PHP & MySQL
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* User Context & Line Kicker Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              ระบบบริหารจัดการเครื่องจักร & การบำรุงรักษาเชิงป้องกัน (CMMS/EAM)
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-400 font-mono">SMT LINE # 2 & PRECISION FABRICATION</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>เข้าสู่ระบบโดย:</span>
            <span className="text-slate-200 font-semibold">{currentUser.fullName}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                currentUser.role === 'manager' || currentUser.role === 'admin'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* View Routing */}
        {activeTab === 'dashboard' && kpis && (
          <DashboardView
            kpis={kpis}
            machines={machines}
            schedules={schedules}
            logs={logs}
            currentUser={currentUser}
            onOpenPMInspection={(sch) => setInspectionSchedule(sch)}
            onSelectMachine={(m) => setSelectedMachineHistory(m)}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onReportBreakdown={() => {
              setBreakdownTargetMachineId(undefined);
              setIsReportingBreakdown(true);
            }}
          />
        )}

        {activeTab === 'machines' && (
          <MachineRegistryView
            machines={machines}
            currentUser={currentUser}
            onSelectMachine={(m) => setSelectedMachineHistory(m)}
            onAddMachine={() => {
              setMachineToEdit(null);
              setIsAddingMachine(true);
            }}
            onEditMachine={(m) => {
              setMachineToEdit(m);
              setIsAddingMachine(true);
            }}
            onDeleteMachine={handleDeleteMachine}
            onReportBreakdown={(machineId) => {
              setBreakdownTargetMachineId(machineId);
              setIsReportingBreakdown(true);
            }}
            onCreatePMSchedule={(machineId) => {
              setIsCreatingPMSchedule(true);
            }}
          />
        )}

        {activeTab === 'pm' && (
          <PMSchedulerView
            schedules={schedules}
            currentUser={currentUser}
            onOpenInspection={(sch) => setInspectionSchedule(sch)}
            onCreatePMSchedule={() => setIsCreatingPMSchedule(true)}
          />
        )}

        {activeTab === 'logs' && (
          <MaintenanceLogsView
            logs={logs}
            machines={machines}
            currentUser={currentUser}
            onOpenNewWorkOrder={() => setIsAddingWorkOrder(true)}
          />
        )}

        {activeTab === 'database' && <DatabaseSchemaView />}
      </main>

      {/* Modals Container */}
      {/* 1. Digital PM Record Sheet Modal (Checklist based on uploaded factory PM sheet) */}
      {inspectionSchedule && (
        <PMInspectionModal
          schedule={inspectionSchedule}
          currentUser={currentUser}
          onClose={() => setInspectionSchedule(null)}
          onComplete={handleCompletePM}
        />
      )}

      {/* 2. Machine History & Details Modal */}
      {selectedMachineHistory && (
        <MachineHistoryModal
          machine={selectedMachineHistory}
          logs={logs}
          schedules={schedules}
          onClose={() => setSelectedMachineHistory(null)}
          onOpenPMInspection={(sch) => {
            setSelectedMachineHistory(null);
            setInspectionSchedule(sch);
          }}
        />
      )}

      {/* 3. Add / Edit Machine Modal */}
      {isAddingMachine && (
        <MachineFormModal
          machineToEdit={machineToEdit || undefined}
          onClose={() => {
            setIsAddingMachine(false);
            setMachineToEdit(null);
          }}
          onSave={handleSaveMachine}
        />
      )}

      {/* 4. Report Emergency Breakdown Modal */}
      {isReportingBreakdown && (
        <ReportBreakdownModal
          machines={machines}
          preselectedMachineId={breakdownTargetMachineId}
          currentUser={currentUser}
          onClose={() => {
            setIsReportingBreakdown(false);
            setBreakdownTargetMachineId(undefined);
          }}
          onSubmit={handleReportBreakdown}
        />
      )}

      {/* 5. Create PM Schedule Modal */}
      {isCreatingPMSchedule && (
        <CreatePMScheduleModal
          machines={machines}
          users={users}
          onClose={() => setIsCreatingPMSchedule(false)}
          onSave={handleCreatePMSchedule}
        />
      )}

      {/* 6. Add Work Order / Maintenance Log Modal */}
      {isAddingWorkOrder && (
        <AddWorkOrderModal
          machines={machines}
          currentUser={currentUser}
          onClose={() => setIsAddingWorkOrder(false)}
          onSave={handleCreateWorkOrder}
        />
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Factory Maintenance & Asset Management System · CMMS/EAM Enterprise Standard</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>MySQL 8.0+ Schema Ready</span>
            <span aria-hidden="true">·</span>
            <span>Total Productive Maintenance (TPM)</span>
            <span aria-hidden="true">·</span>
            <span>SMT Line #2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
