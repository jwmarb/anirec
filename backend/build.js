const { build } = require('esbuild');
const tsPaths = require('esbuild-ts-paths');

build({
  entryPoints: ['./src/app.ts'],
  bundle: true,
  platform: 'node',
  target: ['node22'],
  outfile: './dist/app.bundle.js',
  minify: true,
  sourcemap: false,
  external: ['bcrypt'],
  plugins: [tsPaths()],
}).catch(() => process.exit(1));
