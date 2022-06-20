'use strict'

const Constants = require ("../constants")
const MathJs = require('mathjs')

class NodeWorkerRuntime {
    constructor(runtime, worker , options, eventManager) {
        this.count = 0
        this.language = options.language
        this.id =  this.getRandomBetween(0,1000)
        this.history = []
        this.value = null
        this.worker   = worker
        this.jobExecutionTimeout = options.preferences.TIMEOUTS.JOB_EXECUTION
        this.maxJobsQueueLength = options.preferences.LIMITS.MAX_CONCURRENT_JOBS
        this.eventManager = eventManager
        this.executionQueue = []
        this.runtime = runtime

        this.eventManager.on(Constants.EVENTS.PREFERENCES_UPDATED, async function(preferences){
            if(preferences){
                this.jobExecutionTimeout = preferences.TIMEOUTS.JOB_EXECUTION
                this.maxJobsQueueLength = preferences.LIMITS.MAX_CONCURRENT_JOBS
                await this.createWorkersPool()
            }
        }.bind(this))

        // attach web worker callbacks
        this.worker.onerror = (e) => {
            console.log(
                `Error in worker ${this.id} at ${e.filename}, Line: ${e.lineno}, ${e.message}`
            )
        }
    }

    async createWorkersPool(){
        console.log("Initializing thread pool")
        this.executionQueue = []
        for(let i =0; i < this.maxJobsQueueLength; i++){
            console.log("Initializing Thread " + i )
            let worker = this.worker.getNodeWorker(this.runtime)
            await worker.init()
            this.executionQueue.push({ id : i, worker : worker, running : false, initialized : true, numOfExecutedJobs : 0})
        }
    }

    getRandomBetween(min, max) {
        return Math.random() * (max - min) + min
    }

    history() {
        return this.history.map((x) => x.cmd).join('\n')
    }

    async init() {
        await this.createWorkersPool()
    }


    async selectWorker(){
        let worker = null
        while(!worker) {
            worker = this.executionQueue.find(w => !w.running)
        }
        worker.numOfExecutedJobs = worker.numOfExecutedJobs + 1
        worker.running = true
        return worker
    }


    async run(job) {
        let result = null
        //console.log(`Selected worker ${worker.id}`)
        try {
            const startTs = Date.now()
            let worker = await this.selectWorker()
            let timeout = setTimeout(function () {
                if (!result) {
                    clearTimeout(timeout)
                    if (worker.terminate) {
                        console.log(`Terminating worker ${worker.id}`)
                        worker.worker.terminate()
                        worker.running = false
                    }
                    result = {
                        action: 'return',
                        results: {
                            error: {
                                message: "Current job exceed the execution timeout",
                                code: job.code
                            }
                        }
                    }
                }
            }.bind(this), this.jobExecutionTimeout * 1000)
            result = await worker.worker.run(job, worker)
            clearTimeout(timeout)
            console.log(`Worker ${worker.id} executed ${worker.numOfExecutedJobs} jobs ${job.name}. Last job execution time ${result.executionTime} ms`)
            worker.running = false
        }catch (e) {
            console.log('Error in web worker runtime : ' +  e.message)
        }

        return result
    }
}

module.exports = NodeWorkerRuntime