/**
 * Serves dist/ the way GitHub Pages does, to preview a build and to test it end to end: a file
 * at its path, /name from name.html, a directory from its index.html after a redirect to the
 * path with a trailing slash, and anything else from 404.html with status 404. Every response
 * carries a Date header, which the clock falls back on.
 *
 *   npm run build && npm run preview
 */
import { readFile, stat } from 'node:fs/promises'
import { createServer, type ServerResponse } from 'node:http'
import { extname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const port = Number(process.env.PORT ?? 4318)

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

async function isFile(path: string): Promise<boolean> {
  return (await stat(path).catch(() => null))?.isFile() ?? false
}

async function isDirectory(path: string): Promise<boolean> {
  return (await stat(path).catch(() => null))?.isDirectory() ?? false
}

async function send(response: ServerResponse, head: boolean, status: number, file: string) {
  const body = await readFile(file)
  response.writeHead(status, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': 'max-age=600',
  })
  response.end(head ? undefined : body)
}

createServer(async (request, response) => {
  const head = request.method === 'HEAD'
  const url = new URL(request.url ?? '/', 'http://localhost')
  let path = url.pathname
  try {
    path = decodeURIComponent(path)
  } catch {
    // Served as the 404 page below, as an address that names no file.
  }
  const file = join(root, path)
  if (!file.startsWith(root) && `${file}${sep}` !== root) {
    await send(response, head, 404, join(root, '404.html'))
  } else if (await isFile(file)) {
    await send(response, head, 200, file)
  } else if (await isDirectory(file)) {
    if (path.endsWith('/')) {
      await send(response, head, 200, join(file, 'index.html'))
    } else {
      response.writeHead(301, { Location: `${url.pathname}/${url.search}` })
      response.end()
    }
  } else if (await isFile(`${file}.html`)) {
    await send(response, head, 200, `${file}.html`)
  } else {
    await send(response, head, 404, join(root, '404.html'))
  }
}).listen(port, () => {
  console.error(`Serving ${root} at http://localhost:${port}`)
})
