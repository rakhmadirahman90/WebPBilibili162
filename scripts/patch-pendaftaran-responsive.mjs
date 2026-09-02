import fs from 'node:fs';

const path = 'src/ManajemenPendaftaran.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("./pendaftaran-responsive.css")) {
  code = code.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\nimport './pendaftaran-responsive.css';");
}

if (!code.includes('pendaftaran-responsive')) {
  // Scope the responsive rules to this page only. The first div immediately after
  // the component's return is the page shell in the current implementation.
  const returnIndex = code.indexOf('return (');
  if (returnIndex >= 0) {
    const openDiv = code.indexOf('<div', returnIndex);
    if (openDiv >= 0) {
      const classIndex = code.indexOf('className=', openDiv);
      if (classIndex >= 0 && classIndex < code.indexOf('>', openDiv)) {
        const quote = code[classIndex + 10];
        if (quote === '"' || quote === "'") {
          code = code.slice(0, classIndex + 11) + 'pendaftaran-responsive ' + code.slice(classIndex + 11);
        }
      } else {
        code = code.slice(0, openDiv + 3) + ' className="pendaftaran-responsive"' + code.slice(openDiv + 3);
      }
    }
  }
}

fs.writeFileSync(path, code);
console.log('Applied responsive mobile layout to ManajemenPendaftaran.');
