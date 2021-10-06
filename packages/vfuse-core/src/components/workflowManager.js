'use strict'

const PeerId = require('peer-id')
const log = require('debug')('vfuse:workflowManager')
const RuntimeManager = require('./runtimeManager')
const Workflow = require('./job/workflow')
const Job = require('./job/job')
const {JobsDAG, JobsDAGVertex} = require('./job/JobsDAG')
const Constants = require('./constants')

/*
WorkflowManager is responsible for job management and execution
 */
class WorkflowManager{
    /**
     * @param {Object} networkmanager
     * @param {Object} options
     */
    constructor(contentManager, identityManager, options){
        try {
            this.contentManager = contentManager
            this.identityManager = identityManager
            this.runtimeManager = new RuntimeManager(options.runtime, this)
            this.workflowsQueue = []
            this.currentWorkflow = null
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

    async getWorkflow(id){
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
            let result = null
            /*let workflow = this.identityManager.getWorkflow(id)
            if(workflow){*/
                result = await this.runtimeManager.runLocalCode(code)
            //}
            return result
        }catch (e){
            console.log('Got some error during the workflow creation: %O', e)
            return null
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

    async publishWorkflow(workflow_id){
        //todo check if workflow exist in the profile
        try{

            let workflow = this.identityManager.getWorkflow(workflow_id)
            if(workflow){
                let workflow_dir = '/workflows/' + workflow.id
                //await this.contentManager.makeDir(workflow_dir, { create:true, parents : true, mode: "777" })
                //await this.contentManager.makeDir(workflow_dir + '/results', { create:true, parents : true, mode: "777" })
                //await this.contentManager.makeDir(workflow_dir + '/jobs', { create:true, parents : true, mode: "775" })
                //await this.contentManager.writeFile(workflow_dir + '/' + workflow.id + '.json', new TextEncoder().encode(JSON.stringify(workflow)),
                //    {create : true, parents: true, mode: parseInt('0775', 8)})
                //await this.contentManager.pinFileInMFS(workflow_dir + '/' + workflow.id + '.json')

                workflow.jobs.map(async job => {
                    await this.contentManager.save(workflow_dir + '/jobs/' + job.id + '.json', new TextEncoder().encode(JSON.stringify(job)),
                        {create : true, parents: true, mode: parseInt('0775', 8), pin:true})
                })
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

    /*async getJobs(workflow){
        let jobs = await this.contentManager.ls(workflow)
        console.log(jobs)
    }*/
}

module.exports = WorkflowManager
