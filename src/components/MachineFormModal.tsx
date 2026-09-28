import React, { useState } from 'react';
import { Machine, CriticalLevel, MachineStatus } from '../types';
import { X, Plus, AlertTriangle, Save, Cpu } from 'lucide-react';

interface MachineFormModalProps {
  machineToEdit?: Machine;
  onClose: () => void;
  onSave: (data: Omit<Machine, 'id' | 'runningHours' | 'lastPmDate'>) => Promise<void>;
}

export const MachineFormModal: React.FC<MachineFormModalProps> = ({
  machineToEdit,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState(machineToEdit?.code || '');
  const [name, setName] = useState(machineToEdit?.name || '');
  const [model, setModel] = useState(machineToEdit?.model || '');
  const [serialNumber, setSerialNumber] = useState(machineToEdit?.serialNumber || '');
  const [lineOperation, setLineOperation] = useState(machineToEdit?.lineOperation || 'SMT LINE # 2');
  const [department, setDepartment] = useState(machineToEdit?.department || 'SMT Manufacturing');
  const [status, setStatus] = useState<MachineStatus>(machineToEdit?.status || 'active');
  const [criticalLevel, setCriticalLevel] = useState<CriticalLevel>(machineToEdit?.criticalLevel || 'high');
  const [installDate, setInstallDate] = useState(
    machineToEdit?.installDate || new Date().toISOString().split('T')[0]
  );
  const [location, setLocation] = useState(machineToEdit?.location || 'Building B, Floor 2');
  const [nextPmDate, setNextPmDate] = useState(
    machineToEdit?.nextPmDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [powerRatingKw, setPowerRatingKw] = useState(machineToEdit?.powerRatingKw || 3.5);
  const [specNotes, setSpecNotes] = useState(machineToEdit?.specNotes || '');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim()) {
      setErrorMsg('กรุณาระบุรหัสเครื่องจักร (Machine Code) เช่น MC-SMT-005');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อเครื่องจักร (Machine Name)');
      return;
    }
    if (powerRatingKw < 0) {
      setErrorMsg('พิกัดกำลังไฟฟ้า (kW) ต้องไม่เป็นค่าติดลบ');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        lineOperation: lineOperation.trim(),
        department: department.trim(),
        status,
        criticalLevel,
        installDate,
        location: location.trim(),
        nextPmDate,
        powerRatingKw,
        specNotes: specNotes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {machineToEdit ? 'แก้ไขข้อมูลเครื่องจักร' : 'ลงทะเบียนเครื่องจักรใหม่ (Add Machine)'}
              </h2>
              <span className="text-xs text-slate-400">
                เพิ่มเข้าสู่ทะเบียนสินทรัพย์โรงงานและฐานข้อมูล MySQL
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-center gap-3 text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                รหัสเครื่องจักร (Machine Code) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น MC-SMT-005"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                ชื่อเครื่องจักร (Machine Name) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น AUTO OPTICAL INSPECTION (AOI)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">รุ่นเครื่องจักร (Model)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="เช่น Koh Young Zenith 2"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">หมายเลขซีเรียล (Serial Number)</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="เช่น KY-2023-88910"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">ไลน์การผลิต (Line Operation)</label>
              <input
                type="text"
                value={lineOperation}
                onChange={(e) => setLineOperation(e.target.value)}
                placeholder="เช่น SMT LINE # 2"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">แผนกที่รับผิดชอบ</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="SMT Manufacturing">SMT Manufacturing</option>
                <option value="Tooling & Mechanical Fabrication">Tooling & Mechanical Fabrication</option>
                <option value="Plastic & Enclosure Dept">Plastic & Enclosure Dept</option>
                <option value="Packaging & Warehouse">Packaging & Warehouse</option>
                <option value="Facility & Utilities">Facility & Utilities</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">สถานะเริ่มต้น</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MachineStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="active">พร้อมใช้งาน (Active)</option>
                <option value="maintenance">กำลังบำรุงรักษา (Maintenance)</option>
                <option value="breakdown">ชำรุดเสียหาย (Breakdown)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">ระดับความสำคัญ (Critical Level)</label>
              <select
                value={criticalLevel}
                onChange={(e) => setCriticalLevel(e.target.value as CriticalLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="critical">วิกฤติสูงสุด (Critical - Stop Line)</option>
                <option value="high">สูง (High)</option>
                <option value="medium">ปานกลาง (Medium)</option>
                <option value="low">ต่ำ (Low)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">วันที่ติดตั้ง (Install Date)</label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                วันครบกำหนด PM ถัดไป (Next PM Due)
              </label>
              <input
                type="date"
                value={nextPmDate}
                onChange={(e) => setNextPmDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">ตำแหน่งติดตั้ง (Location)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น Building B, Floor 2, Bay 08"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">พิกัดกำลังไฟฟ้า (kW)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={powerRatingKw}
                onChange={(e) => setPowerRatingKw(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                สเปกทางเทคนิค / สารหล่อลื่น / ข้อกำหนดเฉพาะ
              </label>
              <textarea
                rows={2}
                value={specNotes}
                onChange={(e) => setSpecNotes(e.target.value)}
                placeholder="เช่น ความดันลม 4-6 Kgf/cm², สารหล่อลื่น LCG100, อุณหภูมิคุม ±1°C"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'บันทึกเครื่องจักร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
