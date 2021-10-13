'use strict'

const PeerId = require('peer-id')
const log = require('debug')('vfuse:workflowManager')
const RuntimeManager = require('./runtimeManager')
const Workflow = require('./job/workflow')
const Job = require('./job/job')
const {JobsDAG} = require('./job/JobsDAG')
const Constants = require('./constants')

/*
WorkflowManager is responsible for job management and execution
 */
class WorkflowManager{
    /**
     * @param {Object} networkmanager
     * @param {Object} options
     */
    constructor(contentManager, identityManager, eventManager, options){
        try {
            this.contentManager = contentManager
            this.identityManager = identityManager
            this.eventManager = eventManager
            this.runtimeManager = new RuntimeManager(options.runtime, this)
            this.workflowsQueue = []
            this.currentWorkflow = null
            this.eventManager.addListener('circuit_enabled', async function(){await this.start()}.bind(this))
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    async start(){
        try {
            if (this.runtimeManager) {
                await this.runtimeManager.start()
            }

            //this.networkManager.registerTopicListener(this.topicListener)
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
            /*if(jobsToPublish.length > 0)
               await this.networkManager.send(jobsToPublish)*/
        }.bind(this), 5000)
    }

    async getPublishedWorkflows(){
        //get workflow from global IPFS queue
        return await this.contentManager.list("/workflows")
    }

    getWorkflow(id){
        try {
            this.currentWorkflow = this.identityManager.getWorkflow(id)
            return this.currentWorkflow
        }catch(e){
            console.log('Got some error retrieving the workflow : %O', e)
            return null
        }
    }

    async runLocalWorkflowCode(code){
        try{
            this.currentWorkflow.jobsDAG = new JobsDAG()
            await this.runtimeManager.runLocalCode(code)
            return {workflow : this.currentWorkflow}
        }catch (e){
            console.log('Got some error during the workflow execution: %O', e)
            return {error : e}
        }
    }

    async saveWorkflow(id, name, code, language){
        try{
            let workflow = this.identityManager.getWorkflow(id)
            if(workflow){
                await this.identityManager.updateWorkflow(id, name, code, language)
            }else {
                //todo find a strategy to get a new workflow id
                let workflow_id = await PeerId.create({bits: 1024, keyType: 'RSA'})
                workflow = new Workflow(workflow_id._idB58String, name, code, language, new JobsDAG())
                await this.identityManager.addWorkflow(workflow)
                console.log('Workflow successfully created: %O', workflow)
            }
            return workflow.id
        }catch (e){
            log('Got some error during the workflow creation: %O', e)
            return null
        }
    }

    async saveCurrentWorkflow(){
        try{

        }catch (e){
            log('Got some error during the current workflow saving: %O', e)
            return null
        }
    }

    async publishWorkflow(workflow_id){
        //todo check if workflow exist in the profile
        try{

            let workflow = this.identityManager.getWorkflow(workflow_id)
            if(workflow){
                let workflow_dir = '/workflows/' + workflow.id
                await this.contentManager.save(workflow_dir + '/' + workflow.id + '.json', JSON.stringify(workflow))
                /*workflow.jobs.map(async job => {
                    await this.contentManager.save(workflow_dir + '/jobs/' + job.id + '.json', new TextEncoder().encode(JSON.stringify(job)),
                        {create : true, parents: true, mode: parseInt('0775', 8), pin:true})
                })*/
                console.log('Workflow successfully published')
            }else{
                throw 'Workflow ID do no exist. You need to save in your profile before publish it!'
            }
            return workflow
        }catch (e){
            console.log('Got some error during the workflow publishing: %O', e)
            return null
        }
    }

    async addJob(name, code, dependencies, data){
        try{
            let job_id = await PeerId.create({ bits: 1024, keyType: 'RSA' })
            let job = new Job(
                job_id._idB58String,
                name,
                code,
                data,
                dependencies
            )

            let new_vertex = this.currentWorkflow.jobsDAG.addJob(job)
            return new_vertex ? job : null
        }catch (e){
            console.log('Got some error during the workflow creation: %O', e)
            return null
        }
    }

    /*async getJobs(workflow){
        let jobs = await this.contentManager.ls(workflow)
        console.log(jobs)
    }*/
}

module.exports = WorkflowManager
