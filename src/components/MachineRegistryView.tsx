import React, { useState } from 'react';
import { Machine, MachineStatus, User } from '../types';
import {
  Search,
  Plus,
  Filter,
  Wrench,
  Clock,
  Flame,
  Activity,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Cpu,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  Info,
} from 'lucide-react';

interface MachineRegistryViewProps {
  machines: Machine[];
  currentUser: User;
  onSelectMachine: (machine: Machine) => void;
  onAddMachine: () => void;
  onEditMachine: (machine: Machine) => void;
  onDeleteMachine: (machineId: string) => Promise<void>;
  onReportBreakdown: (machineId?: string) => void;
  onCreatePMSchedule: (machineId?: string) => void;
}

export const MachineRegistryView: React.FC<MachineRegistryViewProps> = ({
  machines,
  currentUser,
  onSelectMachine,
  onAddMachine,
  onEditMachine,
  onDeleteMachine,
  onReportBreakdown,
  onCreatePMSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MachineStatus>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const departments = Array.from(new Set(machines.map((m) => m.department)));

  const filteredMachines = machines.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lineOperation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchDept = departmentFilter === 'all' || m.department === departmentFilter;

    return matchSearch && matchStatus && matchDept;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อ, รุ่น หรือไลน์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด ({machines.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition-colors inline-flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active ({machines.filter((m) => m.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('maintenance')}
              className={`px-3 py-1 rounded-md transition-colors inline-flex items-center gap-1.5 ${
                statusFilter === 'maintenance'
                  ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Maintenance ({machines.filter((m) => m.status === 'maintenance').length})
            </button>
            <button
              onClick={() => setStatusFilter('breakdown')}
              className={`px-3 py-1 rounded-md transition-colors inline-flex items-center gap-1.5 ${
                statusFilter === 'breakdown'
                  ? 'bg-red-950 text-red-300 font-semibold border border-red-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Breakdown ({machines.filter((m) => m.status === 'breakdown').length})
            </button>
          </div>

          {/* Department Select */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">ทุกแผนก / สายงาน</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-slate-400">
            <button
              onClick={() => setViewMode('table')}
              title="มุมมองตาราง"
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'hover:text-white'}`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="มุมมองการ์ด"
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'hover:text-white'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Machine (Manager/Admin Only) */}
          {canManage ? (
            <button
              onClick={onAddMachine}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              ลงทะเบียนเครื่องจักรใหม่
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 px-2 py-1 bg-slate-950 rounded border border-slate-800">
              โหมดอ่านข้อมูล (ต้องการสิทธิ์ Manager เพื่อเพิ่มเครื่องจักร)
            </div>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">รหัส & ชื่อเครื่องจักร</th>
                  <th className="py-3 px-3">รุ่น / Serial</th>
                  <th className="py-3 px-3">ไลน์การผลิต</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-3 text-center">ระดับความวิกฤติ</th>
                  <th className="py-3 px-3 text-right">ชั่วโมงทำงาน</th>
                  <th className="py-3 px-3">รอบ PM ถัดไป</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                {filteredMachines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                      ไม่พบข้อมูลเครื่องจักรที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredMachines.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectMachine(m)}
                    >
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-blue-400 block text-xs">
                              {m.code}
                            </span>
                            <span className="font-semibold text-slate-100 text-xs">{m.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{m.model}</div>
                        <div className="text-[11px] text-slate-400">{m.serialNumber}</div>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                          {m.lineOperation}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                            m.status === 'active'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : m.status === 'maintenance'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-red-950/80 text-red-300 border border-red-800/60 animate-pulse'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.status === 'active'
                                ? 'bg-emerald-400'
                                : m.status === 'maintenance'
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                          />
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span
                          className={`text-[11px] font-semibold ${
                            m.criticalLevel === 'critical'
                              ? 'text-red-400'
                              : m.criticalLevel === 'high'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {m.criticalLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200 tabular-nums">
                        {m.runningHours.toLocaleString()} ชม.
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        <div>{m.nextPmDate}</div>
                        {m.lastPmDate && (
                          <div className="text-[10px] text-slate-400">ล่าสุด: {m.lastPmDate}</div>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-right font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectMachine(m)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                            title="ดูประวัติการซ่อม (History)"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => onEditMachine(m)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                              title="แก้ไขเครื่องจักร"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onReportBreakdown(m.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            title="แจ้งซ่อมฉุกเฉิน (Breakdown)"
                          >
                            <Flame className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMachine(m)}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-400 uppercase">
                      {m.code}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm mt-0.5">{m.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      m.status === 'active'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : m.status === 'maintenance'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>รุ่น / Serial:</span>
                    <span className="font-mono text-slate-200">
                      {m.model} / {m.serialNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ไลน์ / แผนก:</span>
                    <span className="text-slate-200">{m.lineOperation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ชั่วโมงสะสม:</span>
                    <span className="font-mono text-slate-200">
                      {m.runningHours.toLocaleString()} ชม.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันครบกำหนด PM:</span>
                    <span className="font-mono text-blue-400">{m.nextPmDate}</span>
                  </div>
                </div>

                {m.breakdownReason && (
                  <div className="mt-2 p-2 bg-red-950/60 border border-red-800/80 rounded text-[11px] text-red-300">
                    <span className="font-bold">สาเหตุขัดข้อง:</span> {m.breakdownReason}
                  </div>
                )}
              </div>

              <div
                className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onSelectMachine(m)}
                  className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-semibold"
                >
                  <History className="w-3.5 h-3.5" />
                  ดูประวัติ (History)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCreatePMSchedule(m.id)}
                    className="text-xs text-slate-300 hover:text-white"
                    title="สร้างแผน PM"
                  >
                    + แผน PM
                  </button>
                  <button
                    onClick={() => onReportBreakdown(m.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                    title="แจ้งชำรุด"
                  >
                    แจ้งซ่อม
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
