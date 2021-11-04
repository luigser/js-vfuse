'use strict'

const Constants = require ("../constants")

class WebWorkerRuntime {
    constructor(runtimeManager, worker , options, callback) {
        this.count = 0
        this.language = options.language
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
        //todo to fix
        if(this.language === Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT) this.webworker = this.worker.getWebWorker()
        const promise = new Promise((resolve, reject) => {
            this.webworker.addEventListener('message', async(e) => {
                const { action, results } = e.data
                switch(action){
                    case 'return':
                        resolve(results)
                        break
                    case 'VFuse:worker':
                        const {func, params} = e.data.todo
                        let p = JSON.parse(params)
                        switch(func){
                            case 'addJob':
                                let job = await this.runtimeManager.addJob(p.name, p.func, p.deps, p.input, p.packages)
                                if(job) {
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJob",
                                            job_id: job.id
                                        }
                                    })
                                }else{
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJob",
                                            error : 'Error adding job'
                                        }
                                    })
                                }
                                break
                            case 'getDataFromUrl':
                                let content = await this.runtimeManager.getDataFromUrl(p.url, p.start, p.end, p.type)
                                if(content && !content.error) {
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            content: content
                                        }
                                    })
                                }else{
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            error : content.error.toString()
                                        }
                                    })
                                }
                                break
                            case 'saveWorkflow':
                                break
                            case 'submitWorkflow':
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

            const log = {start: startTs, end: Date.now(), cmd: job.code}
            this.history.push(log)
        }catch (e) {
            console.log('Error in web worker runtime : %O', e)

        }

        return result
    }
}

module.exports = WebWorkerRuntime
