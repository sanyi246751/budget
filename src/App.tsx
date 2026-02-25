/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutList,
  ClipboardList,
  BarChart3,
  Briefcase,
  CircleDollarSign,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PageType,
  Project,
  Case,
  Payment,
  Settings,
  Analysis,
  APIResponse
} from './types';
import { apiService } from './services/apiService';

export default function App() {
  const [activePage, setActivePage] = useState<PageType>('entry');
  const [loading, setLoading] = useState(true);
  const [loaderText, setLoaderText] = useState('系統同步中...');

  const [projects, setProjects] = useState<any[][]>([]);
  const [cases, setCases] = useState<any[][]>([]);
  const [payments, setPayments] = useState<any[][]>([]);
  const [settings, setSettings] = useState<Settings>({
    categories: {},
    suggesters: {},
    staff: []
  });
  const [analysis, setAnalysis] = useState<Analysis>({
    categories: {},
    suggesters: {}
  });

  // Modals
  const [assignModal, setAssignModal] = useState<{ open: boolean; caseName: string }>({ open: false, caseName: '' });
  const [projEditModal, setProjEditModal] = useState<{ open: boolean; project: any; index: number }>({ open: false, project: null, index: -1 });
  const [fullEditModal, setFullEditModal] = useState<{ open: boolean; case: any }>({ open: false, case: null });
  const [payModal, setPayModal] = useState<{ open: boolean; caseName: string }>({ open: false, caseName: '' });

  const [entryKey, setEntryKey] = useState(0);

  const fetchData = async (text = '雲端資料同步中...') => {
    setLoading(true);
    setLoaderText(text);
    try {
      const data: APIResponse = await apiService.fetchAll();
      setProjects(data.projects);
      setCases(data.cases);
      setPayments(data.payments);
      setSettings(data.settings);
      setAnalysis(data.analysis);
    } catch (error) {
      console.error(error);
      alert('讀取失敗，請檢查網址或權限');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedProjects = useMemo(() => {
    const grouped: Record<string, {
      content: string;
      location: string;
      suggest: string;
      staff: string;
      status: string;
      photos: string;
      items: { cat: string; amt: number }[];
      total: number;
      originalIndex: number;
    }> = {};

    projects.forEach((r, i) => {
      const name = r[0];
      if (!grouped[name]) {
        grouped[name] = {
          content: r[1],
          location: r[2],
          suggest: r[3],
          staff: r[4],
          status: r[7],
          photos: r[9],
          items: [],
          total: 0,
          originalIndex: i
        };
      }
      grouped[name].items.push({ cat: r[6], amt: Number(r[5] || 0) });
      grouped[name].total += Number(r[5] || 0);
    });

    return grouped;
  }, [projects]);

  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const content = formData.get('content') as string;
    const suggestBy = formData.get('suggestBy') as string;
    const staff = formData.get('staff') as string;
    const isAutoCase = formData.get('autoCase') === 'on';
    const photos = (form.querySelector('#photos') as HTMLInputElement).files;

    const checkedCats = Array.from(form.querySelectorAll('input[name="budgetCats"]:checked')) as HTMLInputElement[];
    if (!name || checkedCats.length === 0) return alert('請填寫工程名稱並至少選擇一個科目');

    setLoading(true);
    setLoaderText('上傳中...');

    try {
      const fileDataList: { data: string; type: string }[] = [];
      if (photos) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const base64 = await toBase64(file);
          fileDataList.push({ data: base64, type: file.type });
        }
      }

      for (const cb of checkedCats) {
        const cat = cb.value;
        const amountInput = form.querySelector(`input[data-cat="${cat}"]`) as HTMLInputElement;
        const amount = amountInput.value;
        if (!amount) continue;

        await apiService.addProject({
          name,
          location,
          amount,
          category: cat,
          suggestBy,
          staff,
          content,
          fileDataList,
          isAutoCase
        });
        // Clear files for subsequent items of the same project if multiple categories
        fileDataList.length = 0;
      }

      alert('儲存成功');
      form.reset();
      setEntryKey(prev => prev + 1);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('儲存失敗');
      setLoading(false);
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const renderEntryPage = () => {
    return null; // Refactored to EntryPage component
  };

  const renderSummaryPage = () => {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-main" /> 原始建議工程清單
        </h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>工程名稱</th>
                <th>地點</th>
                <th>內容</th>
                <th>預算分配/合計</th>
                <th>建議/承辦</th>
                <th>照片</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedProjects).map(([name, g]: [string, any]) => (
                <tr key={name}>
                  <td className="font-bold">{name}</td>
                  <td className="text-xs text-slate-500">{g.location || '-'}</td>
                  <td className="max-w-xs text-xs text-slate-500">{g.content || '-'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {g.items.map((it, idx) => (
                        <span key={idx} className="tag">{it.cat}: ${it.amt.toLocaleString()}</span>
                      ))}
                    </div>
                    <div className="text-xs font-bold text-main border-t border-slate-100 pt-1">
                      合計：${g.total.toLocaleString()}
                    </div>
                  </td>
                  <td className="text-xs">
                    <div className="font-medium">{g.suggest}</div>
                    <div className="text-slate-400">{g.staff}</div>
                  </td>
                  <td>
                    {g.photos ? g.photos.split(',').map((u, j) => (
                      <a key={j} href={u} target="_blank" rel="noreferrer" className="text-main hover:underline mr-2 text-xs flex items-center gap-0.5">
                        圖{j + 1} <ExternalLink className="w-3 h-3" />
                      </a>
                    )) : '-'}
                  </td>
                  <td>
                    <span className={`font-bold ${g.status === '未分派' ? 'text-danger' : 'text-sec'}`}>
                      {g.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setProjEditModal({ open: true, project: projects[g.originalIndex], index: g.originalIndex })}
                        className="btn btn-warn p-1.5"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`確定刪除「${name}」？`)) {
                            setLoading(true);
                            await apiService.deleteProject(name);
                            fetchData();
                          }
                        }}
                        className="btn btn-del p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBudgetPage = () => {
    const drawTable = (title: string, data: Record<string, any>) => (
      <div className="card">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <table>
          <thead>
            <tr>
              <th>名稱</th>
              <th>總預算/額度</th>
              <th>已支用</th>
              <th>進度</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([k, d]) => {
              const rate = d.total > 0 ? (d.used / d.total * 100).toFixed(1) : '0';
              const numRate = parseFloat(rate);
              return (
                <tr key={k}>
                  <td className="font-bold">{k}</td>
                  <td>${d.total.toLocaleString()}</td>
                  <td>${d.used.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-10">{rate}%</span>
                      <div className="prog-bg flex-1">
                        <div
                          className="prog-fill"
                          style={{
                            width: `${Math.min(numRate, 100)}%`,
                            backgroundColor: numRate > 100 ? '#ef4444' : '#10b981'
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {drawTable('📂 預算科目分析', analysis.categories)}
        {drawTable('👤 建議者分析', analysis.suggesters)}
      </div>
    );
  };

  const renderCasePage = () => {
    const handleCreateCase = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const name = formData.get('name') as string;
      const budget = Number(formData.get('budget'));
      const vendor = formData.get('vendor') as string;

      if (!name) return alert('請輸入標案名稱');
      setLoading(true);
      setLoaderText('建立中...');
      try {
        await apiService.createCase({
          newName: name,
          budget,
          vendor,
          status: '招標中',
          total: 0,
          oldName: ''
        });
        form.reset();
        fetchData();
      } catch (error) {
        console.error(error);
        alert('建立失敗');
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="card bg-slate-100 border border-slate-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> 快速建立標案
          </h3>
          <form onSubmit={handleCreateCase} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" name="name" placeholder="輸入新標案名稱" className="p-2 border rounded-md" />
            <input type="number" name="budget" placeholder="預算金額" className="p-2 border rounded-md" />
            <input type="text" name="vendor" placeholder="得標廠商(選填)" className="p-2 border rounded-md" />
            <button type="submit" className="btn btn-main justify-center">建立標案</button>
          </form>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-main" /> 標案清單
          </h3>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>標案名稱</th>
                  <th>預算/決標</th>
                  <th>廠商</th>
                  <th>連結工程項目</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c, idx) => {
                  const linkedProjects = projects.filter(p => p[7] === c[0]);
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="font-bold">{c[0]}</div>
                        <span className="tag mt-1">{c[3]}</span>
                      </td>
                      <td>
                        <div className="text-xs text-slate-400">預：${Number(c[1] || 0).toLocaleString()}</div>
                        <div className="font-bold text-sec">決：${Number(c[2] || 0).toLocaleString()}</div>
                      </td>
                      <td>{c[4] || '-'}</td>
                      <td>
                        <div className="space-y-1">
                          {linkedProjects.map((lp, i) => (
                            <div key={i} className="flex items-center justify-between group py-1 border-b border-slate-100 last:border-0">
                              <span className="text-[12px] text-slate-600 font-medium">• {lp[0]} ({lp[6]}) - ${Number(lp[5] || 0).toLocaleString()}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setProjEditModal({ open: true, project: lp, index: projects.indexOf(lp) })}
                                  className="text-amber-500 hover:text-amber-600 p-0.5" title="編輯項目"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`確定要將「${lp[0]}」從本標案中解除連結嗎？\n(項目將退回「未分派」狀態)`)) {
                                      setLoading(true);
                                      await apiService.assignProject(lp[0], '未分派');
                                      fetchData();
                                    }
                                  }}
                                  className="text-slate-400 hover:text-slate-600 p-0.5" title="解除連結"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`確定要完全刪除工程項目「${lp[0]}」嗎？此操作無法復原！`)) {
                                      setLoading(true);
                                      await apiService.deleteProject(lp[0]);
                                      fetchData();
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-600 p-0.5" title="完全刪除項目"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {linkedProjects.length === 0 && <span className="text-slate-400 italic text-[12px]">尚未連結項目</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setFullEditModal({ open: true, case: c })}
                            className="btn btn-main p-1.5" title="詳情"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAssignModal({ open: true, caseName: c[0] })}
                            className="btn btn-sec p-1.5" title="連結項目"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`標案「${c[0]}」將刪除，相關項目將回歸未分派。確定？`)) {
                                setLoading(true);
                                await apiService.deleteCase(c[0]);
                                fetchData();
                              }
                            }}
                            className="btn btn-del p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPayPage = () => {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CircleDollarSign className="w-6 h-6 text-main" /> 請款核銷監控
        </h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>標案名稱</th>
                <th>決標金額</th>
                <th>累計請款 / 剩餘</th>
                <th>撥款進度</th>
                <th>功能</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => {
                const paid = payments.filter(p => p[0] === c[0]).reduce((a, b) => a + Number(b[2] || 0), 0);
                const total = Number(c[2]) || 0;
                const rate = total > 0 ? (paid / total * 100).toFixed(1) : '0';
                const numRate = parseFloat(rate);
                return (
                  <tr key={idx}>
                    <td className="font-bold">{c[0]}</td>
                    <td>${total.toLocaleString()}</td>
                    <td>
                      <div className="text-sec font-bold">已領: ${paid.toLocaleString()}</div>
                      <div className="text-danger text-xs">剩餘: ${(total - paid).toLocaleString()}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-12">{rate}%</span>
                        <div className="prog-bg flex-1">
                          <div className="prog-fill" style={{ width: `${Math.min(numRate, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => setPayModal({ open: true, caseName: c[0] })}
                        className="btn btn-warn"
                      >
                        請款紀錄
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettingsPage = () => {
    return null; // Refactored to SettingsPage component
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 z-[9999] flex flex-col items-center justify-center"
          >
            <Loader2 className="w-12 h-12 text-main animate-spin-custom mb-4" />
            <h3 className="text-xl font-bold text-slate-700">{loaderText}</h3>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="bg-slate-800 sticky top-0 z-[100] shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-center overflow-x-auto no-scrollbar">
          {[
            { id: 'entry', label: '工程登錄', icon: LayoutList },
            { id: 'summary', label: '工程總表', icon: ClipboardList },
            { id: 'budget', label: '預算看板', icon: BarChart3 },
            { id: 'case', label: '標案管理', icon: Briefcase },
            { id: 'pay', label: '請款核銷', icon: CircleDollarSign },
            { id: 'settings', label: '系統設定', icon: SettingsIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id as PageType)}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${activePage === tab.id
                ? 'text-white bg-slate-700 border-b-4 border-main'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activePage === 'entry' && <EntryPage key={entryKey} settings={settings} handleSaveProject={handleSaveProject} />}
            {activePage === 'summary' && renderSummaryPage()}
            {activePage === 'budget' && renderBudgetPage()}
            {activePage === 'case' && renderCasePage()}
            {activePage === 'pay' && renderPayPage()}
            {activePage === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} fetchData={fetchData} setLoading={setLoading} setLoaderText={setLoaderText} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {assignModal.open && (
          <Modal title={`🔗 連結項目至：${assignModal.caseName}`} onClose={() => setAssignModal({ open: false, caseName: '' })}>
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-slate-500 mb-4">請選擇要納入此標案的「未分派」項目：</p>
              <table>
                <thead>
                  <tr>
                    <th>選擇</th>
                    <th>項目名稱</th>
                    <th>科目</th>
                    <th>金額</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.filter(p => p[7] === '未分派').map((p, i) => (
                    <tr key={i}>
                      <td><input type="checkbox" className="assign-chk w-5 h-5" value={p[0]} /></td>
                      <td>{p[0]}</td>
                      <td>{p[6]}</td>
                      <td>${Number(p[5] || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {projects.filter(p => p[7] === '未分派').length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">目前無未分派工程項目</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="btn btn-main flex-1 justify-center py-3"
                onClick={async () => {
                  const chks = document.querySelectorAll('.assign-chk:checked') as NodeListOf<HTMLInputElement>;
                  if (chks.length === 0) return alert('請至少勾選一個項目');
                  setLoading(true);
                  setLoaderText('連結處理中...');
                  try {
                    await Promise.all(Array.from(chks).map(cb => apiService.assignProject(cb.value, assignModal.caseName)));
                    alert('分派完成！');
                    setAssignModal({ open: false, caseName: '' });
                    fetchData();
                  } catch (error) {
                    console.error(error);
                    alert('分派失敗');
                    setLoading(false);
                  }
                }}
              >確認連結</button>
              <button className="btn bg-slate-200 text-slate-700 flex-1 justify-center py-3" onClick={() => setAssignModal({ open: false, caseName: '' })}>取消</button>
            </div>
          </Modal>
        )}

        {projEditModal.open && (
          <Modal title="✏️ 修改工程建議項目" onClose={() => setProjEditModal({ open: false, project: null, index: -1 })}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                action: "updateProject",
                oldName: projEditModal.project[0],
                oldCat: projEditModal.project[6],
                name: formData.get('name'),
                location: formData.get('location'),
                content: formData.get('content'),
                amount: formData.get('amount'),
                category: formData.get('category'),
                suggestBy: formData.get('suggestBy'),
                staff: formData.get('staff')
              };
              setLoading(true);
              await apiService.updateProject(data);
              setProjEditModal({ open: false, project: null, index: -1 });
              fetchData();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">工程名稱</label>
                <input type="text" name="name" defaultValue={projEditModal.project[0]} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">工程地點</label>
                <input type="text" name="location" defaultValue={projEditModal.project[2]} className="w-full p-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">科目</label>
                  <select name="category" defaultValue={projEditModal.project[6]} className="w-full p-2 border rounded-md">
                    {Object.keys(settings.categories).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">金額</label>
                  <input type="number" name="amount" defaultValue={projEditModal.project[5]} className="w-full p-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">建議者</label>
                  <select name="suggestBy" defaultValue={projEditModal.project[3]} className="w-full p-2 border rounded-md">
                    {Object.keys(settings.suggesters).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">承辦人</label>
                  <select name="staff" defaultValue={projEditModal.project[4]} className="w-full p-2 border rounded-md">
                    {settings.staff.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">內容描述</label>
                <textarea name="content" rows={3} defaultValue={projEditModal.project[1]} className="w-full p-2 border rounded-md"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-main flex-1 justify-center py-3">更新</button>
                <button type="button" className="btn bg-slate-200 text-slate-700 flex-1 justify-center py-3" onClick={() => setProjEditModal({ open: false, project: null, index: -1 })}>取消</button>
              </div>
            </form>
          </Modal>
        )}

        {fullEditModal.open && (
          <Modal title="✏️ 標案詳情編輯" onClose={() => setFullEditModal({ open: false, case: null })}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const total = Number(formData.get('c1')) + Number(formData.get('c2')) + Number(formData.get('c3')) + Number(formData.get('c4'));
              const data = {
                action: "updateFullCase",
                oldName: fullEditModal.case[0],
                newName: formData.get('name'),
                status: formData.get('status'),
                budget: formData.get('budget'),
                vendor: formData.get('vendor'),
                awardDate: "",
                duration: "",
                constCost: formData.get('c1'),
                pollutionCost: formData.get('c2'),
                mgmtCost: formData.get('c3'),
                customCost: formData.get('c4'),
                total: total
              };
              setLoading(true);
              await apiService.createCase(data as any);
              setFullEditModal({ open: false, case: null });
              fetchData();
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="name" defaultValue={fullEditModal.case[0]} placeholder="標案名稱" className="p-2 border rounded-md" />
                <select name="status" defaultValue={fullEditModal.case[3]} className="p-2 border rounded-md">
                  <option value="招標中">招標中</option>
                  <option value="執行中">執行中</option>
                  <option value="已結案">已結案</option>
                </select>
                <input type="number" name="budget" defaultValue={fullEditModal.case[1]} placeholder="預算金額" className="p-2 border rounded-md" />
                <input type="text" name="vendor" defaultValue={fullEditModal.case[4]} placeholder="承包廠商" className="p-2 border rounded-md" />
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <b className="block mb-3">💰 決標明細</b>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 ml-1">工程費</span>
                    <input type="number" name="c1" defaultValue={fullEditModal.case[8]} className="p-2 border rounded-md" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 ml-1">空污費</span>
                    <input type="number" name="c2" defaultValue={fullEditModal.case[9]} className="p-2 border rounded-md" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 ml-1">管理費</span>
                    <input type="number" name="c3" defaultValue={fullEditModal.case[10]} className="p-2 border rounded-md" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 ml-1">其他費用</span>
                    <input type="number" name="c4" defaultValue={fullEditModal.case[12]} className="p-2 border rounded-md" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-main flex-1 justify-center py-3">更新標案</button>
                <button type="button" className="btn bg-slate-200 text-slate-700 flex-1 justify-center py-3" onClick={() => setFullEditModal({ open: false, case: null })}>取消</button>
              </div>
            </form>
          </Modal>
        )}

        {payModal.open && (
          <Modal title={`💰 請款管理：${payModal.caseName}`} onClose={() => setPayModal({ open: false, caseName: '' })}>
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-6">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const data = {
                  tenderName: payModal.caseName,
                  stage: formData.get('stage') as string,
                  amount: formData.get('amount') as string,
                  date: formData.get('date') as string,
                  invoice: formData.get('invoice') as string
                };
                setLoading(true);
                await apiService.savePayment(data);
                form.reset();
                fetchData('更新請款紀錄中...');
              }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="stage" placeholder="期別" required className="p-2 border rounded-md" />
                  <input type="number" name="amount" placeholder="金額" required className="p-2 border rounded-md" />
                  <input type="date" name="date" required className="p-2 border rounded-md" />
                  <input type="text" name="invoice" placeholder="發票/備註" className="p-2 border rounded-md" />
                </div>
                <button type="submit" className="btn btn-warn w-full justify-center py-2.5">新增請款紀錄</button>
              </form>
            </div>
            <div className="max-h-[40vh] overflow-y-auto">
              <table>
                <thead>
                  <tr>
                    <th>期別/日期</th>
                    <th>請款金額</th>
                    <th>備註</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.filter(p => p[0] === payModal.caseName).map((h, i) => (
                    <tr key={i}>
                      <td>
                        <div className="font-bold">{h[1]}</div>
                        <div className="text-[10px] text-slate-400">{h[3] ? h[3].split('T')[0] : ''}</div>
                      </td>
                      <td className="font-bold text-sec">${Number(h[2]).toLocaleString()}</td>
                      <td className="text-xs">{h[4] || '-'}</td>
                      <td>
                        <button
                          onClick={async () => {
                            if (confirm('確定刪除此請款紀錄？')) {
                              setLoading(true);
                              await apiService.deletePayment(h[6]);
                              fetchData();
                            }
                          }}
                          className="btn btn-del p-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.filter(p => p[0] === payModal.caseName).length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6 text-slate-400 italic">尚無請款紀錄</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button className="btn bg-slate-200 text-slate-700 w-full justify-center py-3 mt-6" onClick={() => setPayModal({ open: false, caseName: '' })}>關閉</button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function EntryPage({ settings, handleSaveProject }: { settings: Settings; handleSaveProject: (e: React.FormEvent<HTMLFormElement>) => void }) {
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const handleCatChange = (cat: string, checked: boolean) => {
    if (checked) {
      setSelectedCats([...selectedCats, cat]);
    } else {
      setSelectedCats(selectedCats.filter(c => c !== cat));
    }
  };

  const calculateTotal = () => {
    let sum = 0;
    document.querySelectorAll('.split-amt').forEach((el: any) => {
      sum += Number(el.value || 0);
    });
    setTotalAmount(sum);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold text-main mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6" /> 新增工程建議項目
        </h2>
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">工程名稱*</label>
            <input type="text" name="name" required className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">工程地點</label>
            <input type="text" name="location" className="w-full p-2 border rounded-md" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">建議者</label>
              <select name="suggestBy" className="w-full p-2 border rounded-md">
                <option value="">--請選擇--</option>
                {Object.keys(settings.suggesters).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">承辦人</label>
              <select name="staff" className="w-full p-2 border rounded-md">
                <option value="">--請選擇--</option>
                {settings.staff.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">工程內容</label>
            <textarea name="content" rows={2} className="w-full p-2 border rounded-md"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">📌 預算科目分配 (可複選)</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              {Object.keys(settings.categories).map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer hover:text-main transition-colors">
                  <input
                    type="checkbox"
                    name="budgetCats"
                    value={c}
                    onChange={(e) => handleCatChange(c, e.target.checked)}
                    className="w-4 h-4"
                  /> {c}
                </label>
              ))}
            </div>
          </div>

          {selectedCats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 p-4 rounded-lg border border-emerald-200"
            >
              <h4 className="font-bold text-emerald-700 mb-3">💰 分配科目金額</h4>
              <div className="space-y-2">
                {selectedCats.map(cat => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="flex-1 text-sm">{cat}</span>
                    <input
                      type="number"
                      data-cat={cat}
                      onChange={calculateTotal}
                      className="split-amt w-32 p-1.5 border rounded-md"
                      placeholder="金額"
                    />
                  </div>
                ))}
              </div>
              <div className="text-right mt-3 pt-3 border-t border-emerald-200">
                合計：<span className="text-lg font-bold text-main">${totalAmount.toLocaleString()}</span>
              </div>
            </motion.div>
          )}

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="autoCase" className="w-5 h-5" />
              <span className="font-medium">⚡ 自動同步至標案管理</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">照片上傳</label>
            <input type="file" id="photos" multiple accept="image/*" className="w-full p-2 border rounded-md bg-white" />
          </div>

          <button type="submit" className="btn btn-main w-full py-4 text-lg mt-4 shadow-lg shadow-blue-200">
            儲存送出項目
          </button>
        </form>
      </div>
    </div>
  );
}

function SettingsPage({
  settings,
  setSettings,
  fetchData,
  setLoading,
  setLoaderText
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  fetchData: () => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLoaderText: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [newCat, setNewCat] = useState({ name: '', budget: '' });
  const [newSug, setNewSug] = useState({ name: '', budget: '' });
  const [newStaff, setNewStaff] = useState('');

  const handleUpdateSetting = (type: 'categories' | 'suggesters' | 'staff', key: any, newName: string | null, newVal: number | null) => {
    const newSettings = { ...settings };
    if (type === 'staff') {
      newSettings.staff[key] = newName!;
    } else {
      const target = newSettings[type];
      if (newName !== null && newName !== key) {
        target[newName] = target[key];
        delete target[key];
      } else if (newVal !== null) {
        target[key] = newVal;
      }
    }
    setSettings(newSettings);
  };

  const handleDeleteSetting = (type: 'categories' | 'suggesters' | 'staff', key: any) => {
    if (!confirm('確定刪除此設定？')) return;
    const newSettings = { ...settings };
    if (type === 'staff') {
      newSettings.staff.splice(key, 1);
    } else {
      delete newSettings[type][key];
    }
    setSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-4">📂 預算科目管理</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="科目名稱"
              value={newCat.name}
              onChange={e => setNewCat({ ...newCat, name: e.target.value })}
              className="flex-1 p-2 border rounded-md"
            />
            <input
              type="number"
              placeholder="預算"
              value={newCat.budget}
              onChange={e => setNewCat({ ...newCat, budget: e.target.value })}
              className="w-32 p-2 border rounded-md"
            />
            <button
              onClick={() => {
                if (!newCat.name) return;
                setSettings({ ...settings, categories: { ...settings.categories, [newCat.name]: Number(newCat.budget) } });
                setNewCat({ name: '', budget: '' });
              }}
              className="btn btn-sec"
            >新增</button>
          </div>
          <table>
            <thead><tr><th>名稱</th><th>預算</th><th>操作</th></tr></thead>
            <tbody>
              {Object.entries(settings.categories).map(([k, v]) => (
                <tr key={k}>
                  <td><input type="text" defaultValue={k} onBlur={e => handleUpdateSetting('categories', k, e.target.value, null)} className="w-full p-1 border rounded" /></td>
                  <td><input type="number" defaultValue={v} onBlur={e => handleUpdateSetting('categories', k, null, Number(e.target.value))} className="w-full p-1 border rounded" /></td>
                  <td><button onClick={() => handleDeleteSetting('categories', k)} className="btn btn-del p-1"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">👤 建議者額度管理</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="建議者姓名"
              value={newSug.name}
              onChange={e => setNewSug({ ...newSug, name: e.target.value })}
              className="flex-1 p-2 border rounded-md"
            />
            <input
              type="number"
              placeholder="額度"
              value={newSug.budget}
              onChange={e => setNewSug({ ...newSug, budget: e.target.value })}
              className="w-32 p-2 border rounded-md"
            />
            <button
              onClick={() => {
                if (!newSug.name) return;
                setSettings({ ...settings, suggesters: { ...settings.suggesters, [newSug.name]: Number(newSug.budget) } });
                setNewSug({ name: '', budget: '' });
              }}
              className="btn btn-sec"
            >新增</button>
          </div>
          <table>
            <thead><tr><th>名稱</th><th>額度</th><th>操作</th></tr></thead>
            <tbody>
              {Object.entries(settings.suggesters).map(([k, v]) => (
                <tr key={k}>
                  <td><input type="text" defaultValue={k} onBlur={e => handleUpdateSetting('suggesters', k, e.target.value, null)} className="w-full p-1 border rounded" /></td>
                  <td><input type="number" defaultValue={v} onBlur={e => handleUpdateSetting('suggesters', k, null, Number(e.target.value))} className="w-full p-1 border rounded" /></td>
                  <td><button onClick={() => handleDeleteSetting('suggesters', k)} className="btn btn-del p-1"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card max-w-xl">
        <h3 className="text-lg font-bold mb-4">👷 承辦人員名單</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="人員姓名"
            value={newStaff}
            onChange={e => setNewStaff(e.target.value)}
            className="flex-1 p-2 border rounded-md"
          />
          <button
            onClick={() => {
              if (!newStaff) return;
              setSettings({ ...settings, staff: [...settings.staff, newStaff] });
              setNewStaff('');
            }}
            className="btn btn-sec"
          >新增</button>
        </div>
        <table>
          <thead><tr><th>人員姓名</th><th>操作</th></tr></thead>
          <tbody>
            {settings.staff.map((s, i) => (
              <tr key={i}>
                <td><input type="text" defaultValue={s} onBlur={e => handleUpdateSetting('staff', i, e.target.value, null)} className="w-full p-1 border rounded" /></td>
                <td><button onClick={() => handleDeleteSetting('staff', i)} className="btn btn-del p-1"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={async () => {
          setLoading(true);
          setLoaderText('儲存設定中...');
          await apiService.saveSettings(settings);
          fetchData();
        }}
        className="btn btn-main w-full py-4 text-lg shadow-lg"
      >
        💾 儲存所有設定並同步
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
