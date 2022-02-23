const Constants =  require("../../../../constants");

const vm = require('vm');
const ResultsUtils = require('../../../../../utils/resultsUtils')

class JavascriptNodeWorker {
    constructor(runtime) {
        this.vm = vm
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
            let start = performance.now()
            this.vm.runInContext(job.code, this.sandbox, Constants.TIMEOUTS.JOB_EXECUTION);
            return {results: ResultsUtils.convert(this.sandbox.results), executionTime : performance.now() - start}
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
            getFromNetwork: async(cid) => await this.runtime.getFromNetwork(cid),
            setEndlessJob: async(job_id) => await this.runtime.setEndlessJob(job_id),
            addJobToGroup: async(job_id, group) => await this.runtime.addJobToGroup(job_id, group),
            results : null
        }
        this.vm.createContext(this.sandbox)
    }

    async load(){}
}

module.exports = JavascriptNodeWorker
