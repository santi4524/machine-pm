import React from 'react';
import { Machine, MaintenanceLog, PMSchedule } from '../types';
import {
  X,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Tag,
  Activity,
  Zap,
  Info,
} from 'lucide-react';

interface MachineHistoryModalProps {
  machine: Machine;
  logs: MaintenanceLog[];
  schedules: PMSchedule[];
  onClose: () => void;
  onOpenPMInspection?: (schedule: PMSchedule) => void;
}

export const MachineHistoryModal: React.FC<MachineHistoryModalProps> = ({
  machine,
  logs,
  schedules,
  onClose,
  onOpenPMInspection,
}) => {
  const machineLogs = logs.filter((l) => l.machineId === machine.id || l.machineCode === machine.code);
  const machineSchedules = schedules.filter((s) => s.machineId === machine.id || s.machineCode === machine.code);

  const totalSpent = machineLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0);
  const totalLaborHours = machineLogs.reduce((sum, l) => sum + (l.laborHours || 0), 0);
  const breakdownCount = machineLogs.filter((l) => l.logType === 'breakdown').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                  {machine.code}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">{machine.lineOperation}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">{machine.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">สถานะปัจจุบัน</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    machine.status === 'active'
                      ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                      : machine.status === 'maintenance'
                      ? 'bg-amber-500'
                      : 'bg-red-500 animate-pulse'
                  }`}
                />
                <span className="text-sm font-bold uppercase tracking-wide">
                  {machine.status === 'active'
                    ? 'พร้อมใช้งาน (ACTIVE)'
                    : machine.status === 'maintenance'
                    ? 'กำลังบำรุงรักษา'
                    : 'ชำรุดเสียหาย (BREAKDOWN)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">ชั่วโมงทำงานสะสม</span>
              <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
                {machine.runningHours.toLocaleString()} ชม.
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">ค่าซ่อมบำรุงรวม</span>
              <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
                ฿{totalSpent.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">สถิติเครื่องหยุด (Breakdowns)</span>
              <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
                <span className={breakdownCount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {breakdownCount} ครั้ง
                </span>{' '}
                <span className="text-xs text-slate-500 font-sans">({totalLaborHours} ชม. ซ่อม)</span>
              </div>
            </div>
          </div>

          {/* Machine Spec Details */}
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg text-xs space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              รายละเอียดสเปกทางวิศวกรรม
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-slate-300">
              <div>
                <span className="text-slate-500">รุ่น (Model):</span> {machine.model}
              </div>
              <div>
                <span className="text-slate-500">Serial No.:</span> {machine.serialNumber}
              </div>
              <div>
                <span className="text-slate-500">วันที่ติดตั้ง:</span> {machine.installDate}
              </div>
              <div>
                <span className="text-slate-500">ตำแหน่ง:</span> {machine.location}
              </div>
              <div>
                <span className="text-slate-500">กำลังไฟฟ้า:</span> {machine.powerRatingKw || '-'} kW
              </div>
              <div>
                <span className="text-slate-500">ระดับความวิกฤติ:</span>{' '}
                <span className="font-semibold uppercase text-amber-400">{machine.criticalLevel}</span>
              </div>
              {machine.specNotes && (
                <div className="col-span-2 md:col-span-3 text-slate-400 pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500">หมายเหตุสเปก:</span> {machine.specNotes}
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Alert Info if in breakdown */}
          {machine.status === 'breakdown' && (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                เครื่องจักรหยุดทำงานฉุกเฉิน (Breakdown Event Active)
              </div>
              <p className="text-red-200">
                <strong>สาเหตุ:</strong> {machine.breakdownReason || 'ไม่ระบุ'}
              </p>
              {machine.breakdownSince && (
                <p className="text-red-300 font-mono">
                  แจ้งเหตุเมื่อ: {machine.breakdownSince}
                </p>
              )}
            </div>
          )}

          {/* Maintenance Logs History Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              ประวัติการซ่อมบำรุงและใบสั่งงาน (Maintenance & Work Order History)
            </h3>

            {machineLogs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                ยังไม่มีประวัติการซ่อมบำรุงสำหรับเครื่องจักรนี้
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">วันที่</th>
                      <th className="py-2.5 px-3">ประเภท</th>
                      <th className="py-2.5 px-3">ชื่องานซ่อม / รายละเอียด</th>
                      <th className="py-2.5 px-3">ช่างผู้รับผิดชอบ</th>
                      <th className="py-2.5 px-3 text-right">ค่าใช้จ่ายรวม</th>
                      <th className="py-2.5 px-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                    {machineLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400">{log.performedDate}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.logType === 'breakdown'
                                ? 'bg-red-950/70 text-red-300 border border-red-800/60'
                                : log.logType === 'preventive'
                                ? 'bg-blue-950/70 text-blue-300 border border-blue-800/60'
                                : 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                            }`}
                          >
                            {log.logType.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-100">{log.title}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-sm">
                            {log.actionTaken}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">{log.technicianName}</td>
                        <td className="py-2.5 px-3 text-right font-bold tabular-nums text-slate-100">
                          ฿{log.totalCost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium font-sans ${
                              log.status === 'completed'
                                ? 'text-emerald-400 bg-emerald-950/50'
                                : 'text-amber-400 bg-amber-950/50'
                            }`}
                          >
                            {log.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
