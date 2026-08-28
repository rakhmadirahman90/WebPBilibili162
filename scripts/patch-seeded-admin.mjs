import fs from 'node:fs';

const appPath = 'src/App.tsx';
const sidebarPath = 'src/components/Sidebar.tsx';

function patchFile(path, patches) {
  let text = fs.readFileSync(path, 'utf8');
  let changed = false;
  for (const patch of patches) {
    if (text.includes(patch.marker)) continue;
    const next = patch.apply(text);
    if (next === text) throw new Error(`Seeded patch marker not found in ${path}: ${patch.marker}`);
    text = next;
    changed = true;
  }
  if (changed) fs.writeFileSync(path, text);
}

patchFile(appPath, [
  {
    marker: "const SeededAdmin = lazy(() => import('./components/SeededAdmin'));",
    apply: (text) => text.replace(
      "const AdminRanking = lazy(() => import('./components/AdminRanking'));",
      "const AdminRanking = lazy(() => import('./components/AdminRanking'));\nconst SeededAdmin = lazy(() => import('./components/SeededAdmin'));"
    ),
  },
  {
    marker: '<Route path="seeded" element={isAdmin ? <SeededAdmin /> : <Navigate to="/admin/dashboard" replace />} />',
    apply: (text) => text.replace(
      '<Route path="skor" element={<AdminMatch session={session} />} />',
      '<Route path="skor" element={<AdminMatch session={session} />} />\n              <Route path="seeded" element={isAdmin ? <SeededAdmin /> : <Navigate to="/admin/dashboard" replace />} />'
    ),
  },
]);

patchFile(sidebarPath, [
  {
    marker: "{ name: 'Seeded', path: 'seeded', icon: Database, adminOnly: true },",
    apply: (text) => text.replace(
      "{ name: 'Manajemen Atlet', path: 'atlet', icon: Users, adminOnly: true },",
      "{ name: 'Manajemen Atlet', path: 'atlet', icon: Users, adminOnly: true },\n        { name: 'Seeded', path: 'seeded', icon: Database, adminOnly: true },"
    ),
  },
]);

console.log('[seeded-admin] menu and route ready');
