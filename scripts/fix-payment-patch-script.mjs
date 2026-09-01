import fs from 'node:fs';

const path = 'scripts/patch-pendaftaran-pembayaran.mjs';
let code = fs.readFileSync(path, 'utf8');

// The patch file contains JSX template literals. Escape JSX interpolation markers so
// they are emitted into the target TSX file instead of being evaluated by Node.
code = code.replaceAll('${', '\\${');

fs.writeFileSync(path, code);
