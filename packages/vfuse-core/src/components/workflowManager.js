'use strict'

const {isBrowser} = require( "browser-or-node")

const PeerId = require('peer-id')
const log = require('debug')('vfuse:workflowManager')
const RuntimeManager = require('./runtimeManager')
const Workflow = require('./job/workflow')
const Job = require('./job/job')
const {JobsDAG} = require('./job/JobsDAG')
const Constants = require('./constants')
const Miscellaneous = require('../utils/miscellaneous')

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
            //todo MANAGE IT
            //this.eventManager.addListener('circuit_enabled', async function(){await this.start()}.bind(this))

            this.currentWorkflow = null
            this.workflows = []
            this.publishedWorkflows = []

            this.results = []
            this.workflowsQueue = []
            this.jobsExecutionQueue =  []

            this.updateWorkflowCallback = null

            this.eventManager.addListener('profile.ready', async function(){await this.startWorkspace()}.bind(this))

            if(isBrowser) {
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST, async function (data) {
                    await this.handleRequestExecutionWorkflow(data)
                }.bind(this))
                /*this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.UNPUBLISH, async function (data) {
                    await this.handleWorflowsUnpublishing(data)
                }.bind(this))*/
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE, async function (data) {
                    await this.manageResults(data)
                }.bind(this))
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED, async function (data) {
                    await this.dropWorkflows(data)
                }.bind(this))
                /*
                this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST, async function (data) {
                    await this.executeJob(data)
                }.bind(this))
                */
            }
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    registerCallback(updateWorkflowCallback){
        this.updateWorkflowCallback = updateWorkflowCallback
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
            this.publishedWorkflows = this.identityManager.publishedWorkflows
            //Get workflows
            let workflows = await this.contentManager.list('/workflows/private')
            for (let w in workflows){
                let workflow = await this.contentManager.get('/workflows/private/' + workflows[w])
                if(workflow) {
                    workflow = JSON.parse(workflow)
                    workflow.published = this.publishedWorkflows.filter(wf => wf.id === workflow.id).length === 1
                    this.workflows.push(workflow)
                }
            }
            //Start publish on topic
            if(isBrowser) {//TODO implement nodejs worker
                this.executionCycle()
                this.publishWorkflows()
                this.publishResults()
            }

            this.eventManager.emit('VFuse.ready', { status : true, workflows : this.workflows, profile : this.identityManager.getCurrentProfile() })
        }catch(e){
            this.eventManager.emit('VFuse.ready', { status : false, error : e})
            console.log('Error getting workflows from MFS : %O, e')
        }
    }

    executionCycle(){
        setInterval(async function(){
            await this.manageWorkflowsExecution()
        }.bind(this), Constants.TIMEOUTS.EXECUTION_CYCLE)
    }

    publishWorkflows(){
        try{
            setInterval(async function(){
                let published_workflows = await this.contentManager.list('/workflows/published')
                for(let workflow of published_workflows) {
                    let encoded_workflow = await this.contentManager.get('/workflows/published/' + workflow)
                    let decoded_workflow = JSON.parse(encoded_workflow)
                    await this.contentManager.sendOnTopic({
                        action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST,
                        payload: decoded_workflow
                    })
                }

                /*let unpublished_workflows = await this.contentManager.list('/workflows/unpublished')
                if (unpublished_workflows){
                    await this.contentManager.sendOnTopic({
                        action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.UNPUBLISH,
                        payload: {
                            wids: unpublished_workflows,
                        }
                    })
                }*/
            }.bind(this), Constants.TIMEOUTS.WORKFLOWS_PUBLISHING)
        }catch(e){
            console.log('Error during workflows publishing : %O', e)
        }
    }

    publishResults(){
        try{
            setInterval(async function(){
                try {
                    let running_workflows = await this.contentManager.list('/workflows/running')
                    for (let w in running_workflows){
                        let workflow = await this.contentManager.get('/workflows/running/' + running_workflows[w])
                        if(workflow) {
                            workflow = JSON.parse(workflow)
                            let nodes_to_publish = workflow.jobsDAG.nodes.filter(n => n.job && (n.job.status !== Constants.JOB_SATUS.WAITING))
                            //let nodes_to_publish_chunks = Miscellaneous.arrayChunks(nodes_to_publish)
                            for(let node of nodes_to_publish) {
                                await this.contentManager.sendOnTopic({
                                    action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE,
                                    payload: {
                                        wid: workflow.id,
                                        nodes: [node]
                                    }
                                })
                            }

                        }
                    }
                    let completed_workflows = await this.contentManager.list('/workflows/completed')
                    if (completed_workflows.length > 0){
                        await this.contentManager.sendOnTopic({
                            action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED,
                            payload: {
                                wids: completed_workflows,
                            }
                        })
                    }
                }catch (e) {}
            }.bind(this), Constants.TIMEOUTS.RESULTS_PUBLISHING)
        }catch (e) {
            if(e.message !== 'file does not exist')
               console.log('Got error during results publishing : %O', e)
        }
    }

    async handleWorflowsUnpublishing(data){
        try{
            if(!data.wids) return
            for(let wid of data.wids)
                await this.contentManager.delete('/workflows/published/' + wid + '.json')
        }catch (e) {

        }
    }

    async updatePublishedWorkflowFiles(data){
        await this.contentManager.save('/workflows/published/' + data.workflow_id + '.json', JSON.stringify(data))
        let encoded_workflow = await this.contentManager.getFromNetwork(data.cid)
        await this.contentManager.save('/workflows/running/' + data.workflow_id + '.json', encoded_workflow)
    }

    async handleRequestExecutionWorkflow(data){
        try{
            if(!data.workflow_id && !data.cid) return
            //avoid the execution of private workflow
            if(this.getWorkflow(data.workflow_id)) return
            //check if received workflow is already in published dir
            let published_workflow = await this.contentManager.get('/workflows/published/' + data.workflow_id + '.json')
            if(!published_workflow) {
                await this.updatePublishedWorkflowFiles(data)
            }else{
                let decoded = JSON.parse(published_workflow)
                if(decoded.cid !== data.cid) await this.updatePublishedWorkflowFiles(data)
            }
        }catch (e) {
            console.log('Error during workflow execution : %O', e)
        }
    }

    async manageWorkflowsExecution(){
        try {
            if(this.jobsExecutionQueue.length === Constants.LIMITS.MAX_CONCURRENT_JOBS) return
            let running_workflows = await this.contentManager.list('/workflows/running')
            let workflow_to_run_index = Math.floor(Math.random() * running_workflows.length)
            let encoded_workflow = await this.contentManager.get('/workflows/running/' + running_workflows[workflow_to_run_index])
            if(!encoded_workflow) return
            let workflow = JSON.parse(encoded_workflow)
            let nodes = JobsDAG.getReadyNodes(workflow.jobsDAG)
            //Maybe is better to select a bundle of jobs
            let node_index = Math.floor(Math.random() * nodes.length)
            let node = nodes[node_index]
            if (node && node.job) {//do not consider the root
                let results = await this.runJob(workflow.id, node.job)
                if(results){
                    JobsDAG.setNodeState(workflow.jobsDAG, node, Constants.JOB_SATUS.COMPLETED, {results : results})
                    await this.contentManager.save('/workflows/running/' + workflow.id + '.json', JSON.stringify(workflow))
                }
            }
        }catch (e) {
            console.log('Got error during workflows execution : %O', e)
        }
    }

    async runJob(wid, job) {
        try {
            let execution_results = null
            let node_execution = this.jobsExecutionQueue.filter(r => r === job.id)
            let node_results = this.results.filter(r => r.job_id === job.id)
            if (node_execution.length === 0 && node_results.length === 0) { //TODO manage results replication
                this.jobsExecutionQueue.push(job.id)
                execution_results = await this.runtimeManager.runJob(job)
                this.jobsExecutionQueue.splice(this.jobsExecutionQueue.indexOf(job.id), 1);
            }
            return execution_results
        }catch (e) {
            console.log('Got error executing job : %O', e)
        }
    }

    async manageResults(data){
        try{
            if(!data.wid && !data.nodes) return
            //return if the received job is currently running
            //here we can check the job results to ensure that the results are correct
            let workflow = this.getWorkflow(data.wid)
            if(workflow) {
                let completed_nodes = workflow.jobsDAG.nodes.filter(n => n.job && (n.job.status === Constants.JOB_SATUS.COMPLETED || n.job.status === Constants.JOB_SATUS.ERROR))
                if(completed_nodes.length === workflow.jobsDAG.nodes.length){//do not consider the root node
                    await this.contentManager.save('/workflows/completed/' + workflow.id, "completed")
                    return
                }else{
                    for(let result_node of data.nodes){
                        let local_job_node = workflow.jobsDAG.nodes.filter(nd => nd.id === result_node.id)[0]
                        if( local_job_node.job.status !== Constants.JOB_SATUS.COMPLETED ||
                            (local_job_node.job.status === Constants.JOB_SATUS.WAITING && result_node.job.status === Constants.JOB_SATUS.READY)){
                            local_job_node.color = result_node.color
                            local_job_node.job = result_node.job
                        }
                    }
                }
                await this.updateWorkflow(workflow)
                if(this.updateWorkflowCallback && this.currentWorkflow.id === data.wid) this.updateWorkflowCallback(workflow)

            }

            let running_workflow = await this.contentManager.get('/workflows/running/' + data.wid + '.json')
            if(running_workflow){
                running_workflow = JSON.parse(running_workflow)
                for(let result_node of data.nodes){
                    let local_job_node = running_workflow.jobsDAG.nodes.filter(nd => nd.id === result_node.id)[0]
                    if (this.jobsExecutionQueue.indexOf(result_node.job.id) < 0 &&
                        (local_job_node.job.status !== Constants.JOB_SATUS.COMPLETED ||
                        (local_job_node.job.status === Constants.JOB_SATUS.WAITING && result_node.job.status === Constants.JOB_SATUS.READY))){
                        local_job_node.color = result_node.color
                        local_job_node.job = result_node.job
                    }
                }
                await this.contentManager.save('/workflows/running/' + data.wid + '.json', JSON.stringify(running_workflow))
            }
        }catch (e) {
            //console.log('Error during results management : %O', e)
        }
    }

    async dropWorkflows(data){
        try{
            if(!data.wids) return
            for(let wid of data.wids) {
                await this.contentManager.delete('/workflows/running/' + wid + '.json')
                await this.contentManager.delete('/workflows/published/' + wid + '.json')
                //await this.contentManager.delete('/workflows/unpublished/' + wid + '.json')
                await this.contentManager.delete('/workflows/completed/' + wid)
            }
        }catch (e) {
            //console.log('Error during dropping results : %O', e)
        }
    }

    async getPublishedWorkflows(){
        //get workflow from global IPFS queue
        return this.identityManager.publishedWorkflows
    }

    getWorkflow(workflowId){
        try {
            let workflow = this.workflows.filter(w => w.id === workflowId)
            if (workflow.length === 1) {
                workflow = workflow[0]
                workflow.published = this.publishedWorkflows.filter(w => w.id === workflowId).length === 1
                this.currentWorkflow = workflow
            }else{
                workflow = null
            }
            return workflow
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
            let result = await this.runtimeManager.runLocalCode(workflow.code, workflow.language)
            return !result ? {workflow : this.currentWorkflow} : result
        }catch (e){
            console.log('Got some error during the workflow execution: %O', e)
            return {error : e}
        }
    }

    async testWorkflow(code, language){
        try{
            let workflow_id = await PeerId.create({bits: 1024, keyType: 'RSA'})
            let workflow = new Workflow(workflow_id._idB58String, 'Test Locally', code, language, new JobsDAG())
            let result = await this.checkWorkflow(workflow)
            if(!result.error){
                workflow = this.currentWorkflow
                workflow.jobsDAG = workflow.jobsDAG.toJSON()
                let error = false
                let nodes = JobsDAG.getReadyNodes(workflow.jobsDAG)
                while(nodes.length > 0) {
                    for (let node of nodes) {
                        let results = await this.runJob(workflow.id, node.job)
                        if (results) {
                            JobsDAG.setNodeState(workflow.jobsDAG, node, Constants.JOB_SATUS.COMPLETED, {results: results})
                        }
                    }
                    nodes = JobsDAG.getReadyNodes(workflow.jobsDAG)
                }
                return workflow
            }else{
                return { error : result.error}
            }
        }catch (e) {
            console.log('Got some error during the workflow execution: %O', e)
            return {error : e}
        }

    }

    async updatePublishedWorkflow(workflow){
        try{
            let workflow_cid = await this.contentManager.save('/workflows/' + workflow.id + '.json', JSON.stringify(workflow), {pin : true})
            await this.identityManager.saveWorkflow(workflow.id, workflow_cid.toString())
            await this.publishWorkflows(workflow.id)
        }catch (e) {
            console.log('Error during workflow updating : %O', e)
        }
    }

    async saveWorkflow(id, name, code, language){
        try{
            let isNew = false
            let workflow = this.workflows.filter(w => w.id === id)
            workflow = workflow.length === 1 ? workflow[0] : null
            if(workflow){
                    workflow.name = name
                    workflow.code = code
                    workflow.language = language
            }else {
                //todo find a strategy to get a new workflow id
                let workflow_id = await PeerId.create({bits: 1024, keyType: 'RSA'})
                workflow = new Workflow(workflow_id._idB58String, name, code, language, new JobsDAG())
                isNew = true
            }
            let execution_result = await this.checkWorkflow(workflow)
            if(execution_result.error){
                return execution_result
            }else{
                if(isNew) this.workflows.push(workflow)
            }
            workflow.jobsDAG = this.currentWorkflow.jobsDAG.toJSON ? this.currentWorkflow.jobsDAG.toJSON() : this.currentWorkflow.jobsDAG
            let workflow_cid = await this.contentManager.save('/workflows/private/' + workflow.id + '.json', JSON.stringify(workflow), {pin : true})
            await this.contentManager.delete('/workflows/completed/' + workflow.id)
            //todo
            //the CID depends on if a pin cluster (first case) or regular net(second case) is used
            await this.identityManager.saveWorkflow(workflow.id, workflow_cid)
            console.log('Workflow successfully saved: %O', workflow)
            return workflow
        }catch (e){
            console.log('Got some error during the workflow saving: %O', e)
            return null
        }
    }

    async updateWorkflow(workflow){
        try{
            let workflow_cid = await this.contentManager.save('/workflows/private/' + workflow.id + '.json', JSON.stringify(workflow), {pin : true})
            await this.identityManager.saveWorkflow(workflow.id, workflow_cid.toString())
        }catch (e) {
            log('Got some error during the workflow updating: %O', e)
        }
    }

    async deleteWorkflow(workflow_id){
        try{
            await this.contentManager.delete('/workflows/private/'  + workflow_id + '.json')
            await this.identityManager.deleteWorkflow(workflow_id)
            this.workflows.splice(this.workflows.indexOf(this.getWorkflow(workflow_id)), 1);
            //TODO UNPINNING
            let filtered = this.publishedWorkflows.filter(pw => pw.id === workflow_id)
            if(filtered.length === 0) await this.unpublishWorkflow(filtered[0])
            await this.contentManager.save('/workflows/completed/' + workflow_id, "completed")
            console.log('Workflow successfully removed')
            return true
        }catch (e){
            log('Got some error during the workflow saving: %O', e)
            return { error : e}
        }
    }

    async publishWorkflow(workflow_id){
        try{
            //let new_key = await this.contentManager.getKey(workflow_id)
            let cid = this.identityManager.getWorkflowCid(workflow_id)
            if(!cid)
                return {error : 'The current workflow is not saved in your private space'}
            let name //= await this.contentManager.publish(cid, new_key.name)//todo resolve
            await this.contentManager.save('/workflows/published/' + workflow_id + '.json', JSON.stringify({workflow_id : workflow_id, cid : cid}), {pin : true})
            await this.contentManager.delete('/workflows/completed/' + workflow_id)
            await this.identityManager.updatePublishedWorkflow(workflow_id, name, cid)
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
                await this.contentManager.delete('/workflows/published/'  + workflow_id + '.json')
                await this.identityManager.unpublishWorkflow(filtered[0])
                this.publishedWorkflows = this.identityManager.publishedWorkflows
                await this.contentManager.save('/workflows/completed/' + workflow_id, "completed")
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

    async getDataFromUrl(url, start, end, type){
        try{
            return await this.contentManager.getDataFromUrl(url, start, end, type)
        }catch (e) {}
    }

    async addJob(name, code, dependencies, data, group, packages){
        try{
            let job_id = await PeerId.create({ bits: 1024, keyType: 'RSA' })
            let job = new Job(
                job_id._idB58String,
                name,
                code,
                data,
                dependencies,
                group,
                this.currentWorkflow.language,
                packages
            )

            let new_vertex = this.currentWorkflow.jobsDAG.addJob(job)
            return new_vertex ? job : null
        }catch (e){
            console.log('Got some error during the workflow creation: %O', e)
            return null
        }
    }

    async saveOnNetwork(data){
        try{
            return await this.contentManager.saveOnIpfs(JSON.stringify(data))
        }catch (e) {
            console.log('Got error during saving on network : %O', e)
            return e
        }
    }
}

module.exports = WorkflowManager
