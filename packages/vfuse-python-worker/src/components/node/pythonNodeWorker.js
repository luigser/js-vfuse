//https://github.com/gabrielfreire/neuralnet.js/tree/wasm-nodejs
const pyodide = require('pyodide')

class PythonNodeWorker {
    constructor(runtime) {
        this.runtime = runtime
    }

    async run(job){
        try {
            if (!job.inline) {
                if (typeof job.data !== 'string') {
                    this.sandbox.input = job.data
                    job.code += `\nresults = ${job.name}(input)`
                } else {
                    job.code += `\nresults = ${job.name}(\`${job.data}\`)`
                }
            }
            this.vm.createContext(this.sandbox)
            this.vm.runInContext(job.code, this.sandbox);
            return ResultsUtils.convert(this.sandbox.results)
        }catch (e) {
            return {
                error : e.message,
                code : job.code
            }
        }
    }

    async init(){

        this.sandbox = {
            addJob : async(name, func, deps, input, group, packages) =>  await this.runtime.addJob(name, func, deps, input, group, packages),
            getDataFromUrl : async (url, start, end, type) => await this.runtime.getDataFromUrl(url, start, end, type),
            saveOnNetwork : async (data) => await this.runtime.saveOnNetwork(data),
            results : null
        }
    }

    async load(){}
}

module.exports = PythonNodeWorker
