'use strict'
const Constants = require ("../constants")
//const {isNode} = require("browser-or-node");
//const { Worker, isMainThread, parentPort, workerData } = isNode ? require('worker_threads') : null

class NodeWorkerThreadRuntime {
    constructor(runtimeManager, worker , options, eventManager) {
        this.count = 0
        this.language = options.language
        this.id =  this.getRandomBetween(0,1000)
        this.history = []
        this.value = null
        this.packages = [worker.getDefaultPackages(), ... options && options.packages ? options.packages : []]
        this.worker   = worker
        //this.localWebworker = worker.getWebWorker()
        this.jobExecutionTimeout = options.preferences.TIMEOUTS.JOB_EXECUTION
        this.maxJobsQueueLength = options.preferences.LIMITS.MAX_CONCURRENT_JOBS
        this.workerThreads = options.workerThreads
        this.runtimeManager = runtimeManager
        this.eventManager = eventManager
        this.executionQueue = []

        this.eventManager.on(Constants.EVENTS.PREFERENCES_UPDATED, async function(preferences){
            if(preferences){
                this.jobExecutionTimeout = preferences.TIMEOUTS.JOB_EXECUTION
                this.maxJobsQueueLength = preferences.LIMITS.MAX_CONCURRENT_JOBS
                await this.createWorkersPool()
            }
        }.bind(this))

        // attach web worker callbacks
        this.worker.onerror = (e) => {
            console.log(
                `Error in worker ${this.id} at ${e.filename}, Line: ${e.lineno}, ${e.message}`
            )
        }
    }

    async createWorkersPool(){
        console.log("Initializing thread pool")
        /*for(let entry of this.executionQueue)
            entry.worker.terminate()*/
        this.executionQueue = []
        for(let i =0; i < this.maxJobsQueueLength; i++){
            console.log("Initializing Thread " + i )
            let worker = this.worker.getNodeWorker(this.workerThreads)
            this.executionQueue.push({ id : i, worker : worker, running : false, initialized : true, numOfExecutedJobs : 0})
           /* await this.initWorker(worker)
            await this.loadWorker(worker)*/
        }
    }

    getRandomBetween(min, max) {
        return Math.random() * (max - min) + min
    }

    history() {
        return this.history.map((x) => x.cmd).join('\n')
    }

    initWorker(worker){
        const promise = new Promise((resolve, reject) => {
            worker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'initialized') {
                    resolve(this)
                } else {
                    reject(new Error('Worker initialization failed'))
                }
            }
        })
        worker.postMessage({ action: 'init' })
        return promise
    }

    loadWorker(worker) {
        // preload packages
        const promise = new Promise((resolve, reject) => {
            worker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'loaded') {
                    resolve(this)
                } else {
                    reject(new Error('Worker loading failed'))
                }
            }
        })
        worker.postMessage({ action: 'load', packages: this.packages })
        return promise
    }

    async init() {
        await this.createWorkersPool()
    }

    async exec(job, worker) {
        const promise = new Promise((resolve, reject) => {
            worker.worker.on('message', async(e) => {
                const { action, results } = e
                switch(action){
                    case 'running':
                        const {status} = e
                        //console.log(`Worker ${worker.id} : running ${status}`)
                        worker.running = status
                        //console.log(`Worker ${worker.id} running : ${status}`)
                        break
                    case 'return':
                        resolve({results: results, executionTime : e.executionTime} )
                        worker.worker.onmessage = null
                        worker.running = false
                        //console.log(`Worker ${worker.id} end execution`)
                        break
                    case 'VFuse:worker':
                        const {func, params} = e.todo
                        let p = JSON.parse(params)
                        switch(func){
                            case 'addJob':
                                let job = await this.runtimeManager.addJob(p.name, p.func, p.deps,  p.input, p.group, p.packages)
                                if(job) {
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJob",
                                            job_id: job.id
                                        }
                                    })
                                }else{
                                    worker.worker.postMessage({
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
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            content: content
                                        }
                                    })
                                }else{
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            error : content && content.error ? content.error.toString() : 'Cannot fetch from given url'
                                        }
                                    })
                                    resolve({results: {error : content && content.error ? content.error.toString() : 'Cannot fetch from given url'}} )
                                }
                                break
                            case 'saveData':
                                let cid = await this.runtimeManager.saveData(p.data)
                                if(cid && !cid.error) {
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveData",
                                            cid: cid
                                        }
                                    })
                                }else{
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveData",
                                            error : cid.error.toString()
                                        }
                                    })
                                    resolve({results: {error : cid.error.toString()}})
                                }
                                break
                            case 'getData':
                                let data = await this.runtimeManager.getFromNetwork(p.cid)
                                if(data && !data.error) {
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getData",
                                            content: data
                                        }
                                    })
                                }else{
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getData",
                                            error : data.error.toString()
                                        }
                                    })
                                    resolve({results: {error : data.error.toString()}})
                                }
                                break
                            case 'setRepeating':
                                let sejResult = await this.runtimeManager.setRepeating(p.job_id)
                                if(sejResult && !sejResult.error) {
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setRepeating",
                                            result: sejResult
                                        }
                                    })
                                }else{
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setRepeating",
                                            error : sejResult.error.toString()
                                        }
                                    })
                                    resolve({results: {error : sejResult.error.toString()}})
                                }
                                break
                            case 'setJobReturnType':
                                let sjrtResult = await this.runtimeManager.setJobReturnType(p.job_id, p.type)
                                if(sjrtResult && !sjrtResult.error) {
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setJobReturnType",
                                            result: sjrtResult
                                        }
                                    })
                                }else{
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setJobReturnType",
                                            error : sjrtResult.error.toString()
                                        }
                                    })
                                    resolve({results: {error : sjrtResult.error.toString()}})
                                }
                                break
                            case 'addToGroup':
                                let atgResult = await this.runtimeManager.addToGroup(p.job_id, p.group)
                                if(atgResult && !atgResult.error) {
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addToGroup",
                                            result: atgResult
                                        }
                                    })
                                }else{
                                    worker.worker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addToGroup",
                                            error : atgResult.error.toString()
                                        }
                                    })
                                    resolve({results: {error : atgResult.error.toString()}})
                                }
                                break
                        }
                        break
                    case 'error':
                        worker.worker.onmessage = null
                        reject(results)
                        break
                }
            })
        })

        worker.worker.postMessage({
            action: 'exec',
            job: job,
        })
        worker.running = true
        return promise
    }

    async selectWorker(){
        let worker = null
        //worker = MathJs.pickRandom(this.executionQueue, 1 / this.maxJobsQueueLength)[0]
        while(!worker) {
            worker = this.executionQueue.find(w => !w.running)
            //console.log(`Selected worker ${worker.id} with running ${worker.running}`)
        }
        worker.numOfExecutedJobs = worker.numOfExecutedJobs + 1

        return worker
    }


    async run(job) {
        let result = null
        try {
            let worker = await this.selectWorker()
            let timeout = setTimeout(function () {
                if (!result) {
                    clearTimeout(timeout)
                    if (worker.worker.terminate) {
                        console.log(`Terminating worker ${worker.id}`)
                        //worker.webworker.terminate()
                        worker.running = false
                    }
                    result = {
                        action: 'return',
                        results: {
                            error: {
                                message: "Current job exceed the execution timeout",
                                code: job.code
                            }
                        }
                    }
                }
            }.bind(this), this.jobExecutionTimeout * 1000)
            result = await this.exec(job, worker)
            clearTimeout(timeout)
            //const log = {start: startTs, end: Date.now(), cmd: job.code}
            //this.history.push(log)
            console.log(`Worker ${worker.id} executed ${worker.numOfExecutedJobs} jobs ${job.name}. Last job execution time ${result.executionTime} ms`)
        }catch (e) {
            console.log('Error in node worker runtime : ' +  e.message)
        }

        return result
    }
}

module.exports = NodeWorkerThreadRuntime