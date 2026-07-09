// Post-build prerender step.
//
// This site is a pure client-side React SPA — without this script,
// dist/index.html ships an empty <div id="root"></div>, so any crawler
// or bot that doesn't execute JavaScript (many social-preview bots,
// some search engines, rich-result validators) sees nothing.
//
// This launches headless Chromium against the built dist/, waits for
// React to finish rendering, then overwrites dist/index.html with the
// fully-rendered HTML — while keeping the original <script type="module">
// tag intact, so real users still get the interactive app (Engineering
// Terminal, etc.) once the JS loads and re-renders over the static markup.

import puppeteer from 'puppeteer'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const PORT = 4173

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let filePath = join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0])
      try {
        const data = await readFile(filePath)
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' })
        res.end(data)
      } catch {
        res.writeHead(404)
        res.end()
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

async function main() {
  const server = await startServer()

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' })

    // Wait for the app to actually mount real content, not just the root div.
    await page.waitForFunction(
      () => document.querySelector('#root')?.children.length > 0,
      { timeout: 15000 }
    )

    const html = await page.content()
    const outPath = join(distDir, 'index.html')
    await writeFile(outPath, html, 'utf-8')
    console.log('Prerendered dist/index.html (' + html.length + ' bytes)')
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
