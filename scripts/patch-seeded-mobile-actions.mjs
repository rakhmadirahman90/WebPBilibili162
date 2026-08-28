import fs from 'node:fs';

const path = 'src/components/SeededAdmin.tsx';
let text = fs.readFileSync(path, 'utf8');

// Keep the mobile layout independent from the desktop md breakpoint. This is
// important on Android browsers whose visual viewport can be close to 768px.
text = text.replaceAll('className="hidden overflow-x-auto md:block"', 'className="hidden overflow-x-auto min-[768px]:block"');
text = text.replaceAll('className="md:hidden"', 'className="min-[768px]:hidden"');

// Give mobile action controls a clearly visible, professional treatment.
text = text.replaceAll(
  'className="flex shrink-0 gap-1.5"',
  'className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/80 p-1 shadow-lg shadow-black/20"'
);
text = text.replaceAll(
  'className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-300"',
  'className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 text-blue-200 shadow-sm transition active:scale-95"'
);
text = text.replaceAll(
  'className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300"',
  'className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 text-red-200 shadow-sm transition active:scale-95"'
);

// Add a compact mobile action label below the icon buttons so the function is
// immediately obvious without relying on hover/tooltips.
text = text.replace(
  '<div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/80 p-1 shadow-lg shadow-black/20"><button onClick={()=>openEdit(row)}',
  '<div className="flex shrink-0 flex-col items-end gap-1"><span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Aksi</span><div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/80 p-1 shadow-lg shadow-black/20"><button onClick={()=>openEdit(row)}'
);
text = text.replace(
  '</button><button onClick={()=>removeRow(row)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 text-red-200 shadow-sm transition active:scale-95" aria-label={`Hapus ${row.player_name}`}><Trash2 size={16}/></button></div></div><div className="mt-3 grid grid-cols-2',
  '</button><button onClick={()=>removeRow(row)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 text-red-200 shadow-sm transition active:scale-95" aria-label={`Hapus ${row.player_name}`}><Trash2 size={16}/></button></div></div></div><div className="mt-3 grid grid-cols-2'
);

fs.writeFileSync(path, text);
console.log('[seeded-mobile-actions] responsive/action styling applied');
