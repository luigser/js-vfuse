'use strict'

const PeerId = require('peer-id')
const log = require('debug')('vfuse:workflowManager')
//const Runtime = require('./job/runtime')
const RuntimeManager = require('./runtimeManager')
const Workflow = require('./job/workflow')
const Job = require('./job/job')
const Constants = require('./constants')
/*
WorkflowManager is responsible for job management and execution
 */
class WorkflowManager{
    /**
     * @param {Object} networkmanager
     * @param {Object} options
     */
    constructor(networkManager, identityManager, options){
        try {
            this.networkManager = networkManager
            this.identityManager = identityManager
            this.runtimeManager = options.runtime ? new RuntimeManager(options.runtime) : null
            this.workflowsQueue = []
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    async start(){
        try {
            if (this.runtimeManager) {
                await this.runtimeManager.start()
            }

            this.networkManager.registerTopicListener(this.topicListener)
            this.publishJobs()
        }catch (e) {
            console.log('Error during workflow manager starting: %O', e)
        }
    }

    topicListener(data){
        //console.log(data)
    }

    publishJobs(){
        setInterval(async function(){
            let jobsToPublish = []
            for (let w in this.identityManager.workflows) {
                for (let j in this.identityManager.workflows[w].jobs) {
                    jobsToPublish.push(this.identityManager.workflows[w].jobs[j])
                }
            }
            if(jobsToPublish.length > 0)
               await this.networkManager.send(jobsToPublish)
        }.bind(this), 5000)
    }

    async getPublishedWorkflows(){
        //get workflow from global IPFS queue
        return await this.networkManager.list("/workflows")
    }

    async updateResults(workflowId, JobId, results){

    }

    async runJob(job){
        try {
            await this.runtimeManager.run(job)
            job.status = Constants.JOB_SATUS.COMPLETED//Job.SATUS.COMPLETED
            //Communicate the job end to the network
        }catch(e){
            log("Got error during job execution: %o", e)
        }
    }

    async runWorkflow(workflowId){
        let workflow = this.identityManager.getWorkflow(workflowId)
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

    async createWorkflow(name){
        try{
            //todo find a strategy to get a new workflow id
            let workflow_id = await PeerId.create({ bits: 1024, keyType: 'RSA' })
            let workflow = new Workflow(workflow_id._idB58String, name)
            await this.identityManager.addWorkflow(workflow)
            console.log('Workflow sucessfully created: %O', workflow)
            return workflow_id._idB58String
        }catch (e){
            log('Got some error during the workflow creation: %O', e)
        }
    }

    async updateWorkflow(workflow){
        try{

        }catch (e){
            log('Got some error during the workflow updating: %O', e)
        }
    }

    async publishWorkflow(workflow_id){
        //todo check if workflow exist in the profile
        try{

            let workflow = this.identityManager.getWorkflow(workflow_id)
            if(workflow){
                let workflow_dir = '/workflows/' + workflow.id
                await this.networkManager.makeDir(workflow_dir, { create:true, parents : true, mode: "777" })
                await this.networkManager.makeDir(workflow_dir + '/results', { create:true, parents : true, mode: "777" })
                await this.networkManager.makeDir(workflow_dir + '/jobs', { create:true, parents : true, mode: "775" })
                await this.networkManager.writeFile(workflow_dir + '/' + workflow.id + '.json', new TextEncoder().encode(JSON.stringify(workflow)),
                    {create : true, parents: true, mode: parseInt('0775', 8)})
                await this.networkManager.pinFileInMFS(workflow_dir + '/' + workflow.id + '.json')

                workflow.jobs.map(async job => {
                    await this.networkManager.writeFile(workflow_dir + '/jobs/' + job.id + '.json', new TextEncoder().encode(JSON.stringify(job)),
                        {create : true, parents: true, mode: parseInt('0775', 8)})
                    await this.networkManager.pinFileInMFS(workflow_dir + '/jobs/' + job.id + '.json')
                })
                console.log('Workflow successfully published')
            }else{
                throw 'Workflow ID do no exist. You need to save in your profile before publish it!'
            }
            return workflow
        }catch (e){
            log('Got some error during the workflow publishing: %O', e)
            return null
        }
    }

    async addJob(workflow_id, code, data, dependencies){
        try{
            let job_id = await PeerId.create({ bits: 1024, keyType: 'RSA' })
            let job = new Job(
                job_id._idB58String,
                code,
                data,
                dependencies
            )
            await this.identityManager.addJob(workflow_id, job)
            console.log('Job successfully added to workflow')
        }catch (e){
            console.log('Got some error during the workflow creation: %O', e)
        }
    }

    async getJobs(workflow){
        let jobs = await this.networkManager.ls(workflow)
        console.log(jobs)
    }
}

module.exports = WorkflowManager
