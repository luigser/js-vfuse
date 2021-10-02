const WebWorkerRuntime = require("./runtime/webWorkerRuntime")
const  { isNode, isWebWorker, isBrowser } = require("browser-or-node");
const JavascriptWorker = require('./runtime/workers/javascript/javascriptWorker')

class RuntimeManager{
    constructor(options) {
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
            if(isBrowser){
                this.worker = !options ? new JavascriptWorker() : options.worker
                this.runtime = new WebWorkerRuntime(this.worker, options, this.workerCallback.bind(this))
            }
            if(isNode){

            }
        }catch(e){
            console.log("Got some error during runtime manager creation %O", e)
        }
    }

    workerCallback(e){
        const {func, params} = e.data.todo
        if(func === 'addJob'){
            let p = JSON.parse(params)
            this.addJob(p.func, p.data, p.deps)
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

    addJob(func, input, deps){
        console.log({func, input, deps})
    }

}

module.exports = RuntimeManager
