'use strict'

const log = require('debug')('vfuse:workflowManager')
const Runtime = require('./runtime')
const Workflow = require('./workflow')
const Job = require('./job')
const Constants = require('../constants')
/*
WorkflowManager is responsible for job management and execution
 */
class WorkflowManager{
    /**
     * @param {Object} network
     * @param {Object} options
     */
    constructor(network, profile, options){
        try {
            this.net = network
            this.profile = profile
            this.runtime = new Runtime(options.worker, options.packages)
            this.workflowsQueue = []
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    async start(){
        await this.runtime.init()
        await this.runtime.load()

        this.net.registerTopicListener(this.topicListener)
        this.publishJobs()
    }

    topicListener(data){
        console.log(data)
    }

    publishJobs(){
        setInterval(async function(){
            let jobsToPublish = []
            for (let w in this.profile.workflows) {
                for (let j in this.profile.workflows[w].jobs) {
                    jobsToPublish.push(this.profile.workflows[w].jobs[j])
                }
            }
            if(jobsToPublish.length > 0)
               await this.net.send(jobsToPublish)
        }.bind(this), 5000)
    }

    getWorkflows(){
        //get workflow from global IPFS queue
    }

    addWorkflow(workflow){

    }

   /* removeJob(job){
        let index = this.jobsQueue.indexOf(job);
        if (index > -1) {
            this.jobsQueue.splice(index, 1);
        }
    }*/

    async updateResults(workflowId, JobId, results){

    }

    async runJob(job){
        try {
            await this.runtime.run(job)
            job.status = Constants.JOB_SATUS.COMPLETED//Job.SATUS.COMPLETED
            //Communicate the job end to the network
        }catch(e){
            log("Got error during job execution: %o", e)
        }
    }

    async runWorkflow(workflowId){
        let workflow = this.profile.getWorkflow(workflowId)
        try {
            workflow.status = Constants.WORKFLOW_STATUS.RUNNING//Workflow.STATUS.RUNNING
            for (let j in workflow.jobs) {
               await this.runJob(workflow.jobs[j])
            }
            workflow.status = Constants.WORKFLOW_STATUS.COMPLETED//Workflow.STATUS.COMPLETED
            //Communicate the workflow end to the network
        }catch(e){
            workflow.status = Constants.WORKFLOW_STATUS.IDLE//Workflow.STATUS.IDLE
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

    async createWorkflow(){
        try{
           /* let workflow = new Workflow()
            await this.profile.createWorkflow(workflow, [])
            return workflow.id*/

            //todo find a strategy to get a new workflow id
            let dir = this.profile.workflows.length
            await this.net.makeDir('/workflows/' + dir, { parents : true, mode: "655" })
            await this.net.makeDir('/workflows/' + dir + '/results', { parents : true, mode: "655" })
            await this.net.makeDir('/workflows/' + dir + '/jobs', { parents : true, mode: "655" })
            let workflow_dir = await this.net.stat('/workflows/' + dir)
            let results_dir = await this.net.stat('/workflows/' + dir + '/results')
            let jobs_dir = await this.net.stat('/workflows/' + dir + '/jobs')
            let workflow = new Workflow(workflow_dir, results_dir, jobs_dir)
            await this.profile.addWorkflow(workflow)
            console.log({workflow_dir})
            console.log({results_dir})
            console.log({jobs_dir})
            return workflow.id
        }catch (e){
            log('Got some error during the workflow creation: %O', e)
        }
    }

    async getJobs(workflow){
        let jobs = await this.net.ls(workflow)
        console.log(jobs)
    }

    async addJob(workflow, code, data, dependencies){
        try{
            let job = new Job(
                null,
                code,
                data,
                dependencies
            )

            let jobs = await this.net.list('/ipfs/' + workflow.id + '/jobs')
            let job_file = await this.net.writeFile('/ipfs/' + workflow.id + '/jobs/' + jobs.length + '.json', JSON.stringify(job), {create : true, mode: '655'})
            /*let job_file = await this.net.add({
                path: '/ipfs/' + workflow.id + '/jobs/' + jobs.length + '.json',
                content: JSON.stringify(job)
            })*/
            console.log({job_file})
            //await this.profile.addJob(workflow, job)
            console.log('Job successfully added to workflow')
        }catch (e){
            console.log('Got some error during the workflow creation: %O', e)
        }
    }
}

module.exports = WorkflowManager