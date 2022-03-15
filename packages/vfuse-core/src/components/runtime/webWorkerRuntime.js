'use strict'

const Constants = require ("../constants")

class WebWorkerRuntime {
    constructor(runtimeManager, worker , options, eventManager) {
        this.count = 0
        this.language = options.language
        this.id =  this.getRandomBetween(0,1000)
        this.history = []
        this.value = null
        this.packages = [worker.getDefaultPackages(), ... options && options.packages ? options.packages : []]
        this.worker   = worker
        this.webworker = worker.getWebWorker()
        this.jobExecutionTimeout = Constants.TIMEOUTS.JOB_EXECUTION
        this.runtimeManager = runtimeManager
        this.eventManager = eventManager

        this.eventManager.on(Constants.EVENTS.PROFILE_STATUS, function(data){
            if(data.profile.status){
                this.jobExecutionTimeout = data.profile.preferences.TIMEOUTS.JOB_EXECUTION
            }
        }.bind(this))

        this.eventManager.on(Constants.EVENTS.PREFERENCES_UPDATED, function(preferences){
            if(preferences){
                this.jobExecutionTimeout = preferences.TIMEOUTS.JOB_EXECUTION
            }
        }.bind(this))

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
        return promise
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
            }
        })
        this.webworker.postMessage({ action: 'load', packages: this.packages })
        return promise
    }

    async restart() {
        const startTs = Date.now()
        this.webworker.terminate()
        this.webworker = this.worker.getWebWorker()
        await this.init()
        await this.load()
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
                        resolve({results: results, executionTime : e.data.executionTime} )
                        break
                    case 'VFuse:worker':
                        const {func, params} = e.data.todo
                        let p = JSON.parse(params)
                        switch(func){
                            case 'addJob':
                                let job = await this.runtimeManager.addJob(p.name, p.func, p.deps,  p.input, p.group, p.packages)
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
                            case 'saveOnNetwork':
                                let cid = await this.runtimeManager.saveOnNetwork(p.data, p.json)
                                if(content && !content.error) {
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveOnNetwork",
                                            cid: cid
                                        }
                                    })
                                }else{
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "saveOnNetwork",
                                            error : content.error.toString()
                                        }
                                    })
                                }
                                break
                            case 'getFromNetwork':
                                let data = await this.runtimeManager.getFromNetwork(p.cid)
                                if(data && !data.error) {
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getFromNetwork",
                                            content: data
                                        }
                                    })
                                }else{
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "getFromNetwork",
                                            error : content.error.toString()
                                        }
                                    })
                                }
                                break
                            case 'setEndlessJob':
                                let sejResult = await this.runtimeManager.setEndlessJob(p.job_id)
                                if(sejResult && !sejResult.error) {
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setEndlessJob",
                                            result: sejResult
                                        }
                                    })
                                }else{
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setEndlessJob",
                                            error : sejResult.error.toString()
                                        }
                                    })
                                }
                                break
                            case 'setJobReturnType':
                                let sjrtResult = await this.runtimeManager.setJobReturnType(p.job_id, p.type)
                                if(sjrtResult && !sjrtResult.error) {
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setJobReturnType",
                                            result: sjrtResult
                                        }
                                    })
                                }else{
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "setJobReturnType",
                                            error : sjrtResult.error.toString()
                                        }
                                    })
                                }
                                break
                            case 'addJobToGroup':
                                let atgResult = await this.runtimeManager.addJobToGroup(p.job_id, p.group)
                                if(atgResult && !atgResult.error) {
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJobToGroup",
                                            result: atgResult
                                        }
                                    })
                                }else{
                                    this.webworker.postMessage({
                                        action: 'VFuse:runtime',
                                        data: {
                                            func: "addJobToGroup",
                                            error : atgResult.error.toString()
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

        this.webworker.postMessage({
            action: 'exec',
            job: job,
        })
        return promise
    }

    async run(job) {
        let result = null
        try {
            const startTs = Date.now()
            let timeout = setTimeout(function () {
                if(!result) {
                    clearTimeout(timeout)
                    this.worker.terminate()
                    result = {
                        action: 'return',
                        results: {error: {
                                message : "Current job exceed the execution timeout",
                                code : job.code
                            }}
                    }
                }
            }.bind(this), this.jobExecutionTimeout)
            result = await this.exec(job)
            clearTimeout(timeout)
            const log = {start: startTs, end: Date.now(), cmd: job.code}
            this.history.push(log)
        }catch (e) {
            console.log('Error in web worker runtime : %O', e)

        }

        return result
    }
}

module.exports = WebWorkerRuntime
