import React, { useState } from 'react';
import { Machine, PMFrequency, User, ChecklistItem } from '../types';
import { X, Calendar, AlertTriangle, Save, CheckSquare } from 'lucide-react';
import { LOADER_CHECKLIST_TEMPLATE } from '../data/initialData';

interface CreatePMScheduleModalProps {
  machines: Machine[];
  users: User[];
  onClose: () => void;
  onSave: (data: {
    machineId: string;
    planName: string;
    frequency: PMFrequency;
    nextDueDate: string;
    assignedTechnicianId: string;
    assignedTechnicianName: string;
    checklistItems: ChecklistItem[];
  }) => Promise<void>;
}

export const CreatePMScheduleModal: React.FC<CreatePMScheduleModalProps> = ({
  machines,
  users,
  onClose,
  onSave,
}) => {
  const [machineId, setMachineId] = useState(machines[0]?.id || '');
  const [planName, setPlanName] = useState('');
  const [frequency, setFrequency] = useState<PMFrequency>('monthly');

  // Tomorrow as default due date
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [nextDueDate, setNextDueDate] = useState(tomorrow);

  const [assignedUserId, setAssignedUserId] = useState(
    users.find((u) => u.role === 'technician' || u.role === 'engineer')?.id || users[0]?.id || ''
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedMachine = machines.find((m) => m.id === machineId);

  const handleFrequencyChange = (freq: PMFrequency) => {
    setFrequency(freq);
    const now = Date.now();
    let days = 30;
    if (freq === 'daily') days = 1;
    else if (freq === 'weekly') days = 7;
    else if (freq === 'quarterly') days = 90;
    else if (freq === 'yearly') days = 365;

    setNextDueDate(new Date(now + days * 86400000).toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const today = new Date().toISOString().split('T')[0];
    if (nextDueDate < today) {
      setErrorMsg('ระบบความปลอดภัย: ไม่อนุญาตให้กำหนดวันทำ PM ย้อนหลัง (ต้องเป็นวันนี้หรืออนาคต)');
      return;
    }

    if (!machineId) {
      setErrorMsg('กรุณาเลือกเครื่องจักร');
      return;
    }

    if (!planName.trim()) {
      setErrorMsg('กรุณาระบุชื่อแผนงานบำรุงรักษา');
      return;
    }

    const assignedUser = users.find((u) => u.id === assignedUserId);

    try {
      setLoading(true);
      await onSave({
        machineId,
        planName: planName.trim(),
        frequency,
        nextDueDate,
        assignedTechnicianId: assignedUserId,
        assignedTechnicianName: assignedUser?.fullName || 'วิชัย ช่างทอง',
        checklistItems: LOADER_CHECKLIST_TEMPLATE,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกแผนงานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                สร้างแผนการบำรุงรักษาเชิงป้องกัน (Create PM Schedule)
              </h2>
              <span className="text-xs text-slate-400">
                กำหนดรอบความถี่และผู้รับผิดชอบตามเกณฑ์ TPM/CMMS
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
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-center gap-3 text-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              เครื่องจักรเป้าหมาย <span className="text-red-400">*</span>
            </label>
            <select
              value={machineId}
              onChange={(e) => {
                setMachineId(e.target.value);
                const m = machines.find((item) => item.id === e.target.value);
                if (m && !planName) {
                  setPlanName(`แผน PM ประจำเดือน: ตรวจเช็กระบบ ${m.name}`);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.name} ({m.model}) · {m.lineOperation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              ชื่อแผนงาน PM <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="เช่น แผน PM ประจำเดือน: หล่อลื่นแกนสไลด์และเช็กความดันลม"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              รอบความถี่การทำ PM (Frequency)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as PMFrequency[]).map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => handleFrequencyChange(f)}
                  className={`py-2 px-1 text-center rounded-lg border font-medium transition-colors uppercase ${
                    frequency === f
                      ? 'bg-blue-600 border-blue-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {f === 'daily'
                    ? 'รายวัน'
                    : f === 'weekly'
                    ? 'รายสัปดาห์'
                    : f === 'monthly'
                    ? 'รายเดือน'
                    : f === 'quarterly'
                    ? 'ไตรมาส'
                    : 'รายปี'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              วันครบกำหนดทำ PM (Next Due Date) <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-blue-500 focus:outline-hidden"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              * ระบบตรวจเช็กข้อมูล: ป้องกันการบันทึกวันครบกำหนดย้อนหลัง
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              ผู้รับผิดชอบงาน PM (Assignee)
            </label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role.toUpperCase()} - {u.department})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 flex items-start gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              แผนงานนี้จะผูกกับแบบฟอร์ม <strong>Preventive Maintenance Record Data</strong>{' '}
              อัตโนมัติ (15 รายการตรวจเช็ก: แผงควบคุม, สวิทช์ Emergency, สายพาน, สารหล่อลื่น LCG100)
            </div>
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
              className="inline-flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'สร้างแผนงาน PM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
