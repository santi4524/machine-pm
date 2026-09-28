import React, { useState } from 'react';
import { PMSchedule, ChecklistItem, User } from '../types';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  Printer,
  Save,
  Plus,
  Trash2,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

interface PMInspectionModalProps {
  schedule: PMSchedule;
  currentUser: User;
  onClose: () => void;
  onComplete: (payload: {
    completionNotes: string;
    verifiedByName: string;
    approvedByName: string;
    updatedChecklist: ChecklistItem[];
    laborHours: number;
    costSpareParts: number;
    costLabor: number;
    sparePartsUsed: Array<{ partName: string; partNo: string; quantity: number; unitCost: number }>;
  }) => Promise<void>;
}

export const PMInspectionModal: React.FC<PMInspectionModalProps> = ({
  schedule,
  currentUser,
  onClose,
  onComplete,
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    schedule.checklistItems && schedule.checklistItems.length > 0
      ? JSON.parse(JSON.stringify(schedule.checklistItems))
      : []
  );

  const [laborHours, setLaborHours] = useState<number>(2.0);
  const [laborCostPerHour, setLaborCostPerHour] = useState<number>(350);
  const [completionNotes, setCompletionNotes] = useState<string>(
    schedule.completionNotes || 'ทำการตรวจเช็กตามขั้นตอนมาตรฐาน อุปกรณ์ทำงานได้ตามสเปกปกติ'
  );
  const [verifiedBy, setVerifiedBy] = useState<string>(schedule.verifiedByName || currentUser.fullName);
  const [approvedBy, setApprovedBy] = useState<string>(schedule.approvedByName || 'สมชาย มั่นคง (Manager)');

  const [spareParts, setSpareParts] = useState<
    Array<{ partName: string; partNo: string; quantity: number; unitCost: number }>
  >([
    { partName: 'จาระบีหล่อลื่น LCG100 (80g)', partNo: 'LUB-LCG100', quantity: 1, unitCost: 450 },
    { partName: 'ผ้าเช็ดทำความสะอาด Lint-Free Wiper', partNo: 'CLN-WIP-01', quantity: 2, unitCost: 80 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isTechnicianOnly = currentUser.role === 'technician';
  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'admin';

  // Toggle item check status
  const handleResultChange = (id: string, result: 'OK' | 'NG' | 'APPLIED' | 'NONE') => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, result, checkedAt: new Date().toLocaleTimeString('th-TH') } : item))
    );
  };

  const handleRemarkChange = (id: string, remark: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, remark } : item)));
  };

  const handleAddSparePart = () => {
    setSpareParts((prev) => [...prev, { partName: '', partNo: '', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveSparePart = (index: number) => {
    setSpareParts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSparePartChange = (index: number, field: string, value: any) => {
    setSpareParts((prev) =>
      prev.map((part, idx) => (idx === index ? { ...part, [field]: value } : part))
    );
  };

  const calculatedSparePartsCost = spareParts.reduce(
    (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitCost) || 0),
    0
  );
  const calculatedLaborCost = (Number(laborHours) || 0) * (Number(laborCostPerHour) || 0);
  const totalCost = calculatedSparePartsCost + calculatedLaborCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Strict input validations
    if (laborHours < 0) {
      setErrorMsg('ชั่วโมงแรงงานต้องไม่เป็นค่าติดลบ');
      return;
    }
    if (calculatedSparePartsCost < 0 || calculatedLaborCost < 0) {
      setErrorMsg('ค่าใช้จ่ายต้องไม่เป็นค่าติดลบ');
      return;
    }

    // Check if any critical item is NG without remark
    const ngWithoutRemark = checklist.find((item) => item.result === 'NG' && !item.remark?.trim());
    if (ngWithoutRemark) {
      setErrorMsg(`กรุณาระบุหมายเหตุ/สาเหตุสำหรับรายการที่ไม่ผ่าน (NG): ${ngWithoutRemark.componentName}`);
      return;
    }

    try {
      setSubmitting(true);
      await onComplete({
        completionNotes,
        verifiedByName: verifiedBy,
        approvedByName: approvedBy,
        updatedChecklist: checklist,
        laborHours,
        costSpareParts: calculatedSparePartsCost,
        costLabor: calculatedLaborCost,
        sparePartsUsed: spareParts.filter((p) => p.partName.trim().length > 0),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick fill all passing
  const handleMarkAllOK = () => {
    setChecklist((prev) =>
      prev.map((item) => ({
        ...item,
        result: item.lubricant ? 'APPLIED' : 'OK',
        checkedAt: new Date().toLocaleTimeString('th-TH'),
      }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 print:hidden">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold tracking-wider text-blue-400 uppercase print:text-black">
                  CMMS · Digital PM Record Sheet
                </span>
                <span className="text-xs text-slate-500 print:hidden">·</span>
                <span className="text-xs text-slate-400 print:text-black">
                  Ref: {schedule.id}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 print:text-black print:text-xl">
                PREVENTIVE MAINTENANCE RECORD DATA
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              พิมพ์ใบ PM
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-center gap-3 text-red-200 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Machine Info Bar matching authentic sheet header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-lg print:border-black print:bg-white text-xs">
            <div>
              <span className="text-slate-400 block print:text-neutral-600">MACHINE NAME:</span>
              <span className="font-bold text-sm text-slate-100 font-mono print:text-black">
                {schedule.machineName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block print:text-neutral-600">MODEL / SERIAL:</span>
              <span className="font-semibold text-slate-200 font-mono print:text-black">
                {schedule.machineModel} / {schedule.machineCode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block print:text-neutral-600">OPERATION LINE:</span>
              <span className="font-semibold text-slate-200 font-mono print:text-black">
                {schedule.lineOperation}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block print:text-neutral-600">FREQUENCY / DUE:</span>
              <span className="font-semibold text-blue-400 font-mono print:text-black">
                {schedule.frequency.toUpperCase()} · {schedule.nextDueDate}
              </span>
            </div>
          </div>

          {/* Checklist Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide print:text-black">
                  ตารางรายการตรวจสอบตามสเปก (Checklist Items & Methods)
                </h3>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleMarkAllOK}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/60 rounded-md transition-colors"
                >
                  ✓ ทำเครื่องหมายผ่านทั้งหมด (Mark All OK)
                </button>
              </div>
            </div>

            {/* Industrial Checklist Table */}
            <div className="border border-slate-800 rounded-lg overflow-x-auto print:border-black">
              <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800 print:divide-black print:text-black">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold print:bg-neutral-100 print:text-black">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3 min-w-[140px]">หน่วยที่ต้องตรวจสอบ</th>
                    <th className="py-2.5 px-3 min-w-[180px]">รายการชิ้นส่วน</th>
                    <th className="py-2.5 px-3 min-w-[200px]">เกณฑ์มาตรฐาน (SPEC)</th>
                    <th className="py-2.5 px-2 text-center w-24">วิธีการ (C/L/I/F)</th>
                    <th className="py-2.5 px-3 min-w-[90px]">สารหล่อลื่น</th>
                    <th className="py-2.5 px-2 text-center w-14">ช่วงเวลา</th>
                    <th className="py-2.5 px-3 text-center min-w-[160px] print:w-24">ผลการตรวจ</th>
                    <th className="py-2.5 px-3 min-w-[150px]">หมายเหตุ / ค่าที่วัดได้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 print:bg-white print:divide-neutral-300 font-mono text-[11px]">
                  {checklist.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.result === 'NG' ? 'bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono print:text-black">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-300 print:text-black">
                        {item.section}
                      </td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-100 print:text-black">
                        {item.componentName}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-300 print:text-black">
                        {item.spec}
                      </td>
                      {/* Method indicators C L I F */}
                      <td className="py-2 px-2 text-center font-mono">
                        <span className="inline-flex gap-1 text-[10px]">
                          <span
                            className={
                              item.methods.clean
                                ? 'px-1 bg-blue-900/50 text-blue-300 rounded font-bold'
                                : 'text-slate-600'
                            }
                            title="C = ทำความสะอาด"
                          >
                            C
                          </span>
                          <span
                            className={
                              item.methods.lubricate
                                ? 'px-1 bg-amber-900/50 text-amber-300 rounded font-bold'
                                : 'text-slate-600'
                            }
                            title="L = หล่อลื่น"
                          >
                            L
                          </span>
                          <span
                            className={
                              item.methods.inspect
                                ? 'px-1 bg-purple-900/50 text-purple-300 rounded font-bold'
                                : 'text-slate-600'
                            }
                            title="I = ตรวจสอบ"
                          >
                            I
                          </span>
                          <span
                            className={
                              item.methods.functional
                                ? 'px-1 bg-emerald-900/50 text-emerald-300 rounded font-bold'
                                : 'text-slate-600'
                            }
                            title="F = หน้าที่การทำงาน"
                          >
                            F
                          </span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300 font-mono">
                        {item.lubricant ? (
                          <span className="text-amber-400 font-semibold">{item.lubricant}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-300 font-mono">
                        {item.interval}
                      </td>
                      {/* Interactive Buttons for OK / NG / APPLIED */}
                      <td className="py-2 px-3 text-center print:border print:border-black">
                        <div className="flex items-center justify-center gap-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => handleResultChange(item.id, 'OK')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              item.result === 'OK'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            OK
                          </button>
                          {item.methods.lubricate && (
                            <button
                              type="button"
                              onClick={() => handleResultChange(item.id, 'APPLIED')}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                item.result === 'APPLIED'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                              title="ทาจาระบีเรียบร้อย"
                            >
                              ✓ ทาสาร
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleResultChange(item.id, 'NG')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              item.result === 'NG'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            NG
                          </button>
                        </div>
                        <div className="hidden print:block font-bold">
                          {item.result || '-'}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.remark || ''}
                          onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                          placeholder="บันทึกค่า..."
                          className="w-full bg-slate-950/70 border border-slate-700/60 rounded px-2 py-1 text-slate-200 placeholder:text-slate-600 text-xs focus:outline-hidden focus:border-blue-500 font-sans print:border-none print:bg-transparent print:text-black"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend as shown in user's image */}
            <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 print:text-black print:border-black">
              <div>
                <span className="font-bold text-slate-300 print:text-black">คำอธิบายวิธีการ (METHODS):</span>{' '}
                <span className="text-blue-400 font-semibold">C</span> = ทำความสะอาด ·{' '}
                <span className="text-amber-400 font-semibold">L</span> = หล่อลื่น ·{' '}
                <span className="text-purple-400 font-semibold">I</span> = ตรวจสอบ ·{' '}
                <span className="text-emerald-400 font-semibold">F</span> = หน้าที่การทำงาน
              </div>
              <div>
                <span className="font-bold text-slate-300 print:text-black">RESULT OF CHECK:</span>{' '}
                PASSING = OK, FAILURE = NG, APPLYING GREASE = ✓
              </div>
            </div>
          </div>

          {/* Spare Parts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200 tracking-wide print:text-black">
                  บันทึกการเบิกใช้อะไหล่และสารหล่อลื่น (Spare Parts & Consumables)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddSparePart}
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 print:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มรายการอะไหล่
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden print:border-black">
              <table className="w-full text-left text-xs divide-y divide-slate-800 print:divide-black">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2 px-3">ชื่อรายการ / สารหล่อลื่น</th>
                    <th className="py-2 px-3 w-36">Part Number</th>
                    <th className="py-2 px-3 w-24 text-right">จำนวน</th>
                    <th className="py-2 px-3 w-28 text-right">ราคา/หน่วย (฿)</th>
                    <th className="py-2 px-3 w-28 text-right">ราคารวม (฿)</th>
                    <th className="py-2 px-2 w-10 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 print:bg-white print:text-black font-mono">
                  {spareParts.map((part, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={part.partName}
                          onChange={(e) => handleSparePartChange(idx, 'partName', e.target.value)}
                          placeholder="ชื่ออะไหล่..."
                          className="w-full bg-slate-950/60 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs font-sans print:border-none print:text-black"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={part.partNo}
                          onChange={(e) => handleSparePartChange(idx, 'partNo', e.target.value)}
                          placeholder="รหัสอะไหล่..."
                          className="w-full bg-slate-950/60 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs print:border-none print:text-black"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) =>
                            handleSparePartChange(idx, 'quantity', Math.max(0, Number(e.target.value)))
                          }
                          className="w-20 text-right bg-slate-950/60 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs tabular-nums print:border-none print:text-black"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={part.unitCost}
                          onChange={(e) =>
                            handleSparePartChange(idx, 'unitCost', Math.max(0, Number(e.target.value)))
                          }
                          className="w-24 text-right bg-slate-950/60 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs tabular-nums print:border-none print:text-black"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-slate-200 tabular-nums print:text-black">
                        ฿{((Number(part.quantity) || 0) * (Number(part.unitCost) || 0)).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveSparePart(idx)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {spareParts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-3 text-center text-slate-500 font-sans">
                        ไม่มีการเบิกใช้อะไหล่เพิ่มเติม
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Labor & Summary Cost Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-lg print:border-black print:bg-white text-xs">
            <div>
              <label className="text-slate-400 block mb-1">ชั่วโมงแรงงาน (Labor Hours):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={laborHours}
                  onChange={(e) => setLaborHours(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono tabular-nums text-sm print:border-black print:text-black"
                />
                <span className="text-slate-400">ชั่วโมง (@฿{laborCostPerHour}/ชม.)</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">รวมค่าอะไหล่ / สารหล่อลื่น:</label>
              <div className="text-lg font-bold font-mono text-slate-100 tabular-nums print:text-black">
                ฿{calculatedSparePartsCost.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">รวมภาษีมูลค่าเพิ่มแล้ว</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">รวมค่าใช้จ่ายงาน PM ทั้งสิ้น:</label>
              <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums print:text-black">
                ฿{totalCost.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">บันทึกเข้าต้นทุนฝ่ายบำรุงรักษา</span>
            </div>
          </div>

          {/* Notes & Factory Sign-off */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                บันทึกผลการบำรุงรักษา / ข้อคิดเห็นของวิศวกร:
              </label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500 print:border-black print:bg-white print:text-black"
                placeholder="ระบุข้อสังเกต หรือจุดที่ต้องเฝ้าระวังเพิ่มเติม..."
              />
            </div>

            {/* Signature Box (Matching the bottom of the uploaded sheet) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-slate-800 rounded-lg p-4 bg-slate-950/60 print:border-black print:bg-white text-xs">
              <div>
                <span className="text-slate-400 block mb-1">ทำ PM โดย (Performed By):</span>
                <input
                  type="text"
                  value={schedule.assignedTechnicianName}
                  disabled
                  className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-xs font-medium cursor-not-allowed print:border-none print:text-black"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">ตรวจสอบการทำ PM โดย (Verified By):</span>
                <input
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs focus:border-blue-500 print:border-none print:text-black"
                  placeholder="ชื่อวิศวกรผู้ตรวจ..."
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">อนุมัติโดย (Approved By - Manager):</span>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs focus:border-blue-500 print:border-none print:text-black"
                  placeholder="ชื่อผู้จัดการโรงงาน..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-400">
            สถานะปัจจุบัน:{' '}
            <span
              className={`font-semibold ${
                schedule.status === 'completed'
                  ? 'text-emerald-400'
                  : schedule.status === 'in_progress'
                  ? 'text-amber-400'
                  : 'text-blue-400'
              }`}
            >
              {schedule.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกและปิดใบงาน PM (Complete PM)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
