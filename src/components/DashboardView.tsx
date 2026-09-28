import React from 'react';
import { FactoryKPIs, Machine, PMSchedule, MaintenanceLog, User } from '../types';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  Wrench,
  Cpu,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  kpis: FactoryKPIs;
  machines: Machine[];
  schedules: PMSchedule[];
  logs: MaintenanceLog[];
  currentUser: User;
  onOpenPMInspection: (schedule: PMSchedule) => void;
  onSelectMachine: (machine: Machine) => void;
  onNavigateTab: (tab: string) => void;
  onReportBreakdown: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  machines,
  schedules,
  logs,
  currentUser,
  onOpenPMInspection,
  onSelectMachine,
  onNavigateTab,
  onReportBreakdown,
}) => {
  const breakdownMachines = machines.filter((m) => m.status === 'breakdown');
  const maintenanceMachines = machines.filter((m) => m.status === 'maintenance');
  const upcomingSchedules = schedules
    .filter((s) => s.status === 'scheduled' || s.status === 'in_progress' || s.status === 'overdue')
    .slice(0, 5);

  const recentLogs = logs.slice(0, 5);

  // Group machines by Line / Department
  const lines = Array.from(new Set(machines.map((m) => m.lineOperation)));

  return (
    <div className="space-y-6">
      {/* Critical Breakdown Alert Banner (If Any Machine is Down) */}
      {breakdownMachines.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border border-red-700/80 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-red-600/30 border border-red-500 rounded-lg text-red-400 animate-pulse shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                  CRITICAL ALERT: พบเครื่องจักรชำรุด {breakdownMachines.length} เครื่อง
                </span>
              </div>
              <p className="text-xs text-red-200 mt-0.5">
                {breakdownMachines.map((m) => `[${m.code}] ${m.name} (${m.lineOperation})`).join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectMachine(breakdownMachines[0])}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              ตรวจสอบเครื่องที่ชำรุด
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Availability */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              ความพร้อมใช้งานเครื่องจักร (Availability)
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
              {kpis.availabilityRate}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">เป้าหมาย ≥ 95%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                kpis.availabilityRate >= 95
                  ? 'bg-emerald-500'
                  : kpis.availabilityRate >= 85
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, kpis.availabilityRate)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>พร้อมเดินงาน {kpis.activeMachines}/{kpis.totalMachines} เครื่อง</span>
            <span className="text-slate-400">บำรุงรักษา {kpis.maintenanceMachines}</span>
          </div>
        </div>

        {/* KPI 2: Breakdowns */}
        <div
          className={`p-4 rounded-xl border transition-colors ${
            kpis.breakdownMachines > 0
              ? 'bg-red-950/30 border-red-800/80'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              เครื่องจักรชำรุด (Breakdown)
            </span>
            <Flame
              className={`w-4 h-4 ${
                kpis.breakdownMachines > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono tabular-nums ${
                kpis.breakdownMachines > 0 ? 'text-red-400' : 'text-slate-100'
              }`}
            >
              {kpis.breakdownMachines}
            </span>
            <span className="text-xs text-slate-400 font-medium">เครื่อง</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className={kpis.breakdownMachines > 0 ? 'text-red-300 font-semibold' : 'text-slate-400'}>
              {kpis.breakdownMachines > 0 ? 'สายการผลิตได้รับผลกระทบ' : 'ไม่มีเครื่องหยุดฉุกเฉิน'}
            </span>
            <button
              onClick={onReportBreakdown}
              className="text-xs text-red-400 hover:text-red-300 font-medium underline"
            >
              + แจ้งซ่อมฉุกเฉิน
            </button>
          </div>
        </div>

        {/* KPI 3: Upcoming & Overdue PM */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              งาน PM ที่กำลังจะถึง (7 วัน)
            </span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
              {kpis.upcomingPmCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">รายการ</span>
            {kpis.overduePmCount > 0 && (
              <span className="ml-auto text-[11px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/80 font-mono">
                เกินกำหนด {kpis.overduePmCount}
              </span>
            )}
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-4">
            <span>อัตราทำตามแผน (Compliance)</span>
            <span className="font-bold text-blue-400 font-mono">{kpis.pmComplianceRate}%</span>
          </div>
        </div>

        {/* KPI 4: Reliability MTBF / MTTR & Monthly Cost */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              ความน่าเชื่อถือ & ต้นทุนเดือนนี้
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              ฿{kpis.totalMaintenanceCostMonth.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
            <div>
              <span className="text-slate-400 block">MTBF (ชม. ระหว่างเสีย)</span>
              <span className="font-bold font-mono text-emerald-400">{kpis.mtbfHours}h</span>
            </div>
            <div>
              <span className="text-slate-400 block">MTTR (เฉลี่ยเวลาซ่อม)</span>
              <span className="font-bold font-mono text-amber-400">{kpis.mttrHours}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Machine Line Operational Overview & PM Tasks Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Production Lines Status Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                สถานะเครื่องจักรจำแนกตามไลน์การผลิต (Machine Status by Line)
              </h3>
              <p className="text-xs text-slate-400">
                คลิกที่การ์ดเครื่องจักรเพื่อดูประวัติ หรือสเปกทางวิศวกรรม
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('machines')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              ดูทะเบียนเครื่องจักรทั้งหมด
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Line Sections */}
          <div className="space-y-4">
            {lines.map((line) => {
              const lineMachines = machines.filter((m) => m.lineOperation === line);
              return (
                <div
                  key={line}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold font-mono text-slate-200 uppercase">
                        {line}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>จำนวน {lineMachines.length} เครื่อง</span>
                    </div>
                  </div>

                  {/* Machine mini cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {lineMachines.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => onSelectMachine(m)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all hover:translate-y-[-1px] ${
                          m.status === 'breakdown'
                            ? 'bg-red-950/40 border-red-700/80 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                            : m.status === 'maintenance'
                            ? 'bg-amber-950/30 border-amber-700/60'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-blue-400">
                            {m.code}
                          </span>
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              m.status === 'active'
                                ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                                : m.status === 'maintenance'
                                ? 'bg-amber-500'
                                : 'bg-red-500 animate-ping'
                            }`}
                          />
                        </div>
                        <div className="font-bold text-xs text-slate-100 truncate">{m.name}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {m.model} · {m.serialNumber}
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">
                            {m.status === 'breakdown' ? (
                              <span className="text-red-400 font-bold">เครื่องขัดข้อง</span>
                            ) : (
                              `PM: ${m.nextPmDate}`
                            )}
                          </span>
                          <span className="text-blue-400 hover:underline">ประวัติ →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Priority PM Schedules & Recent Work Orders */}
        <div className="space-y-6">
          {/* Upcoming PM Queue */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  ตารางงาน PM เร่งด่วน (Upcoming PMs)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('pm')}
                className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="space-y-2">
              {upcomingSchedules.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  ไม่มีตารางงาน PM ที่ค้างอยู่ในขณะนี้
                </div>
              ) : (
                upcomingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-blue-400">
                            {schedule.machineCode}
                          </span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[10px] text-slate-400">
                            {schedule.frequency.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-100 mt-0.5 line-clamp-1">
                          {schedule.planName}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          schedule.status === 'overdue'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : schedule.status === 'in_progress'
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-blue-950 text-blue-400'
                        }`}
                      >
                        {schedule.status === 'overdue'
                          ? 'OVERDUE'
                          : schedule.status === 'in_progress'
                          ? 'IN PROGRESS'
                          : 'DUE SOON'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 text-slate-400">
                      <span>กำหนด: {schedule.nextDueDate}</span>
                      <button
                        onClick={() => onOpenPMInspection(schedule)}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        เปิดแบบฟอร์ม PM
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Maintenance Activities Feed */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  ประวัติใบงานล่าสุด (Recent Work Orders)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-slate-300">
                      {log.machineCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.performedDate}</span>
                  </div>
                  <div className="font-semibold text-slate-200 line-clamp-1">{log.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>ช่าง: {log.technicianName.split(' ')[0]}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ฿{log.totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
