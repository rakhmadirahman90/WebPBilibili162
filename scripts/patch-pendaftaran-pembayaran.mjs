import fs from 'node:fs';

const path = 'src/ManajemenPendaftaran.tsx';
let code = fs.readFileSync(path, 'utf8');

const marker = '// PAYMENT_DASHBOARD_PATCH_V1';
if (code.includes(marker)) process.exit(0);

// 1) Extend the registrant model with payment fields. The fields are optional so the UI
// remains readable while the database migration is being applied.
code = code.replace(
  "  status?: string; // 'Pending' | 'Diterima' | 'Ditolak'\n}",
  "  status?: string; // 'Pending' | 'Diterima' | 'Ditolak'\n  nominal_pendaftaran?: number | null;\n  status_pembayaran?: string | null;\n  dibayar_pada?: string | null;\n  // PAYMENT_DASHBOARD_PATCH_V1\n  [key: string]: any;\n}"
);

// 2) Add payment helpers and realtime dashboard totals after the status helper.
const paymentHelpers = `
// PAYMENT_DASHBOARD_PATCH_V1
const getPaymentAmount = (item: Registrant): number => {
  const raw = item.nominal_pendaftaran ?? item.nominal ?? item.payment_amount ?? item.jumlah_pembayaran ?? 0;
  const value = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9-]/g, ''));
  return Number.isFinite(value) ? value : 0;
};

const getPaymentStatus = (item: Registrant): 'Lunas' | 'Belum Bayar' => {
  const raw = item.status_pembayaran ?? item.payment_status ?? item.pembayaran ?? '';
  const clean = String(raw).trim().toLowerCase();
  return ['lunas', 'paid', 'terverifikasi', 'verified', 'dibayar', 'settled'].includes(clean) ? 'Lunas' : 'Belum Bayar';
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

const totalPembayaran = registrants.reduce((sum, item) => sum + getPaymentAmount(item), 0);
const totalLunas = registrants.filter(item => getPaymentStatus(item) === 'Lunas').length;
const totalBelumBayar = registrants.filter(item => getPaymentStatus(item) === 'Belum Bayar').length;
const totalLunasNominal = registrants
  .filter(item => getPaymentStatus(item) === 'Lunas')
  .reduce((sum, item) => sum + getPaymentAmount(item), 0);
`;
code = code.replace(
  "const getStatusCategory = (st?: string): 'pending' | 'diterima' | 'ditolak' => {",
  paymentHelpers + "\nconst getStatusCategory = (st?: string): 'pending' | 'diterima' | 'ditolak' => {"
);

// 3) Include payment columns in Excel/PDF exports.
code = code.replace(
  "      Kategori_Atlet: item.kategori_atlet || '-',\n      WhatsApp:",
  "      Kategori_Atlet: item.kategori_atlet || '-',\n      Nominal_Pendaftaran: getPaymentAmount(item),\n      Status_Pembayaran: getPaymentStatus(item),\n      Dibayar_Pada: item.dibayar_pada ? new Date(item.dibayar_pada).toLocaleString('id-ID') : '-',\n      WhatsApp:"
);
code = code.replace(
  'const tableColumn = ["No", "Nama Atlet", "Gender", "Kat. Atlet", "Kat. Umur", "Domisili", "WhatsApp", "Tgl Daftar"];',
  'const tableColumn = ["No", "Nama Atlet", "Gender", "Kat. Atlet", "Kat. Umur", "Nominal", "Pembayaran", "Domisili", "WhatsApp", "Tgl Daftar"];'
);
code = code.replace(
  "      item.kategori || '-',\n      item.domisili || '-',",
  "      item.kategori || '-',\n      formatRupiah(getPaymentAmount(item)),\n      getPaymentStatus(item),\n      item.domisili || '-',"
);

// 4) Add payment values to import and new-record defaults.
code = code.replace(
  "          jenis_kelamin: item.Gender || item.jenis_kelamin || 'Putra',\n        }));",
  "          jenis_kelamin: item.Gender || item.jenis_kelamin || 'Putra',\n          nominal_pendaftaran: Number(item.Nominal_Pendaftaran || item.nominal_pendaftaran || item.Nominal || 0) || 0,\n          status_pembayaran: item.Status_Pembayaran || item.status_pembayaran || 'Belum Bayar',\n          dibayar_pada: item.Dibayar_Pada || item.dibayar_pada || null,\n        }));"
);
code = code.replace(
  "    status: 'Pending'\n  });",
  "    status: 'Pending',\n    nominal_pendaftaran: 0,\n    status_pembayaran: 'Belum Bayar',\n    dibayar_pada: null\n  });"
);

// 5) Add payment inputs to add/edit submissions.
code = code.replace(
  "        domisili: (newItem.domisili || '').toUpperCase().trim()\n      }]);",
  "        domisili: (newItem.domisili || '').toUpperCase().trim(),\n        nominal_pendaftaran: Number(newItem.nominal_pendaftaran || 0),\n        status_pembayaran: newItem.status_pembayaran || 'Belum Bayar',\n        dibayar_pada: (newItem.status_pembayaran || 'Belum Bayar') === 'Lunas' ? (newItem.dibayar_pada || new Date().toISOString()) : null\n      }]);"
);
code = code.replace(
  "foto_url: '', kategori_atlet: 'Muda' });",
  "foto_url: '', kategori_atlet: 'Muda', status: 'Pending', nominal_pendaftaran: 0, status_pembayaran: 'Belum Bayar', dibayar_pada: null });"
);
code = code.replace(
  "foto_url: editingItem.foto_url\n      })",
  "foto_url: editingItem.foto_url,\n        nominal_pendaftaran: Number(editingItem.nominal_pendaftaran || 0),\n        status_pembayaran: editingItem.status_pembayaran || 'Belum Bayar',\n        dibayar_pada: (editingItem.status_pembayaran || 'Belum Bayar') === 'Lunas' ? (editingItem.dibayar_pada || new Date().toISOString()) : null\n      })"
);

// 6) Add dashboard payment cards after the Senior card.
const dashboardCards = `
          {/* PAYMENT CARDS */}
          <div className="bg-white p-4 rounded-[1.2rem] border border-emerald-100 shadow-sm flex items-center justify-between col-span-2 md:col-span-1 lg:col-span-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pembayaran</p>
              <p className="text-xl md:text-2xl font-black text-emerald-600 mt-0.5 truncate">{formatRupiah(totalPembayaran)}</p>
              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Terkumpul Lunas: <span className="text-emerald-600">{formatRupiah(totalLunasNominal)}</span></p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-[1.2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lunas</p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalLunas}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Check size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-[1.2rem] border border-amber-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Belum Bayar</p>
              <p className="text-2xl font-black text-amber-600 mt-0.5">{totalBelumBayar}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
          </div>
`;
code = code.replace(
  "        </section>\n\n        {/* SEARCH BAR & STATUS FILTER */}",
  dashboardCards + "        </section>\n\n        {/* SEARCH BAR & STATUS FILTER */"
);

// 7) Add desktop table columns and cells.
code = code.replace(
  '<th className="px-2 py-4 font-bold uppercase text-[9px] tracking-widest">Kategori Atlet</th>\n                  <th className="px-2 py-4 font-bold uppercase text-[9px] tracking-widest">Kontak WA</th>',
  '<th className="px-2 py-4 font-bold uppercase text-[9px] tracking-widest">Kategori Atlet</th>\n                  <th className="px-2 py-4 font-bold uppercase text-[9px] tracking-widest">Nominal Pendaftaran</th>\n                  <th className="px-2 py-4 font-bold uppercase text-[9px] tracking-widest">Status Pembayaran</th>\n                  <th className="px-2 py-4 font-bold uppercase text-[9px] tracking-widest">Kontak WA</th>'
);
code = code.replace(
  "                    <td className=\"px-2 py-3 whitespace-nowrap\">\n                      <a href={`https://wa.me/${(item.whatsapp || '').replace(/\\D/g, '')}`}",
  `                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="font-black text-emerald-600 text-[10px]">{formatRupiah(getPaymentAmount(item))}</div>
                      <div className="text-[8px] text-slate-400 uppercase">biaya pendaftaran</div>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      {getPaymentStatus(item) === 'Lunas' ? (
                        <span className="px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1"><Check size={10} /> LUNAS</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-300 inline-flex items-center gap-1"><Clock size={10} /> BELUM BAYAR</span>
                      )}
                      {item.dibayar_pada && getPaymentStatus(item) === 'Lunas' && <div className="text-[7px] text-slate-400 mt-1">{new Date(item.dibayar_pada).toLocaleDateString('id-ID')}</div>}
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <a href={`https://wa.me/${(item.whatsapp || '').replace(/\\D/g, '')}`}`
);

// 8) Add payment details to mobile cards.
code = code.replace(
  '                  <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-100 text-[10px]">',
  `                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 text-[10px]">
                    <div className="rounded-lg bg-emerald-50 p-2"><div className="text-[8px] text-slate-400 font-bold uppercase">Nominal</div><div className="font-black text-emerald-700">{formatRupiah(getPaymentAmount(item))}</div></div>
                    <div className={\`rounded-lg p-2 \${getPaymentStatus(item) === 'Lunas' ? 'bg-emerald-50' : 'bg-amber-50'}\`}><div className="text-[8px] text-slate-400 font-bold uppercase">Pembayaran</div><div className={\`font-black uppercase \${getPaymentStatus(item) === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'}\`}>{getPaymentStatus(item)}</div></div>
                  </div>

                  <div className="flex flex-col gap-1 text-[10px]">`
);

// 9) Add payment fields to add modal before the save button.
const paymentForm = `
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nominal Pendaftaran (Rp)</label>
                  <input type="number" min="0" step="1000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:border-blue-600 focus:bg-white" placeholder="0" value={newItem.nominal_pendaftaran ?? 0} onChange={e => setNewItem({...newItem, nominal_pendaftaran: Number(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Status Pembayaran</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:border-blue-600 focus:bg-white" value={newItem.status_pembayaran || 'Belum Bayar'} onChange={e => setNewItem({...newItem, status_pembayaran: e.target.value})}>
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>
`;
code = code.replace(
  '              <div className="pt-4 border-t border-slate-100">\n                <button type="submit" disabled={isSaving || uploading} className="w-full py-4 bg-blue-600',
  paymentForm + '\n              <div className="pt-4 border-t border-slate-100">\n                <button type="submit" disabled={isSaving || uploading} className="w-full py-4 bg-blue-600',
);

// The edit modal has the same save-button class but a different background.
const editPaymentForm = `
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nominal Pendaftaran (Rp)</label>
                  <input type="number" min="0" step="1000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:border-blue-600" value={editingItem.nominal_pendaftaran ?? 0} onChange={e => setEditingItem({...editingItem, nominal_pendaftaran: Number(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Status Pembayaran</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs outline-none focus:border-blue-600" value={editingItem.status_pembayaran || 'Belum Bayar'} onChange={e => setEditingItem({...editingItem, status_pembayaran: e.target.value})}>
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>
`;
code = code.replace(
  '              <div className="pt-4 border-t border-slate-100">\n                <button type="submit" disabled={isSaving || uploading} className="w-full py-4 bg-slate-900',
  editPaymentForm + '\n              <div className="pt-4 border-t border-slate-100">\n                <button type="submit" disabled={isSaving || uploading} className="w-full py-4 bg-slate-900',
);

fs.writeFileSync(path, code);
console.log('Patched ManajemenPendaftaran with registration amount/payment status dashboard.');
`;

// no-op marker is deliberately written by the patch itself
