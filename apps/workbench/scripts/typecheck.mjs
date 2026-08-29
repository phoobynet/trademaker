import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { run } from 'vue-tsc';

const tscPath = realpathSync(
  fileURLToPath(
    new URL(
      '../node_modules/@typescript/typescript6/lib/tsc.js',
      import.meta.url,
    ),
  ),
);

run(tscPath);
