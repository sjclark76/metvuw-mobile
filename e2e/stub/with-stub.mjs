// Runs a command with the metvuw stub running and the app pointed at it, e.g.
//   node e2e/stub/with-stub.mjs npm run build
// The build prerenders pages that scrape metvuw, so it needs the stub too.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createStubServer, STUB_PORT } from './metvuw-stub.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const [command, ...args] = process.argv.slice(2)

const server = createStubServer()
server.listen(STUB_PORT, '127.0.0.1', () => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      METVUW_STUB_ORIGIN: `http://127.0.0.1:${STUB_PORT}`,
      NODE_OPTIONS:
        `${process.env.NODE_OPTIONS ?? ''} --import=${path.join(here, 'redirect-metvuw.mjs')}`.trim(),
    },
  })
  child.on('exit', (code) => {
    server.close()
    process.exit(code ?? 1)
  })
})
