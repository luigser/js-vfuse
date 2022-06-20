const Constants =  require("../../../../constants");

const vm = require('vm');
const ResultsUtils = require('../../../../../utils/resultsUtils')

class JavascriptNodeWorker {
    constructor(runtime, eventManager) {
        this.vm = vm
        this.runtime = runtime
        this.eventManagr = eventManager
    }

    escape (key, val) {
        if (typeof(val)!="string") return val
        //return encodeURIComponent(val)
        return val
            .replace(/[\\]/g, '\\\\')
            .replace(/[\/]/g, '\\/')
            .replace(/[\b]/g, '\\b')
            .replace(/[\f]/g, '\\f')
            .replace(/[\n]/g, '\\n')
            .replace(/[\r]/g, '\\r')
            .replace(/[\t]/g, '\\t')
            .replace(/["]/g, '\\"')
            .replace(/\\'/g, "\\'")
    }

    async run(job){
        try {
            if (!job.inline) {
                if (typeof job.data !== 'string') {
                    this.sandbox.input = job.data
                    //job.code += `\nresults = ${job.name}(input)`
                    job.code += `\nresults = (async ()=> {let r = await ${job.name}(input); return Promise.resolve(r)})()`
                } else {
                    //job.code += `\nresults = ${job.name}(\`${job.data}\`)`
                    job.code += `\nresults = (async ()=> {let r = await ${job.name}(\'${job.data}\'); return Promise.resolve(r)})()`
                }
            }
           /* let input
            if(!job.inline){
                if(typeof job.data !== 'string' && typeof job.data !== 'number') {
                    input = JSON.stringify(job.data, escape)
                    job.code += `\nlet input = JSON.parse(\`${input}\`)\nreturn ${job.name}(input)`//backticks
                }else{
                    job.code +=  typeof job.data !== 'number' ? `\nreturn ${job.name}(\`${job.data}\`)` :  `\nreturn ${job.name}(${job.data})`
                }
            }
            let c = `async function map(data){
                let mapped = new Map()
                let input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/giusdam/data/main/wordcount1-64.txt")
                input.split(/\W+/).map(word => {
                    if(word !== "")
                        mapped.set(word, mapped.has(word) ? mapped.get(word) + 1 : 1)
                })
                return mapped
            }
            let input = JSON.parse(\`null\`)
            return map(input)`
            let code = `let F = new AsyncFunction('', ${job.code} ); let results = await(F());`
            */

            //const script = new vm.Script(job.code)
            let start = performance.now()
            await this.vm.runInContext(job.code, this.sandbox, Constants.TIMEOUTS.JOB_EXECUTION);
            //script.runInContext(this.sandbox)
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
            AsyncFunction : Object.getPrototypeOf(async function(){}).constructor,
            VFuse : {
                addJob: async (name, func, deps, input, group) => await this.runtime.addJob(name, func, deps, input, group),
                getDataFromUrl: async (url, start, end) => await this.runtime.getDataFromUrl(url, start, end),
                saveOnNetwork: async (data, json) => await this.runtime.saveOnNetwork(data, json),
                getFromNetwork: async (cid) => await this.runtime.getFromNetwork(cid),
                setEndlessJob: async (job_id) => await this.runtime.setEndlessJob(job_id),
                setJobReturnType: async (job_id, type) => await this.runtime.setJobReturnType(job_id, type),
                addJobToGroup: async (job_id, group) => await this.runtime.addJobToGroup(job_id, group)
            },
            results : null
        }
        this.vm.createContext(this.sandbox)
    }

    async load(){}
}

module.exports = JavascriptNodeWorker
