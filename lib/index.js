const http = require('http')
const Axios = require('axios')
const getPort = require('get-port')

class Request {
  constructor (handler) {
    this.handler = handler
    this.axios = Axios.create()

    // TODO: make lazy
    this.createServer()

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
  async createServer () {
    const port = await getPort()
    const server =
      this.server = http.createServer(this.handler)

    const start = (resolve, reject) => {
      server
        .on('listening', () => resolve())
        .on('error', reject)
        .listen(port)
    }
    const connect = new Promise(start)

    connect.then(() => {
      this.defaults.baseURL = this.baseURL
    })

    this.load = connect

    return this
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
