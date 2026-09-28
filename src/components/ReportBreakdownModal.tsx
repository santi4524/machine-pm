import React, { useState } from 'react';
import { Machine, User } from '../types';
import { X, AlertOctagon, Flame, Wrench, ShieldAlert } from 'lucide-react';

interface ReportBreakdownModalProps {
  machines: Machine[];
  preselectedMachineId?: string;
  currentUser: User;
  onClose: () => void;
  onSubmit: (machineId: string, breakdownReason: string, urgency: string) => Promise<void>;
}

export const ReportBreakdownModal: React.FC<ReportBreakdownModalProps> = ({
  machines,
  preselectedMachineId,
  currentUser,
  onClose,
  onSubmit,
}) => {
  const [machineId, setMachineId] = useState(preselectedMachineId || machines[0]?.id || '');
  const [breakdownReason, setBreakdownReason] = useState('');
  const [urgency, setUrgency] = useState('critical');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedMachine = machines.find((m) => m.id === machineId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId) {
      setErrorMsg('กรุณาเลือกเครื่องจักรที่ชำรุด');
      return;
    }
    if (!breakdownReason.trim()) {
      setErrorMsg('กรุณาระบุอาการเสียหรือข้อความ Error จากเครื่องจักร');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(machineId, breakdownReason.trim(), urgency);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการแจ้งซ่อม');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-lg bg-slate-900 border border-red-800/80 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header with emergency alert color */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-800/60 bg-red-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-100">
                แจ้งเหตุเครื่องจักรชำรุดฉุกเฉิน (Report Breakdown)
              </h2>
              <span className="text-xs text-red-300/80">
                เปลี่ยนสถานะเป็น BREAKDOWN และส่งสัญญาณแจ้งเตือนทีมช่าง
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/90 border border-red-700 rounded-lg text-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              เครื่องจักรที่เกิดปัญหา <span className="text-red-400">*</span>
            </label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-red-500 focus:outline-hidden"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.name} ({m.lineOperation}) - {m.status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {selectedMachine && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 space-y-1">
              <div>
                <span className="text-slate-500">รุ่น / Serial:</span> {selectedMachine.model} / {selectedMachine.serialNumber}
              </div>
              <div>
                <span className="text-slate-500">ตำแหน่งติดตั้ง:</span> {selectedMachine.location}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              ระดับความเร่งด่วน (Urgency)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'critical', label: 'วิกฤติ (สายการผลิตหยุดชะงัก)' },
                { id: 'high', label: 'สูง (ทำงานได้ชั่วคราว)' },
                { id: 'medium', label: 'ปานกลาง (มีเครื่องสำรอง)' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setUrgency(item.id)}
                  className={`p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    urgency === item.id
                      ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              อาการเสีย / ข้อความ Error Code / รายละเอียดที่พบ <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={breakdownReason}
              onChange={(e) => setBreakdownReason(e.target.value)}
              placeholder="เช่น แกน Spindle อุณหภูมิพุ่งสูงเกิน 75°C, สายพานลำเลียงติดขัด, มอเตอร์ส่งเสียงดังผิดปกติ..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-300/90 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              ผู้แจ้งเหตุ: <strong>{currentUser.fullName}</strong> ({currentUser.role.toUpperCase()})
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              {loading ? 'กำลังส่งข้อมูล...' : 'ส่งสัญญาณแจ้งชำรุด (Confirm Breakdown)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
