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
                this.runtime = new WebWorkerRuntime(this.worker, options)
            }
            if (isNode) {

            }

            this.worker.webWorker.addEventListener("message", this.workerCallback.bind(this))
        }catch(e){
            console.log("Got some error during runtime manager creation %O", e)
        }
    }

    async workerCallback(e){
        const {action} = e.data
        if(action === 'VFuse:worker'){
            const {func, params} = e.data.todo
            switch(func){
                case 'addJob':
                    let p = JSON.parse(params)
                    await this.addJob(p.func, p.data, p.deps)
                    break
            }
        }/*else if(action === 'VFuse:runtime'){
            return Promise.resolve(action.data)
        }*/
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

            this.worker.webWorker.postMessage({
                action: 'VFuse:runtime',
                data: "JOB_ID"
            })
            console.log({func, input, deps})
        }catch (e) {
            console.log(e)
        }
    }

}

module.exports = RuntimeManager
