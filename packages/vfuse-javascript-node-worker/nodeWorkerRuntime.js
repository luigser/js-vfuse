'use strict'
const { Worker } = require('worker_threads')
const path = require('path')
class NodeWorkerRuntime {
    constructor(runtimeManager, options, callback) {
        this.count = 0
        this.language = options.language
        this.id =  this.getRandomBetween(0,1000)
        this.history = []
        this.value = null
        //this.packages = [worker.getDefaultPackages(), ... options && options.packages ? options.packages : []]
        this.worker   = new Worker(path.join(__dirname, 'workers' ,'javascript', 'node', 'javascriptThreadNodeWorker.js'), { workerData: {}})
        this.callback = callback
        this.runtimeManager = runtimeManager
        this.package = null
        // attach web worker callbacks
        this.worker.onerror = (e) => {
            console.log(
                `Error in worker ${this.id} at ${e.filename}, Line: ${e.lineno}, ${e.message}`
            )
        }
    }

    getRandomBetween(min, max) {
        return Math.random() * (max - min) + min
    }

    history() {
        return this.history.map((x) => x.cmd).join('\n')
    }

    init() {
        // initialize Runtime
        const promise = new Promise((resolve, reject) => {
            this.worker.on('message', (e) => {
                const { action } = e
                if (action === 'initialized') {
                    resolve(this)
                } else {
                    reject(new Error('Runtime initialization failed'))
                }
            })
        })
        this.worker.postMessage({ action: 'init' })
        return promise
    }

    load() {
        // preload packages
        const promise = new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { action } = e
                if (action === 'loaded') {
                    resolve(this)
                } else {
                    reject(new Error('Package preloading failed'))
                }
            }
        })

        this.worker.postMessage({ action: 'load', packages: this.packages })
        return promise
    }

    async restart() {
        const startTs = Date.now()
        this.worker.terminate()
        this.worker = new Worker('./node/javascriptNodeWorker.js', { workerData: {}})
        await this.init()
        await this.load()
        const log = { start: startTs, end: Date.now(), cmd: '$RESTART SESSION$' }
        this.history.push(log)
    }

    exec(job) {
        //todo to fix
        this.worker =  new Worker(path.join(__dirname, 'workers' ,'javascript', 'node', 'javascriptNodeWorker.js'), { workerData: {}})
        const promise = new Promise((resolve, reject) => {
            this.worker.on('message', async(e) => {
                const { action, results } = e
                switch(action){
                    case 'return':
                        resolve({results: results, executionTime : e.executionTime} )
                        break
                    case 'VFuse:worker':
                        const {func, params} = e.todo
                        let p = JSON.parse(params)
                        switch(func){
                            case 'addJob':
                                let job = await this.runtimeManager.addJob(p.name, p.func, p.deps,  p.input, p.group, p.packages)
                                if(job) {
                                    this.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJob",
                                            job_id: job.id
                                        }
                                    })
                                }else{
                                    this.worker.postMessage({
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
                                    this.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            content: content
                                        }
                                    })
                                }else{
                                    this.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            error : content.error.toString()
                                        }
                                    })
                                }
                                break
                            case 'saveOnNetwork':
                                let cid = await this.runtimeManager.saveOnNetwork(p.data)
                                if(content && !content.error) {
                                    this.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveOnNetwork",
                                            cid: cid
                                        }
                                    })
                                }else{
                                    this.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveOnNetwork",
                                            error : content.error.toString()
                                        }
                                    })
                                }
                                break
                        }
                        break
                    case 'error':
                        reject(results)
                        break
                }
            })
        })

        this.worker.postMessage({
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

module.exports = NodeWorkerRuntime
