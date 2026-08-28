import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

type SeededPlayer = {
  id: number;
  tournament_id: number | null;
  source_sheet: string;
  source_no: number | null;
  player_name: string;
  club_name: string | null;
  seeded_quality: string | null;
  division_level: string | null;
  tournament_qualification: string | null;
  region_status: string | null;
  validity_status: string | null;
  archive_category: string | null;
  gender: string | null;
  eligible_category: string | null;
  normalized_name: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
};

type FormState = Omit<SeededPlayer, 'id' | 'created_at' | 'raw_data'> & { raw_data_text: string };

const emptyForm: FormState = {
  tournament_id: null,
  source_sheet: '',
  source_no: null,
  player_name: '',
  club_name: '',
  seeded_quality: '',
  division_level: '',
  tournament_qualification: '',
  region_status: '',
  validity_status: '',
  archive_category: '',
  gender: '',
  eligible_category: '',
  normalized_name: '',
  raw_data_text: '{}',
};

const PAGE_SIZE = 25;

const clean = (value: unknown) => String(value ?? '').trim();
const normalize = (value: string) => value.toLocaleLowerCase('id-ID').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function uniqueValues(rows: SeededPlayer[], key: keyof SeededPlayer) {
  return Array.from(new Set(rows.map((row) => clean(row[key])).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id'));
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500">
        <option value="">Semua</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function SeededAdmin() {
  const [rows, setRows] = useState<SeededPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ eligible_category: '', division_level: '', region_status: '', source_sheet: '', club_name: '', validity_status: '', seeded_quality: '', gender: '' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<SeededPlayer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seeded_players')
        .select('id,tournament_id,source_sheet,source_no,player_name,club_name,seeded_quality,division_level,tournament_qualification,region_status,validity_status,archive_category,gender,eligible_category,normalized_name,raw_data,created_at')
        .order('source_no', { ascending: true, nullsFirst: false })
        .order('player_name', { ascending: true })
        .limit(5000);
      if (error) throw error;
      setRows((data || []) as SeededPlayer[]);
    } catch (error: any) {
      console.error(error);
      await Swal.fire({ title: 'Gagal memuat seeded', text: error?.message || 'Database tidak dapat diakses.', icon: 'error', background: '#0f172a', color: '#fff' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRows(); }, [loadRows]);

  const options = useMemo(() => ({
    eligible_category: uniqueValues(rows, 'eligible_category'),
    division_level: uniqueValues(rows, 'division_level'),
    region_status: uniqueValues(rows, 'region_status'),
    source_sheet: uniqueValues(rows, 'source_sheet'),
    club_name: uniqueValues(rows, 'club_name'),
    validity_status: uniqueValues(rows, 'validity_status'),
    seeded_quality: uniqueValues(rows, 'seeded_quality'),
    gender: uniqueValues(rows, 'gender'),
  }), [rows]);

  const filteredRows = useMemo(() => {
    const q = normalize(search);
    return rows.filter((row) => {
      const haystack = normalize([
        row.player_name, row.club_name, row.source_sheet, row.source_no, row.division_level,
        row.eligible_category, row.region_status, row.validity_status, row.seeded_quality,
        row.gender, row.archive_category, row.tournament_qualification, row.normalized_name,
      ].map(clean).join(' '));
      const matchesSearch = !q || haystack.includes(q);
      const matchesFilters = Object.entries(filters).every(([key, value]) => !value || clean((row as any)[key]) === value);
      return matchesSearch && matchesFilters;
    });
  }, [rows, search, filters]);

  useEffect(() => setPage(1), [search, filters]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const qualityCount = rows.filter((r) => clean(r.seeded_quality)).length;
  const qualityPercent = rows.length ? Math.round((qualityCount / rows.length) * 100) : 0;
  const activeCount = rows.filter((r) => normalize(clean(r.validity_status)).includes('valid') || !clean(r.validity_status)).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, source_sheet: options.source_sheet[0] || '' });
  };

  const openEdit = (row: SeededPlayer) => {
    setEditing(row);
    setForm({
      tournament_id: row.tournament_id,
      source_sheet: row.source_sheet || '',
      source_no: row.source_no,
      player_name: row.player_name || '',
      club_name: row.club_name || '',
      seeded_quality: row.seeded_quality || '',
      division_level: row.division_level || '',
      tournament_qualification: row.tournament_qualification || '',
      region_status: row.region_status || '',
      validity_status: row.validity_status || '',
      archive_category: row.archive_category || '',
      gender: row.gender || '',
      eligible_category: row.eligible_category || '',
      normalized_name: row.normalized_name || '',
      raw_data_text: JSON.stringify(row.raw_data || {}, null, 2),
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.player_name.trim() || !form.source_sheet.trim()) {
      await Swal.fire({ title: 'Data belum lengkap', text: 'Nama pemain dan sumber data wajib diisi.', icon: 'warning', background: '#0f172a', color: '#fff' });
      return;
    }

    let rawData: Record<string, unknown> = {};
    try {
      rawData = form.raw_data_text.trim() ? JSON.parse(form.raw_data_text) : {};
      if (!rawData || Array.isArray(rawData) || typeof rawData !== 'object') throw new Error('Raw data harus berupa object JSON.');
    } catch (error: any) {
      await Swal.fire({ title: 'Raw Data tidak valid', text: error?.message || 'Periksa format JSON.', icon: 'warning', background: '#0f172a', color: '#fff' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tournament_id: form.tournament_id,
        source_sheet: form.source_sheet.trim(),
        source_no: form.source_no,
        player_name: form.player_name.trim(),
        club_name: form.club_name.trim() || null,
        seeded_quality: form.seeded_quality.trim() || null,
        division_level: form.division_level.trim() || null,
        tournament_qualification: form.tournament_qualification.trim() || null,
        region_status: form.region_status.trim() || null,
        validity_status: form.validity_status.trim() || null,
        archive_category: form.archive_category.trim() || null,
        gender: form.gender.trim() || null,
        eligible_category: form.eligible_category.trim() || null,
        normalized_name: (form.normalized_name.trim() || normalize(form.player_name)),
        raw_data: rawData,
      };

      const query = editing
        ? supabase.from('seeded_players').update(payload).eq('id', editing.id)
        : supabase.from('seeded_players').insert(payload);
      const { error } = await query;
      if (error) throw error;

      await Swal.fire({ title: editing ? 'Seeded diperbarui' : 'Seeded ditambahkan', text: 'Data berhasil disimpan ke database.', icon: 'success', timer: 1300, showConfirmButton: false, background: '#0f172a', color: '#fff' });
      setEditing(null);
      setForm(emptyForm);
      await loadRows();
    } catch (error: any) {
      console.error(error);
      await Swal.fire({ title: 'Gagal menyimpan', text: error?.message || 'Perubahan tidak tersimpan.', icon: 'error', background: '#0f172a', color: '#fff' });
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row: SeededPlayer) => {
    const { count } = await supabase.from('seeded_pair_evaluations').select('id', { count: 'exact', head: true }).or(`player1_seeded_id.eq.${row.id},player2_seeded_id.eq.${row.id}`);
    const warning = count ? `Data ini memiliki ${count} evaluasi pasangan yang terkait. Menghapus seeded tidak otomatis menghapus histori evaluasi.` : 'Data seeded akan dihapus dari database.';
    const result = await Swal.fire({ title: 'Hapus Data Seeded?', html: `<div style="text-align:left">${warning}<br/><br/><b>${clean(row.player_name)}</b></div>`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', background: '#0f172a', color: '#fff' });
    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.from('seeded_players').delete().eq('id', row.id);
      if (error) throw error;
      await Swal.fire({ title: 'Terhapus', text: 'Data seeded berhasil dihapus.', icon: 'success', timer: 1100, showConfirmButton: false, background: '#0f172a', color: '#fff' });
      await loadRows();
    } catch (error: any) {
      await Swal.fire({ title: 'Gagal menghapus', text: error?.message || 'Data tidak dapat dihapus.', icon: 'error', background: '#0f172a', color: '#fff' });
    }
  };

  const resetFilters = () => {
    setSearch('');
    setFilters({ eligible_category: '', division_level: '', region_status: '', source_sheet: '', club_name: '', validity_status: '', seeded_quality: '', gender: '' });
  };

  const formFields: Array<[keyof FormState, string, string]> = [
    ['player_name', 'Nama pemain', 'text'],
    ['club_name', 'PB / Klub', 'text'],
    ['source_sheet', 'Sumber data', 'text'],
    ['source_no', 'Nomor sumber', 'number'],
    ['seeded_quality', 'Kualitas seeded', 'text'],
    ['division_level', 'Kelas / Level', 'text'],
    ['eligible_category', 'Kategori', 'text'],
    ['gender', 'Gender', 'text'],
    ['region_status', 'Status wilayah', 'text'],
    ['validity_status', 'Status validitas', 'text'],
    ['archive_category', 'Kategori arsip', 'text'],
    ['tournament_qualification', 'Kualifikasi turnamen', 'text'],
    ['normalized_name', 'Nama ter-normalisasi', 'text'],
  ];

  return (
    <div className="min-h-full bg-[#070d1a] text-white p-3 sm:p-5 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#0d1a32] via-[#0a1427] to-[#070d1a] p-5 sm:p-7 shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300"><ShieldCheck size={14} /> Seeded • Database Terhubung</div>
              <h1 className="text-2xl font-black uppercase italic tracking-tight sm:text-4xl">Seeded Resmi Bilibili 162</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">Kelola 1.103 data seeded dari sumber PBSI dengan pencarian, filter, tambah, edit, dan hapus yang terhubung langsung ke Supabase.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadRows} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-200 hover:bg-slate-800 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500"><Plus size={16} /> Tambah Seeded</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Seeded</div><div className="mt-1 text-3xl font-black">{rows.length.toLocaleString('id-ID')}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Kualitas Data</div><div className="mt-1 text-3xl font-black">{qualityPercent}%</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Hasil Filter</div><div className="mt-1 text-3xl font-black">{filteredRows.length.toLocaleString('id-ID')}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Aktif / Valid</div><div className="mt-1 text-3xl font-black">{activeCount.toLocaleString('id-ID')}</div></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[#0b1324] p-3 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, klub, kelas, kategori, wilayah, sumber..." className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500" />
            </div>
            <button onClick={() => setShowFilters((v) => !v)} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-xs font-black uppercase tracking-wider ${showFilters ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-700 bg-slate-950 text-slate-300'}`}><Filter size={16} /> Filter</button>
            <button onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white"><X size={16} /> Reset</button>
          </div>
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectFilter label="Kategori" value={filters.eligible_category} onChange={(v) => setFilters((f) => ({ ...f, eligible_category: v }))} options={options.eligible_category} />
              <SelectFilter label="Kelas / Level" value={filters.division_level} onChange={(v) => setFilters((f) => ({ ...f, division_level: v }))} options={options.division_level} />
              <SelectFilter label="Wilayah" value={filters.region_status} onChange={(v) => setFilters((f) => ({ ...f, region_status: v }))} options={options.region_status} />
              <SelectFilter label="Sumber Data" value={filters.source_sheet} onChange={(v) => setFilters((f) => ({ ...f, source_sheet: v }))} options={options.source_sheet} />
              <SelectFilter label="PB / Klub" value={filters.club_name} onChange={(v) => setFilters((f) => ({ ...f, club_name: v }))} options={options.club_name} />
              <SelectFilter label="Status Validitas" value={filters.validity_status} onChange={(v) => setFilters((f) => ({ ...f, validity_status: v }))} options={options.validity_status} />
              <SelectFilter label="Kualitas" value={filters.seeded_quality} onChange={(v) => setFilters((f) => ({ ...f, seeded_quality: v }))} options={options.seeded_quality} />
              <SelectFilter label="Gender" value={filters.gender} onChange={(v) => setFilters((f) => ({ ...f, gender: v }))} options={options.gender} />
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Menampilkan <b className="text-white">{visibleRows.length}</b> dari <b className="text-white">{filteredRows.length.toLocaleString('id-ID')}</b> data</span>
            <span>Halaman <b className="text-white">{safePage}</b> / {totalPages}</span>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b1324] shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left text-xs">
              <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4">#</th><th className="px-4 py-4">Pemain</th><th className="px-4 py-4">PB / Klub</th><th className="px-4 py-4">Kategori</th><th className="px-4 py-4">Kelas</th><th className="px-4 py-4">Wilayah</th><th className="px-4 py-4">Sumber</th><th className="px-4 py-4">Kualitas</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {loading ? <tr><td colSpan={10} className="px-4 py-16 text-center text-slate-500">Memuat database seeded...</td></tr> : visibleRows.length === 0 ? <tr><td colSpan={10} className="px-4 py-16 text-center text-slate-500">Tidak ada data yang sesuai dengan pencarian/filter.</td></tr> : visibleRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-blue-500/[0.04]">
                    <td className="px-4 py-4 font-bold text-slate-500">{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="max-w-[260px] px-4 py-4"><div className="font-bold text-white">{row.player_name}</div><div className="mt-1 text-[10px] text-slate-600">ID {row.id} • No. Sumber {row.source_no ?? '—'}</div></td>
                    <td className="px-4 py-4 text-slate-300">{row.club_name || '—'}</td>
                    <td className="px-4 py-4 text-slate-300">{row.eligible_category || '—'}</td>
                    <td className="px-4 py-4 text-slate-300">{row.division_level || '—'}</td>
                    <td className="px-4 py-4 text-slate-300">{row.region_status || '—'}</td>
                    <td className="px-4 py-4 text-slate-400">{row.source_sheet}</td>
                    <td className="px-4 py-4"><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">{row.seeded_quality || '—'}</span></td>
                    <td className="px-4 py-4 text-slate-400">{row.validity_status || 'Belum diisi'}</td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(row)} className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20" title="Edit"><Edit3 size={15} /></button><button onClick={() => removeRow(row)} className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20" title="Hapus"><Trash2 size={15} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
            <button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-30"><ChevronLeft size={15} /> Sebelumnya</button>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{filteredRows.length.toLocaleString('id-ID')} hasil</div>
            <button disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-30">Berikutnya <ChevronRight size={15} /></button>
          </div>
        </section>
      </div>

      {(editing || form.source_sheet !== '' || form.player_name !== '') && (
        <div className="fixed inset-0 z-[100000] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-4 max-w-4xl rounded-3xl border border-slate-700 bg-[#0b1324] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6"><div><h2 className="text-lg font-black uppercase">{editing ? 'Edit Seeded' : 'Tambah Seeded'}</h2><p className="text-xs text-slate-500">Semua perubahan tersimpan langsung ke Supabase.</p></div><button onClick={() => { setEditing(null); setForm(emptyForm); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={20} /></button></div>
            <form onSubmit={submit} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {formFields.map(([key, label, type]) => <label key={String(key)}><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><input type={type} value={(form[key] as any) ?? ''} onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" /></label>)}
              </div>
              <label className="mt-4 block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Raw Data JSON</span><textarea rows={9} value={form.raw_data_text} onChange={(e) => setForm((f) => ({ ...f, raw_data_text: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-blue-500" /></label>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-300">Batal</button><button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-500 disabled:opacity-50">{saving ? <RefreshCw size={15} className="animate-spin" /> : editing ? <Edit3 size={15} /> : <Plus size={15} />}{saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Seeded'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
