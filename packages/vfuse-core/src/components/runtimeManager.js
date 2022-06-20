//const JavascriptNodeWorker = require('./runtime/workers/javascript/node/javascriptNodeWorker')
const  { isNode, isWebWorker, isBrowser } = require('browser-or-node');
const JavascriptWorker = require('./runtime/workers/javascript/javascriptWorker')
const Constants = require('./constants')

class RuntimeManager{
    constructor(options, workflowManager, eventManager) {
        this.workflowManager = workflowManager
        this.eventManager = eventManager
        this.runtimes = new Map()
        this.options = options
        this.preferences = null
    }

    async start(preferences){
        try {
            this.preferences = preferences
            await this.load(this.options)
            /*if (this.workers) {
                for(let key of this.workers.keys()){
                    await this.workers.get(key).init()
                    await this.workers.get(key).load()
                }
            }*/
        }catch(e){
            console.log("Got some error during runtime initialization %O", e)
        }
    }

    async load(options){
        try {
            if (isBrowser) {
                const WebWorkerRuntime = require('./runtime/webWorkerRuntime')
                if(options) {
                    for(let option of options) {
                        option.preferences = this.preferences
                        let runtime = new WebWorkerRuntime(this, new option.worker(), option, this.eventManager)
                        await runtime.init()
                        this.runtimes.set(option.worker.getLanguage(), runtime )
                    }
                }
                let runtime = new WebWorkerRuntime(this,
                    new JavascriptWorker(),
                    {language : Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT, preferences : this.preferences},
                    this.eventManager
                )
                await runtime.init()
                this.runtimes.set(Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT, runtime)
            }
            if (isNode) {
                //To fix for other programming language node worker
               /* if(options) {
                    for(let option of options)
                       this.workers.set(option.getLanguage(), new option.worker(this, this.eventManager))
                }*/
                const NodeWorkerRuntime = require("./runtime/nodeWorkerRuntime");
                let runtime = new NodeWorkerRuntime(this,
                    new JavascriptWorker(),
                    {language : Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT, preferences : this.preferences},
                    this.eventManager)
                await runtime.init()
                this.runtimes.set(Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT, runtime)
            }
        }catch(e){
            console.log("Got some error during runtime manager creation %O", e)
        }
    }

    async reload(options){
        this.load(options)
        await this.start()
    }

    async runJob(job){
        let runtime = this.runtimes.get(job.language)
        return runtime ? await runtime.run(job) : { error : job.language + ' is not currently supported'}
    }

    async runLocalCode(code, language){
        let worker = this.runtimes.get(language)
        /*if(language === Constants.PROGRAMMING_LANGUAGE.PYTHON) {
            await worker.restart()
        }*/
        return await worker.run({ code : code, inline : true, language: language})
    }

    async addJob(name, func, deps, input, group, packages){
        try {
            //UPDATE JobsDAG
            return this.workflowManager.addJob(name, func, deps, input, group, packages)
        }catch (e) {
            console.log(e)
        }
    }

    async setEndlessJob(job_id){
        try {
            return this.workflowManager.setEndlessJob(job_id)
        }catch (e) {
            console.log(e)
        }
    }

    async setJobReturnType(job_id, type){
        try {
            return this.workflowManager.setJobReturnType(job_id, type)
        }catch (e) {
            console.log(e)
        }
    }

    async addJobToGroup(job_id, group){
        try {
            return this.workflowManager.addJobToGroup(job_id, group)
        }catch (e) {
            console.log(e)
        }
    }

    async getDataFromUrl(url, start, end, type){
        try {
            return this.workflowManager.getDataFromUrl(url, start, end, type)
        }catch (e) {
            console.log(e)
        }
    }

    async saveOnNetwork(data){
        try {
            return this.workflowManager.saveOnNetwork(data)
        }catch (e) {
            console.log(e)
        }
    }

    async getFromNetwork(cid){
        try {
            return this.workflowManager.getFromNetwork(cid)
        }catch (e) {
            console.log(e)
        }
    }

}

module.exports = RuntimeManager
