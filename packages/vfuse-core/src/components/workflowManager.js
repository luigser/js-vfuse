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
            if(isBrowser) {//TODO implement nodejs worker
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST, async function (data) {
                    await this.executeWorkflow(data)
                }.bind(this))
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST, async function (data) {
                    await this.executeJob(data)
                }.bind(this))
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE, async function (data) {
                    await this.manageResults(data)
                }.bind(this))
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED, async function (data) {
                    await this.dropResults(data)
                }.bind(this))
            }
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
                        if(!node.job || node.job.status !== Constants.JOB_SATUS.READY) continue
                        await this.contentManager.sendOnTopic({
                            action : Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST,
                            payload : { workflow_id : workflow.id, job : node.job }
                        })
                    }
                }
            }.bind(this), Constants.TIMEOUTS.JOBS_PUBLISHING)
        }catch(e){
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
                try {
                    let results_files = await this.contentManager.list('/results')
                    for (let rf of results_files) {
                        let results = await this.contentManager.get('/results/' + rf)
                        await this.contentManager.sendOnTopic({
                            action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE,
                            payload: JSON.parse(results)
                        })
                    }
                }catch (e) {}
            }.bind(this), Constants.TIMEOUTS.RESULTS_PUBLISHING)
        }catch (e) {
            if(e.message !== 'file does not exist')
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
            if(!data.workflow_id && !data.job_id && !data.cid && !data.results) return
            let workflow = this.getWorkflow(data.workflow_id)
            if(workflow) {
                let job_node = workflow.jobsDAG.nodes.filter(node => node.id === data.job_id)
                if (job_node.length === 1) {
                    if (job_node[0].job.results.length < 1) {//Num of replica for job results, just one for test
                        JobsDAG.setNodeState(workflow.jobsDAG, job_node[0], Constants.JOB_SATUS.COMPLETED, data)
                        await this.updatePublishedWorkflow(workflow)
                    } else {
                        await this.contentManager.sendOnTopic({
                            action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED,
                            payload: {job_id: data.job_id}
                        })
                    }
                }
            }
            //console.log('GOT RESULTS : %O', data)
        }catch (e) {
            console.log('Error during results management : %O', e)
        }
    }

    async dropResults(data){
        try{
            if(!data.job_id) return
            let stat = await this.contentManager.stat('/results/' + data.job_id + '.json')
            if(stat && stat.cid)
                await this.contentManager.delete('/results/' + data.job_id + '.json')
        }catch (e) {
            console.log('Error during dropping results : %O', e)
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
            /*else
                throw 'Selected workflow do not exists'*/
        }catch (e){
            //console.log('Got some error during workflow retrieving : %O', e)
            return null
        }
    }

    getCurrentWorkflows(){
        return this.workflows
    }

    async checkWorkflow(workflow){
        try{
            this.currentWorkflow = workflow
            this.currentWorkflow.jobsDAG = new JobsDAG()
            let result = await this.runtimeManager.runLocalCode(workflow.code)
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
            let execution_result = await this.checkWorkflow(workflow)
            if(execution_result.error) return execution_result
            workflow.jobsDAG = this.currentWorkflow.jobsDAG.toJSON()
            let workflow_cid = await this.contentManager.save('/workflows/' + workflow.id + '.json', JSON.stringify(workflow),
                {create : true, parents: true, mode: parseInt('0775', 8), truncate: true, pin : true})
            //todo
            await this.identityManager.saveWorkflow(workflow.id, workflow_cid.toString())
            console.log('Workflow successfully saved: %O', workflow)
            return workflow
        }catch (e){
            log('Got some error during the workflow saving: %O', e)
            return null
        }
    }

    async deleteWorkflow(workflow_id){
        try{
            await this.contentManager.delete('/workflows/'  + workflow_id + '.json')
            await this.identityManager.deleteWorkflow(workflow_id)
            this.workflows.splice(this.workflows.indexOf(this.getWorkflow(workflow_id)), 1);
            //TODO UNPINNING
            let filtered = this.publishedWorkflows.filter(pw => pw.id === workflow_id)
            if(filtered.length === 0) await this.unpublishWorkflow(filtered[0])
            console.log('Workflow successfully removed: %O')
            return true
        }catch (e){
            log('Got some error during the workflow saving: %O', e)
            return { error : e}
        }
    }

    async publishWorkflow(workflow_id){
        try{
            let new_key = await this.contentManager.getKey(workflow_id)
            let cid = this.identityManager.getWorkflowCid(workflow_id)
            let name = await this.contentManager.publish(cid, new_key.name)//todo resolve
            await this.identityManager.addPublishedWorkflow(workflow_id, name, cid)
            this.publishedWorkflows = this.identityManager.publishedWorkflows
            console.log('Workflow successfully published: %s', name)
            return true
        }catch (e){
            console.log('Got some error during the profile publishing: %O', e)
            return { error : e}
        }
    }

    async unpublishWorkflow(workflow_id){
        try{
            let filtered = this.publishedWorkflows.filter(pw => pw.id === workflow_id)
            if(filtered.length === 1) {
                await this.identityManager.unpublishWorkflow(filtered[0])
                this.publishedWorkflows = this.identityManager.publishedWorkflows
                console.log('Workflow successfully unpublished')
                return true
            }else{
                return { error : 'There are not published workflows for given ID'}
            }
        }catch (e){
            console.log('Got some error during the profile publishing: %O', e)
            return { error : e}
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
}

module.exports = WorkflowManager
