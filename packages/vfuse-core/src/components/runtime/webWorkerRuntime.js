'use strict'

class WebWorkerRuntime {
    constructor(runtimeManager, worker , options, callback) {
        this.count = 0
        this.id =  this.getRandomBetween(0,1000)
        this.history = []
        this.value = null
        this.packages = [worker.getDefaultPackages(), ... options && options.packages ? options.packages : []]
        this.worker   = worker
        this.webworker = worker.getWebWorker()
        this.callback = callback
        this.runtimeManager = runtimeManager

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
            this.webworker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'initialized') {
                    resolve(this)
                } else {
                    reject(new Error('Runtime initialization failed'))
                }
            };
        });
        this.webworker.postMessage({ action: 'init' })
        return promise;
    }

    load() {
        // preload packages
        const promise = new Promise((resolve, reject) => {
            this.webworker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'loaded') {
                    resolve(this)
                } else {
                    reject(new Error('Package preloading failed'))
                }
            };
        });

        this.webworker.postMessage({ action: 'load', packages: this.packages })
        return promise;
    }

    async restart() {
        const startTs = Date.now()

        this.webworker.terminate()
        this.packages.clear()

        await this.init()
        await this.load(this.packages)

        const log = { start: startTs, end: Date.now(), cmd: '$RESTART SESSION$' }
        this.history.push(log)
    }

    exec(job) {
        this.webworker = this.worker.getWebWorker()
        const promise = new Promise((resolve, reject) => {
            this.webworker.addEventListener('message', async(e) => {
                const { action, results } = e.data
                switch(action){
                    case 'return':
                        resolve(results)
                        break
                    case 'VFuse:worker':
                        const {func, params} = e.data.todo
                        switch(func){
                            case 'addJob':
                                let p = JSON.parse(params)
                                let job = await this.runtimeManager.addJob(p.func, p.data, p.deps)
                                this.webworker.postMessage({
                                    action: 'VFuse:runtime',
                                    data: {
                                        func : "addJob",
                                        job_id : job.id
                                    }
                                })
                                break
                        }
                        break
                    case 'error':
                        reject(results)
                        break
                }
            })
        })

        this.webworker.postMessage({
            action: 'exec',
            job: job,
        })
        return promise
    }

    async run(job) {
        let result
        try {
            const startTs = Date.now()
            result = await this.exec(job)
            job.result = result

            const log = {start: startTs, end: Date.now(), cmd: job.code}
            this.history.push(log)
        }catch (e) {
            console.log('Error in web worker runtime : %O', e)

        }

        return result
    }
}

module.exports = WebWorkerRuntime
