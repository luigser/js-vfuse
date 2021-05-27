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

    getWorkflows(){
        //get workflow from global IPFS queue
    }

    addWorkflow(workflow){
        //add workflow on IPFS
        this.workflowsQueue.push(workflow)
    }

   /* removeJob(job){
        let index = this.jobsQueue.indexOf(job);
        if (index > -1) {
            this.jobsQueue.splice(index, 1);
        }
    }*/

    async runJob(job){
        try {
            await this.runtime.run(job)
            job.status = Job.SATUS.COMPLETED
            //Communicate the job end to the network
        }catch(e){
            log("Got error during job execution: %o", e)
        }
    }

    async runWorkflow(workflow){
        try {
            workflow.status = Workflow.STATUS.RUNNING
            for (let j in workflow.jobs) {
               await this.runJob(workflow.jobs[j])
            }
            workflow.status = Workflow.STATUS.COMPLETED
            //Communicate the workflow end to the network
        }catch(e){
            workflow.status = Workflow.STATUS.IDLE
            log("Got error during workflow execution: %o", e)
        }

    }

    async runAllWokflows(){
        let workflow
        try {
            for (let w in this.workflowsQueue) {
                workflow = this.workflowsQueue[w]
                await this.runWorkflow(workflow)
            }
        }catch(e){
            log("Got error during workflows execution: %o", e)
        }
    }
}

module.exports = WorkflowManager