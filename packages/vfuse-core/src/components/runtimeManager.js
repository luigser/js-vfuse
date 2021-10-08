const WebWorkerRuntime = require("./runtime/webWorkerRuntime")
const  { isNode, isWebWorker, isBrowser } = require("browser-or-node");
const JavascriptWorker = require('./runtime/workers/javascript/javascriptWorker')

class RuntimeManager{
    constructor(options, workflowManager) {
        this.workflowManager = workflowManager
        this.load(options)
    }

    async start(){
        try {
            if (this.runtime) {
                await this.runtime.init()
                await this.runtime.load()
            }
        }catch(e){
            console.log("Got some error during runtime initialization %O", e)
        }
    }

    load(options){
        try {
            if (isBrowser) {
                this.worker = !options ? new JavascriptWorker() : options.worker
                this.runtime = new WebWorkerRuntime(this, this.worker, options)
            }
            if (isNode) {

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
        return await this.runtime.run(job)
    }

    async runLocalCode(code){
        return await this.runtime.run({ code : code})
    }

    async addJob(func, input, deps){
        try {
            //UPDATE JobsDAG
            console.log({func, input, deps})
            return { id : 'job_id'}
        }catch (e) {
            console.log(e)
        }
    }

}

module.exports = RuntimeManager
