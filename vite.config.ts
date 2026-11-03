import { createHash } from 'node:crypto'
import { copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type Plugin, transformWithOxc } from 'vite'
import { defineConfig } from 'vitest/config'
import { akamaiTimeUrl } from './src/time/servers.ts'

/**
 * GitHub Pages answers a path that has no file, such as /UTC+5:30, with 404.html. Making
 * 404.html a copy of the app is what lets every clock URL work on a static host.
 */
function pagesFallback(): Plugin {
  return {
    name: 'time:pages-fallback',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir ?? 'dist'
      copyFileSync(join(dir, 'index.html'), join(dir, '404.html'))
    },
  }
}

/**
 * src/app/theme.ts as a script that applies the saved theme. It runs in the page's head, before
 * the first paint, which the app's own module comes too late for.
 */
async function themeScript(): Promise<string> {
  const source = readFileSync(new URL('./src/app/theme.ts', import.meta.url), 'utf8')
  const { code } = await transformWithOxc(source, 'theme.ts')
  return `(() => {\n${code.replace(/^export /gm, '')}\napplyTheme(readTheme())\n})()`
}

function themeBeforePaint(): Plugin {
  return {
    name: 'time:theme',
    transformIndexHtml: async () => [
      { tag: 'script', children: await themeScript(), injectTo: 'head' },
    ],
  }
}

/**
 * The content security policy of the built app. GitHub Pages sets no headers, so it goes in a
 * meta element. Scripts are the app's own files and the theme script, by its hash; the only
 * server the app talks to besides its own is the time service. The dev server is exempt
 * because Vite injects inline scripts there.
 */
function csp(): Plugin {
  return {
    name: 'time:csp',
    apply: 'build',
    transformIndexHtml: async () => {
      // The script themeBeforePaint inlines, which comes out the same each time it is made.
      const hash = createHash('sha256')
        .update(await themeScript())
        .digest('base64')
      const policy = [
        "default-src 'self'",
        `script-src 'self' 'sha256-${hash}'`,
        "style-src 'self'",
        "font-src 'self'",
        "img-src 'self' data:",
        `connect-src 'self' ${new URL(akamaiTimeUrl).origin}`,
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ].join('; ')
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig({
  plugins: [csp(), themeBeforePaint(), pagesFallback()],
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'preact' },
  },
  build: {
    target: 'es2022',
    // The licenses of the libraries and fonts the site ships, served beside it.
    license: { fileName: 'licenses.md' },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
