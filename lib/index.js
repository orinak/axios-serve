const http = require('http')
const Axios = require('axios')
const getPort = require('get-port')

class Request {
  constructor (handler) {
    this.handler = handler
    this.axios = Axios.create()

    // TODO: make lazy
    this.load = createServer(handler)
      .then(server => {
        this.server = server
        this.defaults.baseURL = this.baseURL
      })

    return this
  }
  get defaults () {
    return this.axios.defaults
  }
  get interceptors () {
    return this.axios.interceptors
  }
  get baseURL () {
    if (!this.server) throw NoServerError()

    const { port } = this.server.address()
    return `http://localhost:${port}`
  }
  tearDown () {
    const { load, server } = this

    const stop = () => {
      const callback = (resolve, reject) => {
        this.load = void 0
        this.server = void 0

        server.close((err) => {
          return err
            ? reject(NoServerError())
            : resolve()
        })
      }
      return new Promise(callback)
    }

    // `this.load` is defined in constructor
    // `!load` means already deleted
    if (!load) return Promise.reject(NoServerError())

    return server
      ? stop()
      : load.then(stop)
  }
  static createServer (handler) {
    return new Request(handler)
  }
}

async function createServer (handler) {
  const port = await getPort()
  const server = http.createServer(handler)

  const start = (resolve, reject) => {
    server
      .on('listening', () => resolve(server))
      .on('error', reject)
      .listen(port)
  }
  return new Promise(start)
}

const methods = [
  'request',
  'get',
  'delete',
  'head',
  'options',
  'post',
  'put',
  'patch'
]

methods.forEach(name => {
  Request.prototype[name] = function (...args) {
    const { load, axios } = this

    if (!load) return Promise.reject(NoServerError())

    const call = args => () => axios[name](...args)
    return load.then(call(args))
  }
})

function NoServerError () {
  return new Error('No server listening')
}

module.exports = Request
