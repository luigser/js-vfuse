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
            this.eventManager.addListener('circuit_enabled', async function(){await this.start()}.bind(this))

            this.currentWorkflow = null
            this.workflows = []
            this.publishedWorkflows = []

            this.eventManager.addListener('profile.ready', async function(){await this.getWorkflows()}.bind(this))


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
            //this.publishJobs()
        }catch (e) {
            console.log('Error during workflow manager starting: %O', e)
        }
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
        return this.publishedWorkflows
    }

    getWorkflow(workflowId){
        try {
            let workflow = this.workflows.filter(w => w.id === workflowId)
            if (workflow && workflow.length === 1) {
                this.currentWorkflow = workflow[0]
                return workflow[0]
            }
            else
                throw 'Selected workflow do not exists'
        }catch (e){
            console.log('Got some error during workflow retrieving : %O', e)
            return null
        }
    }

    getCurrentWorkflows(){
        return this.workflows
    }

    async getWorkflows(){
        try{
            let workflows = await this.contentManager.list('/workflows')
            for (let w in workflows){
                let workflow = await this.contentManager.get('/workflows/' + workflows[w])
                if(workflow) {
                    workflow = JSON.parse(workflow)
                    this.workflows.push(workflow)
                }
            }
            this.eventManager.emit('VFuse.ready', { status : true, workflows : this.workflows, profile : this.identityManager.getCurrentProfile() })
        }catch(e){
            this.eventManager.emit('VFuse.ready', { status : false, error : e})
            console.log('Error getting workflows from MFS : %O, e')
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
            let workflow = this.getWorkflow(id)
            if(workflow){
                    workflow.name = name
                    workflow.code = code
                    workflow.language = language
            }else {
                //todo find a strategy to get a new workflow id
                let workflow_id = await PeerId.create({bits: 1024, keyType: 'RSA'})
                workflow = new Workflow(workflow_id._idB58String, name, code, language, new JobsDAG())
            }
            let workflow_cid = await this.contentManager.save('/workflows/' + workflow.id + '.json', JSON.stringify(workflow),
                {create : true, parents: true, mode: parseInt('0775', 8), truncate: true, pin : true})
            console.log('Workflow successfully saved: %O', workflow)
            return workflow.id
        }catch (e){
            log('Got some error during the workflow saving: %O', e)
            return null
        }
    }

    async publishWorkflow(workflow_id){
        try{
            this.publishedWorkflows.push(workflow_id)

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
            console.log('Got some error during the profile publishing: %O', e)
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
