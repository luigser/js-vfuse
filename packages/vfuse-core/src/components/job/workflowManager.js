'use strict'

const log = require('debug')('vfuse:workflowManager')
const Runtime = require('./runtime')
const Workflow = require('./workflow')
const Job = require('./job')
/*
WorkflowManager is responsible for job management and execution
 */
class WorkflowManager{
    /**
     * @param {Object} network
     * @param {Object} options
     */
    constructor(network, options){
        try {
            this.net = network
            this.runtime = new Runtime(options.worker, options.packages)
            this.workflowsQueue = []
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    async start(){
        await this.runtime.init()
        await this.runtime.load()
    }

    addWorkflow(workflow){
        this.workflowsQueue.push(workflow)
    }

   /* removeJob(job){
        let index = this.jobsQueue.indexOf(job);
        if (index > -1) {
            this.jobsQueue.splice(index, 1);
        }
    }*/

    async run(){
        let workflow, job
        try {
            for (let w in this.workflowsQueue) {
                workflow = this.workflowsQueue[w]
                workflow.status = Workflow.STATUS.RUNNING
                for (let j in workflow.jobs) {
                    job = workflow.jobs[j]
                    await this.runtime.run(job)
                    job.status = Job.SATUS.COMPLETED
                }
                workflow.status = Workflow.STATUS.COMPLETED
            }
        }catch(e){
            workflow.status = Workflow.STATUS.IDLE
            log("Got error during workflow execution: %o", e)
        }
    }
}

module.exports = WorkflowManager