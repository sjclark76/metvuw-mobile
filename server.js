const { createServer } = require('http')
const { join } = require('path')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    const { pathname } = parsedUrl

    // handle GET request to /service-worker.js
    if (pathname === '/service-worker.js') {
      const filePath = join(__dirname, '.next', pathname)

      app.serveStatic(req, res, filePath)
    } else {
      handle(req, res, parsedUrl)
    }
  }).listen(3000, () => {
    console.log(`> Ready on http://localhost:${3000}`)
  })
})
/*app
  .prepare()
  .then(() => {
    const server = express()

    // requests to /service-worker.js
    server.get(
      '/service-worker.js',
      express.static(path.join(__dirname, '.next'))
    )

    // all other requests
    server.get('*', (req, res) => {
      return handle(req, res)
    })
    server.listen(3000, (err) => {
      if (err) throw err
      console.log('> Ready on http://localhost:3000')
    })
  })
  .catch((ex) => {
    console.error(ex.stack)
    process.exit(1)
  })*/
