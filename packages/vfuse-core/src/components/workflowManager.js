'use strict'

const {isBrowser} = require( "browser-or-node")

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

            this.results = []
            this.workflowsQueue = []
            this.executionQueue =  []

            this.eventManager.addListener('profile.ready', async function(){await this.startWorkspace()}.bind(this))
            if(isBrowser)
               this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST, async function(data){await this.executeWorkflow(data)}.bind(this))
               this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST, async function(data){await this.executeJob(data)}.bind(this))
               this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE, async function(data){await this.manageResults(data)}.bind(this))
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    async start(){
        try {
            if (this.runtimeManager) {
                await this.runtimeManager.start()
            }
        }catch (e) {
            console.log('Error during workflow manager starting: %O', e)
        }
    }

    async startWorkspace(){
        try{
            //Get workflows
            let workflows = await this.contentManager.list('/workflows')
            for (let w in workflows){
                let workflow = await this.contentManager.get('/workflows/' + workflows[w])
                if(workflow) {
                    workflow = JSON.parse(workflow)
                    this.workflows.push(workflow)
                }
            }
            //Start publish on topic
            console.log(this.workflows)
            this.publishedWorkflows = this.identityManager.publishedWorkflows
            this.publishJobs()
            //this.publishWorkflows()
            this.publishResults()
            this.eventManager.emit('VFuse.ready', { status : true, workflows : this.workflows, profile : this.identityManager.getCurrentProfile() })
        }catch(e){
            this.eventManager.emit('VFuse.ready', { status : false, error : e})
            console.log('Error getting workflows from MFS : %O, e')
        }
    }

    publishJobs(){
        try{
            setInterval(async function(){
                for(let pwf of this.publishedWorkflows){
                    let workflow = this.getWorkflow(pwf.id)
                    for(let node of workflow.jobsDAG.nodes){
                        if(!node.job || !node.job.status === Constants.JOB_SATUS.READY) continue
                        await this.contentManager.sendOnTopic({
                            action : Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST,
                            payload : { workflow_id : workflow.id, job : node.job }
                        })
                    }
                }
            }.bind(this), Constants.TIMEOUTS.JOBS_PUBLISHING)
        }catch(e){
            if(e.message !== 'file does not exist')
               console.log('Error during workflows publishing : %O', e)
        }
    }

    publishWorkflows(){
        try{
            setInterval(async function(){
                for(let w of this.publishedWorkflows)
                   await this.contentManager.sendOnTopic({action : Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST, payload : {workflow : w} })
            }.bind(this), Constants.TIMEOUTS.WORKFLOWS_PUBLISHING)
        }catch(e){
            console.log('Error during workflows publishing : %O', e)
        }
    }

    publishResults(){
        try{
            setInterval(async function(){
                let results_files = await this.contentManager.list('/results')
                for(let rf of results_files){
                    let results = await this.contentManager.get('/results/' + rf)
                    await this.contentManager.sendOnTopic({action : Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE, payload : JSON.parse(results) })
                }
            }.bind(this), Constants.TIMEOUTS.RESULTS_PUBLISHING)
        }catch (e) {
            console.log('Got error during results publishing : %O', e)
        }
    }

    async runJob(workflow_id, job) {
        try {
            let node_execution = this.executionQueue.filter(r => r === job.id)
            let node_results = this.results.filter(r => r.job_id === job.id)
            if (node_execution.length === 0 && node_results.length === 0) { //TODO manage results replication
                this.executionQueue.push(job.id)
                let execution_results = await this.runtimeManager.runJob(job)
                let results = {
                    workflow_id: workflow_id,
                    job_id: job.id,
                    results: execution_results
                }
                await this.contentManager.save('/results/' + job.id + '.json', JSON.stringify(results),
                    {create: true, parents: true, mode: parseInt('0775', 8), truncate: true})
                this.executionQueue.splice(this.executionQueue.indexOf(job.id), 1);
            }
        }catch (e) {
            console.log('Got error executing job : %O', e)
        }
    }

    async executeWorkflow(data){
        try{
            if(!data.workflow) return
            let workflow = data.workflow
            if(workflow && workflow.cid) {
                let encw = await this.contentManager.getFromNetwork(workflow.cid.toString())
                if (encw) {
                    let decw = JSON.parse(encw)
                    let filterd = this.workflowsQueue.filter(w => w.id === decw.id)
                    if(filterd.length === 0) {
                        this.workflowsQueue.push(decw)
                    }
                }
            }
            await this.manageWorkflowsExecution()
        }catch (e) {
            console.log('Error during workflow execution : %O', e)
        }
    }

    async executeJob(data){
        try{
            if(!data.job && !data.workflow_id) return
            await this.runJob(data.workflow_id, data.job)
        }catch (e) {
            console.log('Error during workflow execution : %O', e)
        }
    }

    async manageWorkflowsExecution(){
        try {
            let workflow_index = Math.floor(Math.random() * this.workflowsQueue.length - 1)
            let workflow = this.workflowsQueue[workflow_index]
            if (workflow) {
                let nodes = JobsDAG.getReadyNodes(workflow.jobsDAG)
                let node_index = Math.floor(Math.random() * nodes.length - 1)
                let node = nodes[node_index]
                if (node && node.job)
                    await this.runJob(workflow.id, node.job)
            }
        }catch (e) {
            console.log('Got error during workflows execution : %O', e)
        }
        console.log('WORKFLOWS EXECUTION RESULTS : %O', this.results)
    }

    async manageResults(data){
        try{
            if(!data.workflow_id && !data.job_id && !data.cid /*&& !data.results*/) return
            let workflow = this.getWorkflow(data.workflow_id)
            let job_node = workflow.jobsDAG.nodes.filter(node => node.id === data.job_id)
            if(job_node.length === 1){
                JobsDAG.setNodeState( workflow.jobsDAG, job_node[0], Constants.JOB_SATUS.COMPLETED, data)
                await this.updatePublishedWorkflow(workflow)
            }
            console.log('GOT RESULTS : %O', data)
        }catch (e) {
            console.log('Error during results management : %O', e)
        }
    }

    async getPublishedWorkflows(){
        //get workflow from global IPFS queue
        return this.identityManager.publishedWorkflows
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

    async checkWorkflow(code){
        try{
            this.currentWorkflow.jobsDAG = new JobsDAG()
            let result = await this.runtimeManager.runLocalCode(code)
            return !result ? {workflow : this.currentWorkflow} : result
        }catch (e){
            console.log('Got some error during the workflow execution: %O', e)
            return {error : e}
        }
    }

    async updatePublishedWorkflow(workflow){
        try{
            let workflow_cid = await this.contentManager.save('/workflows/' + workflow.id + '.json', JSON.stringify(workflow),
                {create : true, parents: true, mode: parseInt('0775', 8), truncate: true, pin : true})
            await this.identityManager.saveWorkflow(workflow.id, workflow_cid.toString())
            await this.publishWorkflows(workflow.id)
        }catch (e) {
            console.log('Error during workflow updating : %O', e)
        }
    }

    async saveWorkflow(id, name, code, language){
        try{
            let execution_result = await this.checkWorkflow(code)
            if(execution_result.error) return execution_result

            let workflow = this.getWorkflow(id)
            if(workflow){
                    workflow.name = name
                    workflow.code = code
                    workflow.language = language
            }else {
                //todo find a strategy to get a new workflow id
                let workflow_id = await PeerId.create({bits: 1024, keyType: 'RSA'})
                workflow = new Workflow(workflow_id._idB58String, name, code, language, new JobsDAG())
                this.workflows.push(workflow)
            }
            workflow.jobsDAG = this.currentWorkflow.jobsDAG.toJSON()
            let workflow_cid = await this.contentManager.save('/workflows/' + workflow.id + '.json', JSON.stringify(workflow),
                {create : true, parents: true, mode: parseInt('0775', 8), truncate: true, pin : true})
            //todo
            await this.identityManager.saveWorkflow(workflow.id, workflow_cid.toString())
            this.currentWorkflow = workflow
            console.log('Workflow successfully saved: %O', workflow)
            return workflow
        }catch (e){
            log('Got some error during the workflow saving: %O', e)
            return null
        }
    }

    async publishWorkflow(workflow_id){
        try{
            //let workflow = this.getWorkflow(workflow_id)
            //if(workflow){
                /*let workflow_file = '/workflows/' + workflow.id + '.json'
                let stat = await this.contentManager.stat(workflow_file)*/
                let new_key = await this.contentManager.getKey(workflow_id)
                let cid = this.identityManager.getWorkflowCid(workflow_id)
                let name = await this.contentManager.publish(cid, new_key.name)//todo resolve
                await this.identityManager.addPublishedWorkflow(workflow_id, name, cid)
                this.publishedWorkflows = this.identityManager.publishedWorkflows
                console.log('Workflow successfully published: %s', name)
            /*}else{
                throw 'Workflow ID do no exist. You need to save in your profile before publish it!'
            }*/

            return true

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
