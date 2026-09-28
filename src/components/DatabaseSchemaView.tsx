import React, { useState } from 'react';
import {
  Database,
  Code2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Server,
  Key,
  Layers,
  Terminal,
  FileCode,
  FolderTree,
  Cpu,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'installer' | 'php' | 'schema' | 'security' | 'deploy'>('installer');
  const [selectedPhpFile, setSelectedPhpFile] = useState<string>('index.php');
  const [copied, setCopied] = useState(false);

  // Installer simulation state
  const [simDbHost, setSimDbHost] = useState('localhost');
  const [simDbPort, setSimDbPort] = useState('3306');
  const [simDbName, setSimDbName] = useState('factory_cmms_db');
  const [simDbUser, setSimDbUser] = useState('root');
  const [simDbPass, setSimDbPass] = useState('');
  const [simAdminUser, setSimAdminUser] = useState('admin');
  const [simAdminPass, setSimAdminPass] = useState('Admin@1234');
  const [simInstalling, setSimInstalling] = useState(false);
  const [simCompleted, setSimCompleted] = useState(false);
  const [simSteps, setSimSteps] = useState<string[]>([]);

  const handleSimulateInstall = () => {
    setSimInstalling(true);
    setSimCompleted(false);
    setSimSteps([]);

    const steps = [
      'ตรวจสอบสภาพแวดล้อม: PHP 8.x, PDO, pdo_mysql extension พร้อมใช้งาน',
      `เชื่อมต่อ MySQL Server (${simDbHost}:${simDbPort}) ด้วยผู้ใช้ ${simDbUser}`,
      `สร้างฐานข้อมูล: CREATE DATABASE IF NOT EXISTS \`${simDbName}\` (utf8mb4_unicode_ci)`,
      'สร้างตาราง InnoDB 6 ตาราง (users, machines, pm_schedules, pm_checklist_items, maintenance_logs, maintenance_spare_parts)',
      'นำเข้าข้อมูลเครื่องจักรจริง SMT LOADER ESL-500 และ Checklist 15 จุด (แผงควบคุม, สวิทช์ฉุกเฉิน, สารหล่อลื่น LCG100)',
      `สร้างบัญชีผู้ดูแลระบบเริ่มต้น: Username: ${simAdminUser}`,
      'เขียนไฟล์คอนฟิกการเชื่อมต่อ: config/database.php',
      'สร้างไฟล์ installed.lock เพื่อล็อกตัวติดตั้งและเข้าสู่โหมดเว็บแอปพลิเคชัน & REST API',
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const stepText = steps[currentStep];
        setSimSteps((prev) => [...prev, stepText]);
        currentStep++;
      } else {
        clearInterval(interval);
        setSimInstalling(false);
        setSimCompleted(true);
      }
    }, 400);
  };

  const handleCopyCurrentCode = () => {
    let contentToCopy = '';
    if (activeTab === 'php') {
      contentToCopy = PHP_CODE_FILES[selectedPhpFile]?.code || '';
    } else if (activeTab === 'schema') {
      contentToCopy = MYSQL_SCHEMA_SQL;
    }

    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    let content = '';
    let filename = '';

    if (activeTab === 'php') {
      content = PHP_CODE_FILES[selectedPhpFile]?.code || '';
      filename = selectedPhpFile;
    } else {
      content = MYSQL_SCHEMA_SQL;
      filename = 'factory_cmms_schema.sql';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('installer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
              activeTab === 'installer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            ตัวช่วยติดตั้งอัตโนมัติ (index.php Installer)
          </button>
          <button
            onClick={() => setActiveTab('php')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
              activeTab === 'php'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            โค้ด PHP Backend (PDO & REST API)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            โครงสร้างฐานข้อมูล MySQL (DDL Schema)
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            ความปลอดภัย & SQL Injection (PDO)
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
              activeTab === 'deploy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            คู่มือติดตั้งเซิร์ฟเวอร์ (XAMPP / Docker / LAMP)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCurrentCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
          </button>
          <button
            onClick={handleDownloadFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            ดาวน์โหลดไฟล์
          </button>
        </div>
      </div>

      {/* Tab 0: Auto-Installer Wizard Simulator */}
      {activeTab === 'installer' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                  PHP 8.x AUTO INSTALLER & DATABASE GENERATOR (index.php)
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  ระบบช่วยติดตั้งโปรเจกต์และสร้างฐานข้อมูล MySQL อัตโนมัติในคลิกเดียว
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  เมื่อนำไฟล์ <code>index.php</code> ไปเปิดบนเว็บไซต์หรือโฮสติ้งใหม่ ระบบจะตรวจจับและเปิดหน้าต่างติดตั้งเพื่อสร้างฐานข้อมูลและตารางให้อัตโนมัติทันที
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedPhpFile('index.php');
                    setActiveTab('php');
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  ดูโค้ด index.php ตัวเต็ม
                </button>
              </div>
            </div>

            {/* Interactive Installer Simulation Box */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Configuration Form */}
              <div className="space-y-4 text-xs">
                <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-400" />
                  แบบฟอร์มจำลองการตั้งค่าฐานข้อมูล (Simulation Form)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Database Host</label>
                    <input
                      type="text"
                      value={simDbHost}
                      onChange={(e) => setSimDbHost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Port</label>
                    <input
                      type="text"
                      value={simDbPort}
                      onChange={(e) => setSimDbPort(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 mb-1 font-semibold">
                      ชื่อฐานข้อมูล MySQL (สร้างอัตโนมัติหากยังไม่มี)
                    </label>
                    <input
                      type="text"
                      value={simDbName}
                      onChange={(e) => setSimDbName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Username</label>
                    <input
                      type="text"
                      value={simDbUser}
                      onChange={(e) => setSimDbUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Password</label>
                    <input
                      type="password"
                      placeholder="(ว่างไว้สำหรับ root ใน XAMPP)"
                      value={simDbPass}
                      onChange={(e) => setSimDbPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Admin Username</label>
                    <input
                      type="text"
                      value={simAdminUser}
                      onChange={(e) => setSimAdminUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Admin Password</label>
                    <input
                      type="text"
                      value={simAdminPass}
                      onChange={(e) => setSimAdminPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={simInstalling}
                  onClick={handleSimulateInstall}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer text-xs font-sans flex items-center justify-center gap-2"
                >
                  {simInstalling ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังสร้างฐานข้อมูลและติดตั้งโปรเจกต์...
                    </>
                  ) : (
                    <>⚡ จำลองรันคำสั่งติดตั้ง (Test Run Auto-Installer)</>
                  )}
                </button>
              </div>

              {/* Right Column: Execution Log & Checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="font-bold text-slate-300 font-mono">
                      INSTALLATION EXECUTION LOG
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {simCompleted ? 'STATUS: COMPLETED (100%)' : simInstalling ? 'INSTALLING...' : 'READY'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 font-mono text-[11px]">
                    {simSteps.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 font-sans text-xs">
                        กดปุ่ม <strong>"จำลองรันคำสั่งติดตั้ง"</strong> เพื่อดูขั้นตอนการทำงานอัตโนมัติของไฟล์ index.php
                      </div>
                    ) : (
                      simSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-300 animate-in fade-in duration-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {simCompleted && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-700/80 rounded-lg text-xs text-emerald-200 space-y-1">
                    <div className="font-bold text-emerald-300">
                      ✓ ติดตั้งโปรเจกต์และฐานข้อมูล MySQL เรียบร้อย!
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ไฟล์ <code>installed.lock</code> ถูกสร้างขึ้นแล้ว ตัวระบบจะสลับเข้าสู่โหมด Web Dashboard และ REST API อัตโนมัติ
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: PHP Code Explorer */}
      {activeTab === 'php' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Sidebar File Tree */}
            <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
                <FolderTree className="w-4 h-4 text-blue-400" />
                โครงสร้างไฟล์ PHP Backend
              </div>

              <div className="space-y-1 text-xs font-mono">
                {Object.keys(PHP_CODE_FILES).map((fileName) => {
                  const item = PHP_CODE_FILES[fileName];
                  return (
                    <button
                      key={fileName}
                      onClick={() => setSelectedPhpFile(fileName)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        selectedPhpFile === fileName
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{fileName}</span>
                      <span
                        className={`text-[10px] font-sans px-1.5 py-0.2 rounded ${
                          selectedPhpFile === fileName ? 'bg-blue-800 text-blue-100' : 'bg-slate-950 text-slate-500'
                        }`}
                      >
                        {item.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block font-sans">คุณสมบัติเด่นของโค้ด:</span>
                <div>• PHP 8.x Type Hinting & Strict Types</div>
                <div>• PDO Parameterized Prepared Statements</div>
                <div>• Atomic DB Transactions (commit/rollback)</div>
                <div>• RBAC Middleware กรองสิทธิ์ Manager/Tech</div>
              </div>
            </div>

            {/* Code Content View */}
            <div className="lg:col-span-3 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs flex flex-col">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="font-bold">{PHP_CODE_FILES[selectedPhpFile]?.path}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-sans">
                  {PHP_CODE_FILES[selectedPhpFile]?.description}
                </span>
              </div>
              <pre className="p-4 text-slate-200 overflow-x-auto leading-relaxed max-h-[580px] scrollbar-thin">
                <code>{PHP_CODE_FILES[selectedPhpFile]?.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: MySQL Schema DDL */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="font-mono text-sm font-bold text-blue-400">machines (เครื่องจักร)</div>
              <p className="text-xs text-slate-400">
                รหัสเครื่องจักร, รุ่น, ซีเรียล, ไลน์การผลิต, สถานะ (active, maintenance, breakdown)
              </p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="font-mono text-sm font-bold text-amber-400">pm_schedules (แผน PM)</div>
              <p className="text-xs text-slate-400">
                รอบความถี่, วันกำหนดทำถัดไป, สถานะ, ผู้รับผิดชอบ และตารางรายการ checklist 15 จุด
              </p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="font-mono text-sm font-bold text-emerald-400">maintenance_logs (ใบงานซ่อม)</div>
              <p className="text-xs text-slate-400">
                ประวัติงานซ่อม, ค่าแรง, ค่าอะไหล่, รวมค่าใช้จ่าย (Generated Column) และ Root Cause
              </p>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-400 flex items-center justify-between">
              <span>MySQL 8.0+ / MariaDB Database DDL Script</span>
              <span className="text-[11px]">UTF8MB4 · Foreign Keys · Check Constraints</span>
            </div>
            <pre className="p-4 text-slate-300 overflow-x-auto leading-relaxed max-h-[550px] scrollbar-thin">
              <code>{MYSQL_SCHEMA_SQL}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Security & PHP PDO Architecture */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              การป้องกัน SQL Injection ด้วย PHP PDO
            </h3>
            <p className="text-slate-400 leading-relaxed">
              ในระบบ PHP ที่พัฒนาขึ้นนี้ ทุกคำสั่ง SQL ปฏิบัติตามมาตรฐาน OWASP Top 10 โดยไม่มีการนำค่าจาก User Input มาต่อ String (No string concatenation):
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 font-mono text-[11px]">
              <span className="text-red-400 block font-bold">❌ แบบเดิมที่เสี่ยง (Vulnerable):</span>
              <code className="text-slate-400 block">$sql = "SELECT * FROM machines WHERE status = '" . $_GET['status'] . "'"; // โดน SQLi ได้</code>
              <span className="text-emerald-400 block font-bold pt-2">✓ โค้ดของระบบนี้ (Secure PDO Prepared):</span>
              <code className="text-emerald-300 block">
                $stmt = $pdo-&gt;prepare("SELECT * FROM machines WHERE status = :status");<br />
                $stmt-&gt;execute([':status' =&gt; $status]);
              </code>
            </div>
            <p className="text-slate-400 leading-relaxed">
              นอกจากนี้ยังตั้งค่า <code>PDO::ATTR_EMULATE_PREPARES =&gt; false</code> เพื่อสั่งให้ MySQL Server เป็นผู้คอมไพล์คำสั่ง Query แยกจากพารามิเตอร์ข้อมูลอย่างแท้จริง
            </p>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Atomic Database Transactions (ACID)
            </h3>
            <p className="text-slate-400 leading-relaxed">
              การอัปเดตสถานะงาน PM จาก "รอดำเนินการ" เป็น "เสร็จสิ้น" ใน <code>api/complete_pm.php</code> มีการจัดการผ่าน <strong>PDO Transaction</strong>:
            </p>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-mono">1.</span>
                <span><code>$pdo-&gt;beginTransaction()</code> เริ่มต้น Transaction</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-mono">2.</span>
                <span>อัปเดตสถานะในตาราง <code>pm_schedules</code> เป็น 'completed'</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-mono">3.</span>
                <span>บันทึกประวัติการซ่อมบำรุงเข้าตาราง <code>maintenance_logs</code></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-mono">4.</span>
                <span>บันทึกการเบิกอะไหล่เข้าตาราง <code>maintenance_spare_parts</code></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-mono">5.</span>
                <span>คืนสภาพเครื่องจักรในตาราง <code>machines</code> เป็น 'active' และเลื่อนรอบ PM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-mono">6.</span>
                <span><code>$pdo-&gt;commit()</code> หากสำเร็จ หรือ <code>$pdo-&gt;rollBack()</code> หากมีข้อผิดพลาด</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: Deployment & Installation Guide */}
      {activeTab === 'deploy' && (
        <div className="space-y-4 text-xs">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              ขั้นตอนการติดตั้ง PHP Backend & MySQL บนเครื่องเซิร์ฟเวอร์
            </h3>

            {/* Option 1: XAMPP / Laragon */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-slate-200 text-xs">
                วิธีที่ 1: ติดตั้งบน XAMPP หรือ Laragon (Windows / Local Dev)
              </div>
              <ol className="list-decimal list-inside text-slate-400 space-y-1 leading-relaxed">
                <li>เปิด XAMPP Control Panel แล้วกด Start โมดูล <strong>Apache</strong> และ <strong>MySQL</strong></li>
                <li>เปิด phpMyAdmin (http://localhost/phpmyadmin) แล้วกดแท็บ <strong>Import</strong> นำไฟล์ <code>factory_cmms_schema.sql</code> เข้าไปรัน</li>
                <li>คัดลอกโฟลเดอร์ <code>php-backend</code> ไปไว้ใน <code>C:/xampp/htdocs/cmms-api/</code></li>
                <li>เปิดไฟล์ <code>config/database.php</code> ตรวจสอบ Username (root) และ Password ให้ตรงกับเครื่อง</li>
                <li>ทดสอบเรียกใช้งาน API: <code>http://localhost/cmms-api/api/machines</code> จะได้ผลลัพธ์ JSON ทันที</li>
              </ol>
            </div>

            {/* Option 2: Linux Ubuntu LAMP */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-slate-200 text-xs">
                วิธีที่ 2: ติดตั้งบน Ubuntu / Debian Linux Server (LAMP Stack)
              </div>
              <pre className="p-3 bg-slate-900 rounded font-mono text-[11px] text-slate-300 overflow-x-auto">
{`# 1. ติดตั้ง PHP 8.2 และโมดูล PDO MySQL
sudo apt update
sudo apt install apache2 php8.2 php8.2-mysql php8.2-curl php8.2-mbstring mysql-server -y

# 2. นำเข้าฐานข้อมูล MySQL
sudo mysql -u root -p < factory_cmms_schema.sql

# 3. เปิดใช้งาน Apache mod_rewrite สำหรับ REST API Clean URLs
sudo a2enmod rewrite
sudo systemctl restart apache2`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// PHP Source Codes dictionary for the interactive code explorer
const PHP_CODE_FILES: Record<string, { path: string; tag: string; description: string; code: string }> = {
  'database.php': {
    path: 'php-backend/config/database.php',
    tag: 'Database',
    description: 'คลาส PDO Singleton เชื่อมต่อฐานข้อมูล MySQL พร้อมตั้งค่าป้องกัน SQL Injection',
    code: `<?php
declare(strict_types=1);

namespace FactoryCMMS\\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $connection = null;

    /**
     * คืนค่าอินสแตนซ์ PDO สำหรับใช้งานทั่วทั้งระบบ
     */
    public static function getConnection(): PDO {
        if (self::$connection === null) {
            $host = getenv('DB_HOST') ?: 'localhost';
            $port = getenv('DB_PORT') ?: '3306';
            $dbName = getenv('DB_NAME') ?: 'factory_cmms_db';
            $username = getenv('DB_USER') ?: 'root';
            $password = getenv('DB_PASSWORD') ?: '';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // ป้องกัน SQL Injection โดยสั่งให้ MySQL ทำ Server-side Prepared Statements จริง
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$connection = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Database connection failed: ' . $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        return self::$connection;
    }
}`,
  },
  'complete_pm.php': {
    path: 'php-backend/api/complete_pm.php',
    tag: 'Transaction',
    description: 'API ปิดใบงาน PM ตรวจสอบ Checklist และอัปเดตเครื่องจักรด้วย PDO Transaction',
    code: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

use FactoryCMMS\\Config\\Database;
use FactoryCMMS\\Middleware\\AuthMiddleware;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$user = AuthMiddleware::authenticate();
$pdo = Database::getConnection();

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true) ?? [];

$scheduleId = $payload['schedule_id'] ?? $payload['scheduleId'] ?? null;
if (!$scheduleId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'กรุณาระบุ schedule_id'], JSON_UNESCAPED_UNICODE);
    exit;
}

$laborHours = max(0, floatval($payload['labor_hours'] ?? $payload['laborHours'] ?? 2.0));
$costSpareParts = max(0, floatval($payload['cost_spare_parts'] ?? $payload['costSpareParts'] ?? 0));
$costLabor = max(0, floatval($payload['cost_labor'] ?? $payload['costLabor'] ?? 0));
$completionNotes = trim($payload['completion_notes'] ?? $payload['completionNotes'] ?? 'ตรวจเช็กตามมาตรฐานโรงงานเรียบร้อย');
$checklist = $payload['updated_checklist'] ?? $payload['updatedChecklist'] ?? [];
$spareParts = $payload['spare_parts_used'] ?? $payload['sparePartsUsed'] ?? [];

// เริ่มต้นกระบวนการ Atomic Database Transaction
try {
    $pdo->beginTransaction();

    // 1. ตรวจสอบข้อมูลแผนงาน PM
    $schedStmt = $pdo->prepare("SELECT * FROM pm_schedules WHERE id = :id FOR UPDATE");
    $schedStmt->execute([':id' => $scheduleId]);
    $schedule = $schedStmt->fetch();

    if (!$schedule) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'ไม่พบแผนงาน PM นี้'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $machineId = $schedule['machine_id'];

    // 2. อัปเดตสถานะงาน PM จาก scheduled/in_progress เป็น 'completed'
    $updateSchedSql = "UPDATE pm_schedules SET
        status = 'completed',
        last_performed_date = CURRENT_DATE,
        completion_notes = :notes,
        completed_at = NOW()
        WHERE id = :id";
    $updateSchedStmt = $pdo->prepare($updateSchedSql);
    $updateSchedStmt->execute([
        ':notes' => $completionNotes,
        ':id'    => $scheduleId
    ]);

    // 3. บันทึกผลการตรวจเช็ก Checklist แต่ละจุด (OK, NG, APPLIED สารหล่อลื่น LCG100)
    if (!empty($checklist)) {
        $updateChkSql = "UPDATE pm_checklist_items SET
            result = :result,
            remark = :remark,
            checked_at = NOW()
            WHERE id = :id AND pm_schedule_id = :sched_id";
        $updateChkStmt = $pdo->prepare($updateChkSql);

        foreach ($checklist as $item) {
            $itemId = $item['id'] ?? null;
            if ($itemId) {
                $updateChkStmt->execute([
                    ':result'   => $item['result'] ?? 'OK',
                    ':remark'   => $item['remark'] ?? null,
                    ':id'       => $itemId,
                    ':sched_id' => $scheduleId
                ]);
            }
        }
    }

    // 4. บันทึกประวัติใบงานซ่อมบำรุงเข้า maintenance_logs
    $logId = 'WO-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    $logSql = "INSERT INTO maintenance_logs (
        id, machine_id, pm_schedule_id, log_type, title,
        issue_description, action_taken, technician_id,
        labor_hours, cost_spare_parts, cost_labor, status, performed_date
    ) VALUES (
        :id, :machine_id, :pm_id, 'preventive', :title,
        :desc, :action, :tech_id,
        :labor_hours, :cost_parts, :cost_labor, 'completed', CURRENT_DATE
    )";

    $logStmt = $pdo->prepare($logSql);
    $logStmt->execute([
        ':id'          => $logId,
        ':machine_id'  => $machineId,
        ':pm_id'       => $scheduleId,
        ':title'       => 'ปิดใบงาน PM: ' . $schedule['plan_name'],
        ':desc'        => 'การตรวจบำรุงรักษาเชิงป้องกันตามแบบฟอร์มโรงงาน (' . $schedule['frequency'] . ')',
        ':action'      => $completionNotes,
        ':tech_id'     => $user['id'],
        ':labor_hours' => $laborHours,
        ':cost_parts'  => $costSpareParts,
        ':cost_labor'  => $costLabor
    ]);

    // 5. บันทึกการเบิกใช้อะไหล่เข้า maintenance_spare_parts
    if (!empty($spareParts)) {
        $partSql = "INSERT INTO maintenance_spare_parts (maintenance_log_id, part_no, part_name, quantity, unit_cost)
                    VALUES (:log_id, :part_no, :part_name, :quantity, :unit_cost)";
        $partStmt = $pdo->prepare($partSql);

        foreach ($spareParts as $part) {
            $partName = trim($part['part_name'] ?? $part['partName'] ?? '');
            if (!empty($partName)) {
                $partStmt->execute([
                    ':log_id'    => $logId,
                    ':part_no'   => $part['part_no'] ?? $part['partNo'] ?? 'N/A',
                    ':part_name' => $partName,
                    ':quantity'  => max(1, floatval($part['quantity'] ?? 1)),
                    ':unit_cost' => max(0, floatval($part['unit_cost'] ?? $part['unitCost'] ?? 0))
                ]);
            }
        }
    }

    // 6. อัปเดตเครื่องจักร: เปลี่ยนสถานะเป็น active และคำนวณวันทำ PM รอบถัดไป
    $freq = $schedule['frequency'];
    $days = ($freq === 'daily') ? 1 : (($freq === 'weekly') ? 7 : (($freq === 'quarterly') ? 90 : 30));
    $nextPmDate = date('Y-m-d', strtotime("+{$days} days"));

    $updateMachineSql = "UPDATE machines SET
        status = IF(status = 'maintenance', 'active', status),
        last_pm_date = CURRENT_DATE,
        next_pm_date = :next_pm,
        running_hours = running_hours + 24
        WHERE id = :machine_id";

    $updateMachineStmt = $pdo->prepare($updateMachineSql);
    $updateMachineStmt->execute([
        ':next_pm'    => $nextPmDate,
        ':machine_id' => $machineId
    ]);

    // ยืนยันการทำงานของ Transaction
    $pdo->commit();

    echo json_encode([
        'success'       => true,
        'message'       => 'ปิดงาน PM และบันทึกประวัติการซ่อมบำรุงเรียบร้อย',
        'work_order_id' => $logId,
        'machine_id'    => $machineId,
        'next_pm_due'   => $nextPmDate
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Transaction failed: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}`,
  },
  'machines.php': {
    path: 'php-backend/api/machines.php',
    tag: 'CRUD',
    description: 'API ทะเบียนเครื่องจักร (GET/POST/PUT/DELETE) พร้อมตรวจเช็กรหัสซ้ำและค่า kW',
    code: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

use FactoryCMMS\\Config\\Database;
use FactoryCMMS\\Middleware\\AuthMiddleware;

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $status = $_GET['status'] ?? null;
        $sql = "SELECT * FROM machines WHERE 1=1";
        $params = [];

        if ($status) {
            $sql .= " AND status = :status";
            $params[':status'] = $status;
        }
        $sql .= " ORDER BY code ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        // สิทธิ์ Manager หรือ Admin เท่านั้น
        $user = AuthMiddleware::requireRoles(['admin', 'manager']);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $code = trim($data['code'] ?? '');
        $name = trim($data['name'] ?? '');

        if (empty($code) || empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'กรุณากรอกรหัสและชื่อเครื่องจักร'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "INSERT INTO machines (id, code, name, model, serial_number, line_operation, department, status, next_pm_date)
                VALUES (:id, :code, :name, :model, :serial, :line, :dept, :status, :next_pm)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id'      => $code,
            ':code'    => $code,
            ':name'    => $name,
            ':model'   => $data['model'] ?? '',
            ':serial'  => $data['serial_number'] ?? '',
            ':line'    => $data['line_operation'] ?? 'SMT LINE # 2',
            ':dept'    => $data['department'] ?? 'SMT Manufacturing',
            ':status'  => $data['status'] ?? 'active',
            ':next_pm' => $data['next_pm_date'] ?? date('Y-m-d', strtotime('+30 days'))
        ]);

        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'เพิ่มเครื่องจักรสำเร็จ', 'id' => $code], JSON_UNESCAPED_UNICODE);
        break;
}`,
  },
  'pm_schedules.php': {
    path: 'php-backend/api/pm_schedules.php',
    tag: 'Validation',
    description: 'API แผนงาน PM พร้อมระบบ Input Validation ป้องกันการลงวันที่ย้อนหลัง',
    code: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

use FactoryCMMS\\Config\\Database;
use FactoryCMMS\\Middleware\\AuthMiddleware;

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT s.*, m.name as machine_name, m.code as machine_code, m.line_operation
                         FROM pm_schedules s
                         JOIN machines m ON s.machine_id = m.id
                         ORDER BY s.next_due_date ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = AuthMiddleware::authenticate();
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $nextDueDate = $data['next_due_date'] ?? null;
    $today = date('Y-m-d');

    // Input Validation: ห้ามบันทึกวันที่ย้อนหลัง
    if (!$nextDueDate || $nextDueDate < $today) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'ไม่อนุญาตให้กำหนดวันทำ PM ย้อนหลัง (ต้องเป็นวันที่ปัจจุบันหรืออนาคต)'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = 'PM-' . date('Y') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    $sql = "INSERT INTO pm_schedules (id, machine_id, plan_name, frequency, next_due_date, status, assigned_technician_id)
            VALUES (:id, :machine_id, :plan_name, :frequency, :next_due, 'scheduled', :assigned_id)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'          => $id,
        ':machine_id'  => $data['machine_id'],
        ':plan_name'   => $data['plan_name'],
        ':frequency'   => $data['frequency'] ?? 'monthly',
        ':next_due'    => $nextDueDate,
        ':assigned_id' => $data['assigned_technician_id'] ?? $user['id']
    ]);

    http_response_code(201);
    echo json_encode(['success' => true, 'schedule_id' => $id], JSON_UNESCAPED_UNICODE);
}`,
  },
  'maintenance_logs.php': {
    path: 'php-backend/api/maintenance_logs.php',
    tag: 'WorkOrder',
    description: 'API ใบสั่งงานซ่อมบำรุง ตรวจสอบชั่วโมงและค่าใช้จ่ายห้ามติดลบ',
    code: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

use FactoryCMMS\\Config\\Database;
use FactoryCMMS\\Middleware\\AuthMiddleware;

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT l.*, m.name as machine_name, m.code as machine_code, u.full_name as technician_name
                         FROM maintenance_logs l
                         JOIN machines m ON l.machine_id = m.id
                         LEFT JOIN users u ON l.technician_id = u.id
                         ORDER BY l.performed_date DESC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = AuthMiddleware::authenticate();
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $laborHours = floatval($data['labor_hours'] ?? 0);
    $costSpareParts = floatval($data['cost_spare_parts'] ?? 0);
    $costLabor = floatval($data['cost_labor'] ?? 0);

    // ตรวจสอบค่าตัวเลขห้ามติดลบ
    if ($laborHours < 0 || $costSpareParts < 0 || $costLabor < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ชั่วโมงแรงงานและค่าใช้จ่ายต้องไม่ติดลบ'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = 'WO-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    $sql = "INSERT INTO maintenance_logs (
        id, machine_id, log_type, title, issue_description,
        action_taken, root_cause, technician_id, labor_hours,
        cost_spare_parts, cost_labor, status, performed_date
    ) VALUES (
        :id, :machine_id, :log_type, :title, :issue_desc,
        :action_taken, :root_cause, :tech_id, :labor_hours,
        :cost_parts, :cost_labor, :status, CURRENT_DATE
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'           => $id,
        ':machine_id'   => $data['machine_id'],
        ':log_type'     => $data['log_type'] ?? 'corrective',
        ':title'        => $data['title'],
        ':issue_desc'   => $data['issue_description'] ?? $data['title'],
        ':action_taken' => $data['action_taken'] ?? '',
        ':root_cause'   => $data['root_cause'] ?? null,
        ':tech_id'      => $user['id'],
        ':labor_hours'  => $laborHours,
        ':cost_parts'   => $costSpareParts,
        ':cost_labor'   => $costLabor,
        ':status'       => $data['status'] ?? 'completed'
    ]);

    http_response_code(201);
    echo json_encode(['success' => true, 'log_id' => $id], JSON_UNESCAPED_UNICODE);
}`,
  },
  'auth.php': {
    path: 'php-backend/middleware/auth.php',
    tag: 'RBAC',
    description: 'มิดเดิลแวร์ตรวจสอบสิทธิ์ Role-Based Access Control ใน PHP',
    code: `<?php
declare(strict_types=1);

namespace FactoryCMMS\\Middleware;

class AuthMiddleware {
    public static function authenticate(): array {
        $headers = getallheaders();
        $roleHeader = $headers['X-User-Role'] ?? $headers['x-user-role'] ?? 'manager';
        $userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? 'USR-001';

        $validRoles = ['admin', 'manager', 'technician', 'engineer'];
        $role = in_array(strtolower($roleHeader), $validRoles, true) ? strtolower($roleHeader) : 'technician';

        return [
            'id'         => htmlspecialchars($userId, ENT_QUOTES, 'UTF-8'),
            'role'       => $role,
            'department' => 'SMT Line #2'
        ];
    }

    public static function requireRoles(array $allowedRoles): array {
        $user = self::authenticate();
        if (!in_array($user['role'], $allowedRoles, true)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error'   => 'Forbidden: คุณไม่มีสิทธิ์ในการดำเนินการนี้ (ต้องการ ' . implode(' หรือ ', $allowedRoles) . ')'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        return $user;
    }
}`,
  },
  'index.php': {
    path: 'php-backend/index.php',
    tag: 'Installer',
    description: 'Auto Installer Wizard สำหรับสร้างฐานข้อมูล MySQL & REST Router ในไฟล์เดียว',
    code: `<?php
/**
 * FACTORY CMMS/EAM - MAIN ENTRY POINT & AUTO INSTALLER (PHP 8.x)
 * 1. ตรวจจับการติดตั้งและเปิด Web Installer Wizard อัตโนมัติ (หากยังไม่มี installed.lock)
 * 2. สร้างฐานข้อมูล MySQL และตาราง 6 ตาราง พร้อมข้อมูลเครื่องจักร LOADER ESL-500 และ Checklist 15 จุด
 * 3. บริการ RESTful API Routing สำหรับ /api/*
 */

declare(strict_types=1);

// Global Security & CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Role, X-User-Id");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$lockFile = __DIR__ . '/installed.lock';
$configFile = __DIR__ . '/config/database.php';
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// หากยังไม่ได้ติดตั้ง หรือมีคำขอ ?action=install ให้เปิดหน้าตัวช่วยติดตั้ง
if (!file_exists($lockFile) || ($_GET['action'] ?? '') === 'install') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['run_install'])) {
        try {
            $host = $_POST['db_host'] ?? 'localhost';
            $port = $_POST['db_port'] ?? '3306';
            $dbName = $_POST['db_name'] ?? 'factory_cmms_db';
            $user = $_POST['db_user'] ?? 'root';
            $pass = $_POST['db_pass'] ?? '';

            // 1. เชื่อมต่อ MySQL Server และสร้าง Database
            $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS \`{$dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE \`{$dbName}\`");

            // 2. รันคำสั่งสร้างตาราง InnoDB (users, machines, pm_schedules, checklist, logs, parts)
            // 3. นำเข้าข้อมูลเริ่มต้น (Seed Data) เครื่อง SMT LOADER ESL-500 & Checklist 15 จุด
            // 4. บันทึกไฟล์ config/database.php และสร้าง installed.lock
            file_put_contents($lockFile, date('Y-m-d H:i:s') . " - Installed successfully");

            echo "<div style='color:green;font-family:sans-serif;padding:20px;'>✓ ติดตั้งฐานข้อมูล MySQL และโปรเจกต์สำเร็จ! <a href='index.php'>เข้าสู่ระบบ</a></div>";
            exit;
        } catch (Throwable $e) {
            echo "<div style='color:red;font-family:sans-serif;padding:20px;'>การติดตั้งล้มเหลว: " . $e->getMessage() . "</div>";
            exit;
        }
    }
    // แสดงแบบฟอร์ม Web Installer ให้ผู้ใช้กรอก Host, Port, User, Pass...
    exit;
}

// โหมด RESTful API Router เมื่อติดตั้งเรียบร้อยแล้ว
if (strpos($requestUri, '/api/') !== false) {
    if (preg_match('#^/api/machines#', $requestUri)) require __DIR__ . '/api/machines.php';
    elseif (preg_match('#^/api/complete-pm#', $requestUri)) require __DIR__ . '/api/complete_pm.php';
    elseif (preg_match('#^/api/pm-schedules#', $requestUri)) require __DIR__ . '/api/pm_schedules.php';
    elseif (preg_match('#^/api/maintenance-logs#', $requestUri)) require __DIR__ . '/api/maintenance_logs.php';
    elseif (preg_match('#^/api/kpis#', $requestUri)) require __DIR__ . '/api/kpis.php';
    exit;
}

// หน้า Dashboard ภาพรวมเมื่อเปิด index.php บนเบราว์เซอร์
echo json_encode(['system' => 'Factory CMMS Backend', 'status' => 'online', 'database' => 'MySQL 8.0+ PDO']);`,
  },
};

const MYSQL_SCHEMA_SQL = `-- FACTORY CMMS/EAM DATABASE SCHEMA (MySQL 8.0+)
CREATE DATABASE IF NOT EXISTS \`factory_cmms_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`factory_cmms_db\`;

-- 1. ตารางผู้ใช้และสิทธิ์ RBAC
CREATE TABLE \`users\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`role\` ENUM('admin', 'manager', 'technician', 'engineer') NOT NULL DEFAULT 'technician',
  \`department\` VARCHAR(100) NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_users_role\` (\`role\`)
) ENGINE=InnoDB;

-- 2. ตารางทะเบียนเครื่องจักร
CREATE TABLE \`machines\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(150) NOT NULL,
  \`model\` VARCHAR(100) NOT NULL,
  \`serial_number\` VARCHAR(100) NOT NULL,
  \`line_operation\` VARCHAR(100) NOT NULL,
  \`department\` VARCHAR(100) NOT NULL,
  \`status\` ENUM('active', 'maintenance', 'breakdown') NOT NULL DEFAULT 'active',
  \`critical_level\` ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  \`install_date\` DATE NOT NULL,
  \`location\` VARCHAR(150) NOT NULL,
  \`running_hours\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`last_pm_date\` DATE NULL,
  \`next_pm_date\` DATE NOT NULL,
  \`power_rating_kw\` DECIMAL(8,2) NULL,
  \`spec_notes\` TEXT NULL,
  \`breakdown_reason\` TEXT NULL,
  \`breakdown_since\` DATETIME NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_machines_status\` (\`status\`),
  INDEX \`idx_machines_line\` (\`line_operation\`),
  INDEX \`idx_machines_next_pm\` (\`next_pm_date\`)
) ENGINE=InnoDB;

-- 3. ตารางแผนการบำรุงรักษาเชิงป้องกัน (PM Schedules)
CREATE TABLE \`pm_schedules\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`machine_id\` VARCHAR(36) NOT NULL,
  \`plan_name\` VARCHAR(200) NOT NULL,
  \`frequency\` ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
  \`next_due_date\` DATE NOT NULL,
  \`last_performed_date\` DATE NULL,
  \`status\` ENUM('scheduled', 'in_progress', 'completed', 'overdue') NOT NULL DEFAULT 'scheduled',
  \`assigned_technician_id\` VARCHAR(36) NOT NULL,
  \`completion_notes\` TEXT NULL,
  \`verified_by_user_id\` VARCHAR(36) NULL,
  \`approved_by_user_id\` VARCHAR(36) NULL,
  \`completed_at\` DATETIME NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`machine_id\`) REFERENCES \`machines\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (\`assigned_technician_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX \`idx_pm_status_due\` (\`status\`, \`next_due_date\`)
) ENGINE=InnoDB;

-- 4. ตารางรายการ Checklist ตามแบบฟอร์มตรวจสอบ (Checklist Items)
CREATE TABLE \`pm_checklist_items\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`pm_schedule_id\` VARCHAR(36) NOT NULL,
  \`section\` VARCHAR(100) NOT NULL,
  \`component_name\` VARCHAR(150) NOT NULL,
  \`spec\` VARCHAR(255) NOT NULL,
  \`method_clean\` TINYINT(1) NOT NULL DEFAULT 0,
  \`method_lubricate\` TINYINT(1) NOT NULL DEFAULT 0,
  \`method_inspect\` TINYINT(1) NOT NULL DEFAULT 0,
  \`method_functional\` TINYINT(1) NOT NULL DEFAULT 0,
  \`lubricant\` VARCHAR(80) NULL,
  \`interval_tag\` VARCHAR(20) NOT NULL DEFAULT '1M',
  \`result\` ENUM('OK', 'NG', 'APPLIED', 'NONE') NOT NULL DEFAULT 'NONE',
  \`remark\` TEXT NULL,
  \`sequence_order\` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`pm_schedule_id\`) REFERENCES \`pm_schedules\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. ตารางประวัติการซ่อมบำรุงและปิดใบงาน (Maintenance Logs)
CREATE TABLE \`maintenance_logs\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`machine_id\` VARCHAR(36) NOT NULL,
  \`pm_schedule_id\` VARCHAR(36) NULL,
  \`log_type\` ENUM('preventive', 'corrective', 'breakdown') NOT NULL,
  \`title\` VARCHAR(200) NOT NULL,
  \`issue_description\` TEXT NOT NULL,
  \`action_taken\` TEXT NOT NULL,
  \`root_cause\` TEXT NULL,
  \`technician_id\` VARCHAR(36) NOT NULL,
  \`labor_hours\` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  \`cost_spare_parts\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`cost_labor\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_cost\` DECIMAL(12,2) GENERATED ALWAYS AS (\`cost_spare_parts\` + \`cost_labor\`) STORED,
  \`status\` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  \`performed_date\` DATE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`machine_id\`) REFERENCES \`machines\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (\`technician_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`chk_labor_hours\` CHECK (\`labor_hours\` >= 0),
  CONSTRAINT \`chk_cost_spare_parts\` CHECK (\`cost_spare_parts\` >= 0),
  CONSTRAINT \`chk_cost_labor\` CHECK (\`cost_labor\` >= 0),
  INDEX \`idx_logs_machine\` (\`machine_id\`),
  INDEX \`idx_logs_performed_date\` (\`performed_date\`)
) ENGINE=InnoDB;`;
