import React, { useState } from 'react';
import { Machine, MaintenanceLog, MaintenanceLogType, User, SparePartUsed } from '../types';
import { X, Wrench, AlertTriangle, Plus, Trash2, Save, DollarSign } from 'lucide-react';

interface AddWorkOrderModalProps {
  machines: Machine[];
  currentUser: User;
  onClose: () => void;
  onSave: (data: Omit<MaintenanceLog, 'id' | 'createdAt' | 'totalCost'>) => Promise<void>;
}

export const AddWorkOrderModal: React.FC<AddWorkOrderModalProps> = ({
  machines,
  currentUser,
  onClose,
  onSave,
}) => {
  const [machineId, setMachineId] = useState(machines[0]?.id || '');
  const [logType, setLogType] = useState<MaintenanceLogType>('corrective');
  const [title, setTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [performedDate, setPerformedDate] = useState(new Date().toISOString().split('T')[0]);
  const [laborHours, setLaborHours] = useState(2.0);
  const [costLabor, setCostLabor] = useState(700);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('completed');

  const [spareParts, setSpareParts] = useState<SparePartUsed[]>([
    { partName: '', partNo: '', quantity: 1, unitCost: 0 },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddSparePart = () => {
    setSpareParts((prev) => [...prev, { partName: '', partNo: '', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveSparePart = (idx: number) => {
    setSpareParts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePartChange = (idx: number, field: keyof SparePartUsed, value: any) => {
    setSpareParts((prev) =>
      prev.map((part, i) => (i === idx ? { ...part, [field]: value } : part))
    );
  };

  const costSpareParts = spareParts.reduce(
    (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitCost) || 0),
    0
  );
  const totalCost = costSpareParts + Number(costLabor || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!machineId) {
      setErrorMsg('กรุณาเลือกเครื่องจักร');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('กรุณาระบุหัวข้องานซ่อม');
      return;
    }
    if (laborHours < 0) {
      setErrorMsg('ชั่วโมงแรงงานต้องไม่เป็นค่าติดลบ');
      return;
    }
    if (costLabor < 0 || costSpareParts < 0) {
      setErrorMsg('ค่าใช้จ่ายต้องไม่เป็นค่าติดลบ');
      return;
    }

    const machine = machines.find((m) => m.id === machineId);

    try {
      setLoading(true);
      await onSave({
        machineId,
        machineCode: machine?.code || '',
        machineName: machine?.name || '',
        logType,
        title: title.trim(),
        issueDescription: issueDescription.trim() || title.trim(),
        actionTaken: actionTaken.trim() || 'ดำเนินการตรวจสอบและซ่อมบำรุงตามมาตรฐานวิศวกรรม',
        rootCause: rootCause.trim() || undefined,
        technicianId: currentUser.id,
        technicianName: currentUser.fullName,
        laborHours,
        costSpareParts,
        costLabor,
        sparePartsUsed: spareParts.filter((p) => p.partName.trim().length > 0),
        status,
        performedDate,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกประวัติการซ่อมไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                เปิดใบงานซ่อมบำรุง / บันทึกประวัติการซ่อม (New Work Order)
              </h2>
              <span className="text-xs text-slate-400">
                Preventive / Corrective / Breakdown Maintenance Log
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-center gap-3 text-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                เครื่องจักร <span className="text-red-400">*</span>
              </label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.name} · {m.lineOperation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">ประเภทงานซ่อม</label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value as MaintenanceLogType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden font-semibold"
              >
                <option value="preventive">Preventive (บำรุงรักษาเชิงป้องกันตามรอบ)</option>
                <option value="corrective">Corrective (ซ่อมปรับปรุงแก้ไขความผิดปกติ)</option>
                <option value="breakdown">Breakdown (ซ่อมเครื่องเสียฉุกเฉิน / กะทันหัน)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                ชื่องานซ่อม / อาการเสีย <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น เปลี่ยนซีลยางกระบอกสูบและปรับตั้งความตึงสายพาน"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">รายละเอียดอาการเสีย</label>
              <textarea
                rows={2}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="ระบุสิ่งที่พบเห็น สัญญาณเตือน หรือค่าการวัดที่ผิดปกติ..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                วิธีการแก้ไข / ขั้นตอนการซ่อม (Action Taken)
              </label>
              <textarea
                rows={2}
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="ระบุสิ่งที่ได้ดำเนินการซ่อมแซม เปลี่ยนอะไหล่ หรือ Calibrate..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">สาเหตุที่แท้จริง (Root Cause)</label>
              <input
                type="text"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="เช่น การเสื่อมสภาพตามอายุการใช้งาน, ฝุ่นสะสม"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">วันที่ดำเนินการ</label>
              <input
                type="date"
                value={performedDate}
                onChange={(e) => setPerformedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">ชั่วโมงแรงงานซ่อม (ชั่วโมง)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={laborHours}
                onChange={(e) => {
                  const h = Math.max(0, Number(e.target.value));
                  setLaborHours(h);
                  setCostLabor(h * 350);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono tabular-nums focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">ค่าแรงช่างรวม (฿)</label>
              <input
                type="number"
                min="0"
                value={costLabor}
                onChange={(e) => setCostLabor(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono tabular-nums focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">สถานะใบงาน</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="completed">เสร็จสิ้นสมบูรณ์ (Completed) - คืนสภาพเครื่องจักร</option>
                <option value="in_progress">กำลังดำเนินการซ่อม (In Progress)</option>
                <option value="pending">รอดำเนินการ / รออะไหล่ (Pending)</option>
              </select>
            </div>
          </div>

          {/* Spare Parts Entry */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">อะไหล่ที่เบิกใช้ในงานนี้:</span>
              <button
                type="button"
                onClick={handleAddSparePart}
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มอะไหล่
              </button>
            </div>

            {spareParts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="ชื่ออะไหล่..."
                  value={p.partName}
                  onChange={(e) => handlePartChange(idx, 'partName', e.target.value)}
                  className="flex-2 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Part No."
                  value={p.partNo}
                  onChange={(e) => handlePartChange(idx, 'partNo', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                />
                <input
                  type="number"
                  placeholder="จำนวน"
                  min="1"
                  value={p.quantity}
                  onChange={(e) => handlePartChange(idx, 'quantity', Math.max(0, Number(e.target.value)))}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-right font-mono tabular-nums text-slate-100"
                />
                <input
                  type="number"
                  placeholder="ราคา"
                  min="0"
                  value={p.unitCost}
                  onChange={(e) => handlePartChange(idx, 'unitCost', Math.max(0, Number(e.target.value)))}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-right font-mono tabular-nums text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSparePart(idx)}
                  className="p-1.5 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Cost Summary Box */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between font-mono">
            <span className="text-slate-400 font-sans">ต้นทุนรวมใบงานนี้:</span>
            <div className="text-right">
              <span className="text-base font-bold text-emerald-400 tabular-nums">
                ฿{totalCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block font-sans">
                (ค่าแรง ฿{costLabor.toLocaleString()} + อะไหล่ ฿{costSpareParts.toLocaleString()})
              </span>
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
              {loading ? 'กำลังบันทึก...' : 'บันทึกใบงานซ่อมบำรุง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
