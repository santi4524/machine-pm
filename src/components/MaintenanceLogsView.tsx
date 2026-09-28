import React, { useState } from 'react';
import { MaintenanceLog, MaintenanceLogType, User, Machine } from '../types';
import {
  Wrench,
  Search,
  Plus,
  Download,
  Filter,
  DollarSign,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MaintenanceLogsViewProps {
  logs: MaintenanceLog[];
  machines: Machine[];
  currentUser: User;
  onOpenNewWorkOrder: () => void;
}

export const MaintenanceLogsView: React.FC<MaintenanceLogsViewProps> = ({
  logs,
  machines,
  currentUser,
  onOpenNewWorkOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MaintenanceLogType>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.machineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.technicianName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'all' || l.logType === typeFilter;
    return matchSearch && matchType;
  });

  const totalCostFiltered = filteredLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0);
  const totalLaborHours = filteredLogs.reduce((sum, l) => sum + (l.laborHours || 0), 0);

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Machine Code',
      'Machine Name',
      'Type',
      'Title',
      'Technician',
      'Labor Hours',
      'Spare Parts Cost',
      'Labor Cost',
      'Total Cost',
      'Performed Date',
      'Status',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.machineCode,
      `"${l.machineName.replace(/"/g, '""')}"`,
      l.logType,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.technicianName}"`,
      l.laborHours,
      l.costSpareParts,
      l.costLabor,
      l.totalCost,
      l.performedDate,
      l.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maintenance_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่องานซ่อม, รหัสเครื่อง, ช่าง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                typeFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด ({logs.length})
            </button>
            <button
              onClick={() => setTypeFilter('preventive')}
              className={`px-3 py-1 rounded-md transition-colors ${
                typeFilter === 'preventive'
                  ? 'bg-blue-950 text-blue-300 font-semibold border border-blue-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Preventive (PM)
            </button>
            <button
              onClick={() => setTypeFilter('corrective')}
              className={`px-3 py-1 rounded-md transition-colors ${
                typeFilter === 'corrective'
                  ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Corrective
            </button>
            <button
              onClick={() => setTypeFilter('breakdown')}
              className={`px-3 py-1 rounded-md transition-colors ${
                typeFilter === 'breakdown'
                  ? 'bg-red-950 text-red-300 font-semibold border border-red-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Breakdown
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>
          <button
            onClick={onOpenNewWorkOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เปิดใบงานใหม่ (Work Order)
          </button>
        </div>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block">จำนวนใบงานที่แสดง</span>
          <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
            {filteredLogs.length} รายการ
          </span>
        </div>
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block">ชั่วโมงแรงงานรวม</span>
          <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
            {totalLaborHours} ชั่วโมง
          </span>
        </div>
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block">งานชำรุดฉุกเฉิน (Breakdowns)</span>
          <span className="text-base font-bold font-mono text-red-400 tabular-nums">
            {filteredLogs.filter((l) => l.logType === 'breakdown').length} ครั้ง
          </span>
        </div>
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block">ค่าใช้จ่ายงานซ่อมรวม</span>
          <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
            ฿{totalCostFiltered.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Work Order / วันที่</th>
                <th className="py-3 px-3">เครื่องจักร</th>
                <th className="py-3 px-3">ประเภท</th>
                <th className="py-3 px-3">รายละเอียดงานซ่อม & การแก้ไข</th>
                <th className="py-3 px-3">ช่างผู้รับผิดชอบ</th>
                <th className="py-3 px-3 text-right">ชั่วโมง</th>
                <th className="py-3 px-3 text-right">ค่าใช้จ่ายรวม</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                    ไม่พบรายการประวัติการซ่อมบำรุง
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(log.id)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-blue-400">{log.id}</div>
                          <div className="text-[11px] text-slate-400">{log.performedDate}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-100">{log.machineCode}</div>
                          <div className="text-[11px] text-slate-400 font-sans truncate max-w-[140px]">
                            {log.machineName}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.logType === 'breakdown'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : log.logType === 'preventive'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {log.logType.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <div className="font-semibold text-slate-100">{log.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {log.actionTaken}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-300">
                          {log.technicianName}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200 tabular-nums">
                          {log.laborHours} ชม.
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-100 tabular-nums">
                          ฿{log.totalCost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                log.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : 'bg-amber-950 text-amber-300'
                              }`}
                            >
                              {log.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังซ่อม'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={8} className="p-4 border-b border-slate-800 font-sans text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-semibold text-slate-300">อาการปัญหา:</span>
                                  <p className="text-slate-400 mt-0.5">{log.issueDescription}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-300">การดำเนินการซ่อมแซม:</span>
                                  <p className="text-slate-400 mt-0.5">{log.actionTaken}</p>
                                </div>
                                {log.rootCause && (
                                  <div>
                                    <span className="font-semibold text-amber-400">
                                      สาเหตุที่แท้จริง (Root Cause):
                                    </span>
                                    <p className="text-slate-400 mt-0.5">{log.rootCause}</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                                <span className="font-semibold text-slate-200 block">
                                  อะไหล่ที่เบิกใช้ (Spare Parts Breakdown):
                                </span>
                                {log.sparePartsUsed && log.sparePartsUsed.length > 0 ? (
                                  <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                                    {log.sparePartsUsed.map((p, idx) => (
                                      <li key={idx} className="flex justify-between">
                                        <span>
                                          {p.partName} ({p.partNo || '-'}) × {p.quantity}
                                        </span>
                                        <span>฿{(p.quantity * p.unitCost).toLocaleString()}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="text-slate-500 text-[11px]">
                                    ไม่มีการเบิกอะไหล่เพิ่มเติม (งานทำความสะอาด / ตรวจสอบ)
                                  </div>
                                )}
                                <div className="pt-2 border-t border-slate-800 flex justify-between font-mono text-xs font-bold text-slate-100">
                                  <span>ค่าแรง (@฿350/ชม.): ฿{log.costLabor.toLocaleString()}</span>
                                  <span className="text-emerald-400">
                                    รวมทั้งสิ้น: ฿{log.totalCost.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
