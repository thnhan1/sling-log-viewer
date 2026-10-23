import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import { loadEnvFromCwd, getEnvAemUrl, getEnvAemUser, getEnvAemPass, getEnvAemLogFiles, getEnvLogRoot } from './loadEnv.js'
import { mountApi } from './routes.js'
import { mountWs } from './ws.js'
import { setLocalRootPath, setSourceMode, updateRemoteConfig } from './logSources/LogSourceFactory.js'
import type { RemoteConfig } from './logSources/RemoteSlingLogSource.js'
import http from 'node:http'

loadEnvFromCwd()

// Auto-bootstrap from env vars
const envLogRoot = getEnvLogRoot()
const envAemUrl = getEnvAemUrl()
const envAemUser = getEnvAemUser()
const envAemPass = getEnvAemPass()
const envAemLogFiles = getEnvAemLogFiles()

if (envLogRoot) {
  setLocalRootPath(envLogRoot)
}

if (envAemUrl && envAemUser && envAemPass) {
  const remoteConfig: RemoteConfig = {
    baseUrl: envAemUrl,
    username: envAemUser,
    password: envAemPass,
    logPath: 'logs/',
    logFiles: envAemLogFiles.length > 0
      ? envAemLogFiles.map((f) => f.split('/').pop() || f)
      : ['error.log', 'request.log', 'stdout.log'],
  }
  updateRemoteConfig(remoteConfig)
  // Default to local mode, but remote is ready — user switches in UI
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3333
const isProd = process.env.NODE_ENV === 'production'

async function createApp() {
  const app = express()
  mountApi(app)

  if (isProd) {
    const clientDir = path.join(__dirname, '../client')
    app.use(express.static(clientDir))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'))
    })
  } else {
    const vite = await createViteServer({
      root: path.join(__dirname, '..'),
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  return app
}

const app = await createApp()
const server = http.createServer(app)
mountWs(server)

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Slingtail running at http://127.0.0.1:${PORT}`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`)
  } else {
    console.error(err)
  }
  process.exit(1)
})
