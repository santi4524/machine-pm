import React, { useState } from 'react';
import { PMSchedule, PMFrequency, PMScheduleStatus, User } from '../types';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface PMSchedulerViewProps {
  schedules: PMSchedule[];
  currentUser: User;
  onOpenInspection: (schedule: PMSchedule) => void;
  onCreatePMSchedule: () => void;
}

export const PMSchedulerView: React.FC<PMSchedulerViewProps> = ({
  schedules,
  currentUser,
  onOpenInspection,
  onCreatePMSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | PMFrequency>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PMScheduleStatus>('all');

  const filteredSchedules = schedules.filter((s) => {
    const matchSearch =
      s.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.machineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchFreq = frequencyFilter === 'all' || s.frequency === frequencyFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchSearch && matchFreq && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาแผน PM, เครื่องจักร, หรือชื่อช่าง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด ({schedules.length})
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'scheduled'
                  ? 'bg-blue-950 text-blue-300 font-semibold border border-blue-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              รอดำเนินการ ({schedules.filter((s) => s.status === 'scheduled').length})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              กำลังทำ ({schedules.filter((s) => s.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เสร็จสิ้น ({schedules.filter((s) => s.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'overdue'
                  ? 'bg-red-950 text-red-300 font-semibold border border-red-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เกินกำหนด ({schedules.filter((s) => s.status === 'overdue').length})
            </button>
          </div>

          {/* Frequency Dropdown */}
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">ทุกรอบความถี่ (All Frequencies)</option>
            <option value="daily">รายวัน (Daily)</option>
            <option value="weekly">รายสัปดาห์ (Weekly)</option>
            <option value="monthly">รายเดือน (Monthly)</option>
            <option value="quarterly">รายไตรมาส (Quarterly)</option>
            <option value="yearly">รายปี (Yearly)</option>
          </select>
        </div>

        <button
          onClick={onCreatePMSchedule}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          สร้างแผน PM ใหม่
        </button>
      </div>

      {/* Schedules Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">รหัส & แผนงาน PM</th>
                <th className="py-3 px-3">เครื่องจักรเป้าหมาย</th>
                <th className="py-3 px-3">รอบความถี่</th>
                <th className="py-3 px-3">วันครบกำหนด (Next Due)</th>
                <th className="py-3 px-3">ผู้รับผิดชอบ</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                    ไม่พบรายการแผนงาน PM ที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr
                    key={schedule.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenInspection(schedule)}
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-start gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-[11px] font-bold text-blue-400 block">
                            {schedule.id}
                          </span>
                          <span className="font-semibold text-slate-100 text-xs">
                            {schedule.planName}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            รายการ Checklist: {schedule.checklistItems?.length || 0} จุดตรวจสอบ
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-100 block">{schedule.machineCode}</span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        {schedule.machineName} ({schedule.lineOperation})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 uppercase">
                        {schedule.frequency === 'daily'
                          ? '1D · รายวัน'
                          : schedule.frequency === 'weekly'
                          ? '1W · รายสัปดาห์'
                          : schedule.frequency === 'monthly'
                          ? '1M · รายเดือน'
                          : schedule.frequency === 'quarterly'
                          ? '3M · รายไตรมาส'
                          : '1Y · รายปี'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      <div>{schedule.nextDueDate}</div>
                      {schedule.lastPerformedDate && (
                        <div className="text-[10px] text-slate-400">
                          ทำล่าสุด: {schedule.lastPerformedDate}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {schedule.assignedTechnicianName}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          schedule.status === 'completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : schedule.status === 'in_progress'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : schedule.status === 'overdue'
                            ? 'bg-red-950/80 text-red-300 border border-red-800'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {schedule.status === 'completed'
                          ? 'เสร็จสิ้น'
                          : schedule.status === 'in_progress'
                          ? 'กำลังดำเนินการ'
                          : schedule.status === 'overdue'
                          ? 'เลยกำหนด (OVERDUE)'
                          : 'รอดำเนินการ'}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 text-right font-sans"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onOpenInspection(schedule)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                          schedule.status === 'completed'
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {schedule.status === 'completed' ? 'ดูผลการตรวจ' : 'เปิด Checklist PM'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
