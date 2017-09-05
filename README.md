# axios-serve

Run [Axios][axios] with `net.Server` under the hood. Good for isolated tests.

[axios]: https://github.com/mzabriskie/axios


## Usage

```js
const Axios = require('axios-serve')

const app = require('./app.js') // Express app

const request = Axios.createServer(app)

request.get('/')
  .then(res => {
    console.log(res.status === 200)
  })
```

Axios `defaults` and `interceptors` properties are available.


## Installation

Install using npm

```sh
npm install axios-serve
```


## License

MIT
