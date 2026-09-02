import fs from 'node:fs';

const file = 'src/ManajemenPendaftaran.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import './pendaftaran-add-mobile.css';")) {
  code = code.replace("import './pendaftaran-responsive.css';", "import './pendaftaran-responsive.css';\nimport './pendaftaran-add-mobile.css';");
}

const replacements = [
  [
    'className="fixed inset-0 z-[100] flex items-center justify-center p-4">\n          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />\n          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">',
    'className="pendaftaran-add-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">\n          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />\n          <div className="pendaftaran-add-modal relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">'
  ],
  [
    'className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">\n              <div>\n                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Tambah',
    'className="pendaftaran-add-header px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">\n              <div>\n                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Tambah'
  ],
  [
    '<form onSubmit={handleAddSubmit} className="p-8 space-y-5">',
    '<form onSubmit={handleAddSubmit} className="pendaftaran-add-form p-8 space-y-5">'
  ],
  [
    '<div className="flex items-center gap-6 mb-2">\n                <div className="relative">',
    '<div className="pendaftaran-add-profile flex items-center gap-6 mb-2">\n                <div className="relative">'
  ],
  [
    '<div className="grid grid-cols-2 gap-4">\n                <div className="space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Kategori Atlet</label>',
    '<div className="pendaftaran-add-fields grid grid-cols-2 gap-4">\n                <div className="pendaftaran-add-field space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Kategori Atlet</label>'
  ],
  [
    '<div className="space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis Kelamin</label>',
    '<div className="pendaftaran-add-field space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis Kelamin</label>'
  ],
  [
    '<div className="space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Kategori Umur</label>',
    '<div className="pendaftaran-add-field space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Kategori Umur</label>'
  ],
  [
    '<div className="space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nomor WhatsApp</label>',
    '<div className="pendaftaran-add-field space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nomor WhatsApp</label>'
  ],
  [
    '<div className="col-span-2 space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Kota Domisili</label>',
    '<div className="pendaftaran-add-field pendaftaran-add-full col-span-2 space-y-1">\n                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Kota Domisili</label>'
  ],
  [
    '<div className="pt-4 border-t border-slate-100">\n                <button type="submit" disabled={isSaving || uploading} className="w-full py-4 bg-blue-600',
    '<div className="pendaftaran-add-submit pt-4 border-t border-slate-100">\n                <button type="submit" disabled={isSaving || uploading} className="w-full py-4 bg-blue-600'
  ]
];

for (const [from, to] of replacements) {
  if (!code.includes(from)) {
    console.warn('Patch target not found:', from.slice(0, 100));
    continue;
  }
  code = code.replace(from, to);
}

fs.writeFileSync(file, code);
console.log('Patched Tambah Atlet mobile layout');
