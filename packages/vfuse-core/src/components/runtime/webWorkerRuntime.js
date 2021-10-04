'use strict'

class WebWorkerRuntime {
    constructor(worker , options, callback) {
        this.count = 0
        this.id =  this.getRandomBetween(0,1000)
        this.history = []
        this.value = null
        this.packages = [worker.getDefaultPackages(), ... options && options.packages ? options.packages : []]
        this.worker   = worker.webWorker
        this.callback = callback

        // attach web worker callbacks
        this.worker.onerror = (e) => {
            console.log(
                `Error in worker ${this.id} at ${e.filename}, Line: ${e.lineno}, ${e.message}`
            );
        };
    }

    getRandomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    history() {
        return this.history.map((x) => x.cmd).join('\n')
    }

    init() {
        // initialize Runtime
        const promise = new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'initialized') {
                    resolve(this)
                } else {
                    reject(new Error('Runtime initialization failed'))
                }
            };
        });
        this.worker.postMessage({ action: 'init' })
        return promise;
    }

    load() {
        // preload packages
        const promise = new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'loaded') {
                    resolve(this)
                } else {
                    reject(new Error('Package preloading failed'))
                }
            };
        });

        this.worker.postMessage({ action: 'load', packages: this.packages })
        return promise;
    }

    async restart() {
        const startTs = Date.now()

        this.worker.terminate()
        this.packages.clear()

        await this.init()
        await this.load(this.packages)

        const log = { start: startTs, end: Date.now(), cmd: '$RESTART SESSION$' }
        this.history.push(log)
    }

    exec(job) {
        const promise = new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { action, results } = e.data
                if (action === 'return') {
                    resolve(results)
                } else if (action === 'VFuse'){
                    this.callback(e)
                }else if (action === 'error') {
                    reject(results)
                } else {
                    reject(new Error('Unknown worker response'))

                }
            }
        })

        this.worker.postMessage({
            action: 'exec',
            job: job,
        })
        return promise
    }

    async run(job) {
        const startTs = Date.now()
        const result = await this.exec(job)
        job.result = result

        const log = { start: startTs, end: Date.now(), cmd: job.code }
        this.history.push(log)

        return result
    }
}

module.exports = WebWorkerRuntime
