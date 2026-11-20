/** Rebuild lib/index.js, lib/remote.js, lib/client.js, and the typert entry files using the esbuild devDependency. */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const clientExternals = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/client',
  'zod',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-api-remotes/client',
  '@deepseek-ai/dsh-client-locale/client',
  '@deepseek-ai/dsh-client-ui-layout/client',
  '@deepseek-ai/dsh-client-ui-renderer/client',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-slots',
]

mkdirSync(join(root, 'lib'), { recursive: true })
mkdirSync(join(root, 'lib', 'types'), { recursive: true })

const hostExternal = {
  absWorkingDir: root,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: false,
  // Match dsh-custom-env: keep node_modules external. Bundling CJS deps (jszip)
  // into ESM emits `__require("process")`, which Cordis' ESM loader rejects.
  // Runtime deps resolve from this package's node_modules; DSH peers from Host.
  packages: 'external',
}

await esbuild.build({
  ...hostExternal,
  entryPoints: [join(root, 'src', 'index.ts')],
  outfile: join(root, 'lib', 'index.js'),
})

await esbuild.build({
  ...hostExternal,
  entryPoints: [join(root, 'src', 'remote.ts')],
  outfile: join(root, 'lib', 'remote.js'),
})

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [join(root, 'src', 'client', 'index.ts')],
  outfile: join(root, 'lib', 'client.js'),
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  sourcemap: true,
  jsx: 'automatic',
  external: clientExternals,
  plugins: [{
    name: 'css-inline',
    setup(build) {
      const styleId = path => {
        const digest = createHash('sha1').update(path).digest('hex').slice(0, 10)
        return `dsh-skill-experts-css-${digest}`
      }
      const injectCss = (css, id) => [
        `const css = ${JSON.stringify(css)};`,
        `if (typeof document !== "undefined" && !document.getElementById(${JSON.stringify(id)})) {`,
        `  const style = document.createElement("style");`,
        `  style.id = ${JSON.stringify(id)};`,
        `  style.textContent = css;`,
        `  document.head.appendChild(style);`,
        `}`,
      ].join('\n')

      build.onLoad({ filter: /\.module\.css$/ }, (args) => {
        const css = readFileSync(args.path, 'utf8')
        const names = new Set()
        for (const match of css.matchAll(/\.([A-Za-z_][\w-]*)/g)) names.add(match[1])
        // Prefix by stylesheet stem so ExpertsPanel vs ComposerExperts locals do not collide.
        const stem = args.path.replace(/\\/g, '/').split('/').pop()?.replace(/\.module\.css$/i, '')
          ?? createHash('sha1').update(args.path).digest('hex').slice(0, 8)
        const locals = Object.create(null)
        for (const name of names) locals[name] = `SkillExperts_${stem}_${name}`
        let transformed = css
        for (const name of names) {
          transformed = transformed.replaceAll(
            new RegExp(`\\.${name}(?![\\w-])`, 'g'),
            `.${locals[name]}`,
          )
        }
        // One style tag per stylesheet. A shared id lets the first module win and
        // silently drops later sheets (e.g. ComposerExperts after ExpertsPanel).
        const js = [
          injectCss(transformed, styleId(args.path)),
          `export default ${JSON.stringify(locals)};`,
        ].join('\n')
        return { contents: js, loader: 'js' }
      })

      // Plain CSS from deps (e.g. @uiw/react-md-editor) → inject into document.head.
      build.onLoad({ filter: /\.css$/ }, (args) => {
        if (args.path.includes('.module.css')) return undefined
        const css = readFileSync(args.path, 'utf8')
        return {
          contents: `${injectCss(css, styleId(args.path))}\nexport default {};`,
          loader: 'js',
        }
      })

      // Source .less is unused when ESM resolves to prebuilt .css; stub if pulled.
      build.onLoad({ filter: /\.less$/ }, () => ({
        contents: 'export default {};',
        loader: 'js',
      }))
    },
  }],
  banner: {
    js: [
      'window.__ModuleLoader__.load({ id: "@woosau/dsh-skill-experts", factory: (require) => {',
      'var module = { exports: {} };',
      'var exports = module.exports;',
      'Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
    ].join('\n'),
  },
  footer: {
    js: 'return module.exports;\n\t}\n});',
  },
})

// Hand-maintained typert entry files: src holds the JS and its declarations; lib receives both.
for (const name of ['typert.host', 'typert.remote-client']) {
  await esbuild.build({
    absWorkingDir: root,
    entryPoints: [join(root, 'src', `${name}.js`)],
    outfile: join(root, 'lib', `${name}.js`),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    sourcemap: false,
    packages: 'external',
  })
  copyFileSync(join(root, 'src', `${name}.d.ts`), join(root, 'lib', `${name}.d.ts`))
}

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc')
const tsconfig = join(root, 'tsconfig.build.json')
writeFileSync(tsconfig, `${JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    declaration: true,
    emitDeclarationOnly: true,
    declarationMap: false,
    outDir: 'lib/types',
    rootDir: 'src',
    strict: true,
    skipLibCheck: true,
    jsx: 'react-jsx',
    types: ['node'],
  },
  include: ['src/**/*.ts', 'src/**/*.tsx'],
}, null, 2)}\n`)

const result = spawnSync(process.execPath, [tsc, '-p', tsconfig], { cwd: root, encoding: 'utf8' })
if (result.status !== 0) {
  process.stderr.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  process.stderr.write('tsc declaration emit reported errors; continuing.\n')
}

process.stdout.write('build: wrote lib/index.js, lib/remote.js, and lib/client.js\n')
