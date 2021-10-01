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
            this.worker = !options ? new JavascriptWorker() : options.worker

            if(isBrowser){
                this.runtime = new WebWorkerRuntime(this.worker, options)
                this.worker.webWorker.onmessage = function(e){
                    const {action, params} = e.data
                    if(action === 'addJob'){
                        let params = JSON.parse(params)
                        this.addJob(params.func, params.data, params.deps)
                    }
                }.bind(this)
            }
            if(isNode){

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

    addJob(func, input, deps){
        console.log({func, input, deps})
    }

}

module.exports = RuntimeManager
