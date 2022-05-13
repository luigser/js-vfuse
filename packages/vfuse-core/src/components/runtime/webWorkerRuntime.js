'use strict'

const Constants = require ("../constants")
const MathJs = require('mathjs')

class WebWorkerRuntime {
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
        this.runtimeManager = runtimeManager
        this.eventManager = eventManager
        this.executionQueue = []
        this.selectionWorkerLock = false

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
        for(let entry of this.executionQueue)
            entry.webworker.terminate()
        this.executionQueue = []
        for(let i =0; i < this.maxJobsQueueLength; i++){
            console.log("Initializing Thread " + i )
            let worker = this.worker.getWebWorker()
            this.executionQueue.push({ id : i, webworker : worker, running : false, initialized : true, numOfExecutedJobs : 0})
            await this.initWorker(worker)
            await this.loadWorker(worker)
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
        // initialize Runtime
        /*const promise = new Promise((resolve, reject) => {
            this.webworker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'initialized') {
                    resolve(this)
                } else {
                    reject(new Error('Runtime initialization failed'))
                }
            }
        })
        this.webworker.postMessage({ action: 'init' })
        return promise*/
        await this.createWorkersPool()
    }

    /*load() {
        // preload packages
        const promise = new Promise((resolve, reject) => {
            this.localWebworker.onmessage = (e) => {
                const { action } = e.data
                if (action === 'loaded') {
                    resolve(this)
                } else {
                    reject(new Error('Package preloading failed'))
                }
            }
        })
        this.localWebworker.postMessage({ action: 'load', packages: this.packages })
        return promise
    }

    async restart() {
        const startTs = Date.now()
        this.localWebworker.terminate()
        this.localWebworker = this.worker.getWebWorker()
        await this.init()
        await this.load()
        const log = { start: startTs, end: Date.now(), cmd: '$RESTART SESSION$' }
        this.history.push(log)
    }*/

    async exec(job, worker, runningCallback) {
        //todo to fix
        //if(this.language === Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT) this.webworker = this.worker.getWebWorker()
        const promise = new Promise((resolve, reject) => {
            worker.webworker.onmessage = async(e) => {
                const { action, results } = e.data
                switch(action){
                    case 'running':
                        const {status} = e.data
                        //console.log(`Worker ${worker.id} : running ${status}`)
                        worker.running = status
                        //console.log(`Worker ${worker.id} running : ${status}`)
                        break
                    case 'return':
                        resolve({results: results, executionTime : e.data.executionTime} )
                        worker.running = false
                        worker.webworker.onmessage = null
                        //console.log(`Worker ${worker.id} end execution`)
                        break
                    case 'VFuse:worker':
                        const {func, params} = e.data.todo
                        let p = JSON.parse(params)
                        switch(func){
                            case 'addJob':
                                let job = await this.runtimeManager.addJob(p.name, p.func, p.deps,  p.input, p.group, p.packages)
                                if(job) {
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJob",
                                            job_id: job.id
                                        }
                                    })
                                }else{
                                    worker.webworker.postMessage({
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
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            content: content
                                        }
                                    })
                                }else{
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getDataFromUrl",
                                            error : content && content.error ? content.error.toString() : 'Cannot fetch from given url'
                                        }
                                    })
                                    resolve({results: {error : content && content.error ? content.error.toString() : 'Cannot fetch from given url'}} )
                                }
                                break
                            case 'saveOnNetwork':
                                let cid = await this.runtimeManager.saveOnNetwork(p.data, p.json)
                                if(cid && !cid.error) {
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveOnNetwork",
                                            cid: cid
                                        }
                                    })
                                }else{
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveOnNetwork",
                                            error : cid.error.toString()
                                        }
                                    })
                                    resolve({results: {error : cid.error.toString()}})
                                }
                                break
                            case 'getFromNetwork':
                                let data = await this.runtimeManager.getFromNetwork(p.cid)
                                if(data && !data.error) {
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getFromNetwork",
                                            content: data
                                        }
                                    })
                                }else{
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getFromNetwork",
                                            error : data.error.toString()
                                        }
                                    })
                                    resolve({results: {error : data.error.toString()}})
                                }
                                break
                            case 'setEndlessJob':
                                let sejResult = await this.runtimeManager.setEndlessJob(p.job_id)
                                if(sejResult && !sejResult.error) {
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setEndlessJob",
                                            result: sejResult
                                        }
                                    })
                                }else{
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setEndlessJob",
                                            error : sejResult.error.toString()
                                        }
                                    })
                                    resolve({results: {error : sejResult.error.toString()}})
                                }
                                break
                            case 'setJobReturnType':
                                let sjrtResult = await this.runtimeManager.setJobReturnType(p.job_id, p.type)
                                if(sjrtResult && !sjrtResult.error) {
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setJobReturnType",
                                            result: sjrtResult
                                        }
                                    })
                                }else{
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setJobReturnType",
                                            error : sjrtResult.error.toString()
                                        }
                                    })
                                    resolve({results: {error : sjrtResult.error.toString()}})
                                }
                                break
                            case 'addJobToGroup':
                                let atgResult = await this.runtimeManager.addJobToGroup(p.job_id, p.group)
                                if(atgResult && !atgResult.error) {
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJobToGroup",
                                            result: atgResult
                                        }
                                    })
                                }else{
                                    worker.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJobToGroup",
                                            error : atgResult.error.toString()
                                        }
                                    })
                                    resolve({results: {error : atgResult.error.toString()}})
                                }
                                break
                        }
                        break
                    case 'error':
                        worker.webworker.onmessage = null
                        reject(results)
                        break
                }
            }
        })

        worker.webworker.postMessage({
            action: 'exec',
            job: job,
        })
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
        worker.running = true
        console.log(`Worker ${worker.id} executed ${worker.numOfExecutedJobs} jobs`)
        return worker
    }


    async run(job) {
        let result = null
        //console.log(`Selected worker ${worker.id}`)
        try {
            const startTs = Date.now()
            let worker = await this.selectWorker()
            let timeout = setTimeout(function () {
                if(!result) {
                    clearTimeout(timeout)
                    if(worker.webworker.terminate) {
                        console.log(`Terminating worker ${worker.id}`)
                        worker.webworker.terminate()
                        worker.running = false
                    }
                    result = {
                        action: 'return',
                        results: {error: {
                                message : "Current job exceed the execution timeout",
                                code : job.code
                            }}
                    }
                }
            }.bind(this), this.jobExecutionTimeout * 1000)
            result = await this.exec(job, worker)
            clearTimeout(timeout)
            const log = {start: startTs, end: Date.now(), cmd: job.code}
            console.log(`End execution job : ${job.name}`)
            this.history.push(log)
        }catch (e) {
            console.log('Error in web worker runtime : ' +  e.message)

        }

        return result
    }
}

module.exports = WebWorkerRuntime
