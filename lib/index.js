const http = require('http')
const Axios = require('axios')
const getPort = require('get-port')

class Request {
  constructor (listener) {
    this.listener = listener
    this.axios = Axios.create()

    // TODO: make lazy
    this.connect = this.createServer()
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
  async createServer () {
    const port = await getPort()
    const server =
      this.server = http.createServer(this.listener)

    const start = (resolve, reject) => {
      server
        .on('listening', resolve)
        .on('error', reject)
        .listen(port)
    }

    return new Promise(start)
      .then(() => {
        this.defaults.baseURL = this.baseURL
      })
  }
  tearDown () {
    const { connect, server } = this

    const stop = () => {
      this.connect = void 0
      this.server = void 0

      const callback = (resolve, reject) => {
        server.close((err) => {
          return err
            ? reject(NoServerError())
            : resolve()
        })
      }
      return new Promise(callback)
    }

    // 'disconnected' state
    if (!connect) return Promise.reject(NoServerError())

    return server
      ? stop() // 'connected' state
      : connect.then(stop) // 'connecting' state
  }
  static createServer (listener) {
    return new Request(listener)
  }
}

const METHODS = [
  'request',
  'get',
  'delete',
  'head',
  'options',
  'post',
  'put',
  'patch'
]

METHODS.forEach(name => {
  Request.prototype[name] = function (...args) {
    const { connect, axios } = this

    // not functional when disconnected
    if (!connect) return Promise.reject(NoServerError())

    const apply = args => () => axios[name](...args)
    return connect.then(apply(args))
  }
})

function NoServerError () {
  return new Error('No server listening')
}

module.exports = Request
