//const JavascriptNodeWorker = require('./runtime/workers/javascript/node/javascriptNodeWorker')
const  { isNode, isWebWorker, isBrowser } = require('browser-or-node');
const JavascriptWorker = require('./runtime/workers/javascript/javascriptWorker')
const Constants = require('./constants')

class RuntimeManager{
    constructor(options, workflowManager) {
        this.workflowManager = workflowManager
        this.runtimes = new Map()
        this.load(options)
    }

    async start(){
        try {
            if (this.runtimes) {
                for(let key of this.runtimes.keys()){
                    await this.runtimes.get(key).init()
                    await this.runtimes.get(key).load()
                }
            }
        }catch(e){
            console.log("Got some error during runtime initialization %O", e)
        }
    }

    load(options){
        try {
            if (isBrowser) {
                const WebWorkerRuntime = require('./runtime/webWorkerRuntime')
                if(options)
                    this.runtimes.set(options.worker.getLanguage(), new WebWorkerRuntime(this,  new options.worker(), options))
                this.runtimes.set(Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT, new WebWorkerRuntime(this,  new JavascriptWorker(), {language : Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT}))
            }
            if (isNode) {
                //const NodeWorkerRuntime = require('./runtime/nodeWorkerRuntime')
                if(options)
                    this.runtimes.set(options.getLanguage(),new options.worker(this, {language : options.getLanguage()}))
                if(!options || options.getLoadedLanguages() !== Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT)
                   this.runtimes.set(Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT, (new JavascriptWorker()).getNodeWorker(this))
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
        let runtime = this.runtimes.get(language)
        if(language === Constants.PROGRAMMING_LANGUAGE.PYTHON) {
            await runtime.restart()
        }
        return await runtime.run({ code : code, inline : true, language: language})
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
