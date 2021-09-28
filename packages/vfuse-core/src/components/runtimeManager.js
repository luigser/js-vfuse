const Constants = require( "./constants")
const WebWorkerRuntime = require("./runtime/webWorkerRuntime")

class RuntimeManager{
    constructor(options) {
        try {
            switch (options.type) {
                case Constants.RUNTIME_TYPES.WEB:
                    this.runtime = new WebWorkerRuntime(options)
            }
        }catch(e){
            console.log("Got some error during runtime manager creation %O", e)
        }
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

    async runJob(job){
        await this.runtime.run(job)
    }

}

module.exports = RuntimeManager
