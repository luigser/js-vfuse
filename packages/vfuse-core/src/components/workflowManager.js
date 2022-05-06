'use strict'

//const {isBrowser} = require( "browser-or-node")

const PeerId = require('peer-id')
const log = require('debug')('vfuse:workflowManager')
const RuntimeManager = require('./runtimeManager')
const Workflow = require('./job/workflow')
const Job = require('./job/job')
const {JobsDAG} = require('./job/JobsDAG')
const Constants = require('./constants')
//const Miscellaneous = require('../utils/miscellaneous')
const MathJs = require('mathjs')
const lodash = require('lodash')
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
            this.runtimeManager = new RuntimeManager(options.workers, this, eventManager)
            //todo MANAGE IT
            //this.eventManager.addListener('circuit_enabled', async function(){await this.start()}.bind(this))

            this.currentWorkflow = null
            this.workflows = []
            this.publishedWorkflows = []

            this.results = []
            this.jobsExecutionQueue =  []
            this.runningWorkflowsQueue = new Map()

            this.executionCycleTimeout = 0
            this.publishResultsTimeout = 0
            this.publishWorkflowsTimeout = 0
            this.maxConcurrentJobs = 0
            this.maxManagedWorkflows = 0

            this.executionCycleInterval = 0
            this.publishResultsInterval = 0
            this.publishWorkflowsInterval = 0

            this.executedJobs = []

            this.eventManager.addListener(Constants.EVENTS.PROFILE_STATUS, async function(){await this.startWorkspace()}.bind(this))
            this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST, this.handleRequestExecutionWorkflow.bind(this))
            this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.SELECTED_RUNNING_WORKFLOW_JOBS,this.runningWorkflowJobsSelection.bind(this))
            this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE,this.manageResults.bind(this))
            this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED,this.dropWorkflows.bind(this))
            /*this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.UNPUBLISH, async function (data) {
              await this.handleWorflowsUnpublishing(data)
             }.bind(this))
            this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE, async function (data) {
                await this.manageResults(data)
            }.bind(this))
            this.eventManager.addListener(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST, async function (data) {
                await this.executeJob(data)
            }.bind(this))
            */
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    async start(){
        try {
            /*if (this.runtimeManager) {
                await this.runtimeManager.start()
            }*/
        }catch (e) {
            console.log('Error during workflow manager starting: %O', e)
        }
    }

    async startWorkspace(){
        try{
            //this.publishedWorkflows = this.identityManager.publishedWorkflows
            let published_workflows = await this.contentManager.list('/workflows/published/my')
            for(let workflow of published_workflows) {
                let decoded_workflow = await this.contentManager.get('/workflows/published/my/' + workflow)
                this.publishedWorkflows.push(decoded_workflow)
            }

            //Get workflows
            let workflows = await this.contentManager.list('/workflows/private')
            for (let w in workflows){
                let workflow = await this.contentManager.get('/workflows/private/' + workflows[w])
                workflow.published = !!this.publishedWorkflows.find(wf => wf.workflow_id === workflow.id)
                this.workflows.push(workflow)

            }
            await this.loadRunningWorkflows()

            this.eventManager.addListener(Constants.EVENTS.PREFERENCES_UPDATED, this.updateTimeoutsAndLimits.bind(this))

            let profile = this.identityManager.getCurrentProfile();
            this.executionCycleTimeout = profile.preferences.TIMEOUTS.EXECUTION_CYCLE * 1000
            this.publishResultsTimeout = profile.preferences.TIMEOUTS.RESULTS_PUBLISHING * 1000
            this.publishWorkflowsTimeout = profile.preferences.TIMEOUTS.WORKFLOWS_PUBLISHING * 1000
            this.maxConcurrentJobs = profile.preferences.LIMITS.MAX_CONCURRENT_JOBS
            this.maxManagedWorkflows = profile.preferences.LIMITS.MAX_MANAGED_WORKFLOWS

            await this.runtimeManager.start(profile.preferences)

            //Start publish on topic
            //this.startExecutionCycle()
            this.executionCycle()
            this.publishWorkflows()
            this.publishResults()
            //TODO fix
            //this.dropExpiredWorkflows()

            this.eventManager.emit(Constants.EVENTS.NODE_STATUS, { status : true, workflows : this.workflows, profile : this.identityManager.getCurrentProfile() })
        }catch(e){
            this.eventManager.emit(Constants.EVENTS.NODE_STATUS, { status : false, error : e})
            console.log('Error getting workflows from MFS : %O, e')
        }
    }

    async loadRunningWorkflows(){
        try {
            let running_workflows = await this.contentManager.list('/workflows/running')
            for (let rw of running_workflows) {
                let workflow = await this.contentManager.get('/workflows/running/' + rw)
                this.runningWorkflowsQueue.set(workflow.id, workflow)
            }
        }catch (e) {
            console.log('Error during loading running workflows : %O', e)
        }
    }

    updateTimeoutsAndLimits(preferences){
        this.executionCycleTimeout = preferences.TIMEOUTS.EXECUTION_CYCLE * 1000
        this.publishResultsTimeout = preferences.TIMEOUTS.RESULTS_PUBLISHING * 1000
        this.publishWorkflowsTimeout = preferences.TIMEOUTS.WORKFLOWS_PUBLISHING * 1000
        this.maxConcurrentJobs = preferences.LIMITS.MAX_CONCURRENT_JOBS

        clearInterval(this.executionCycleInterval)
        clearInterval(this.publishResultsInterval)
        clearInterval(this.publishWorkflowsInterval)

        this.startExecutionCycle()
        this.publishWorkflows()
        this.publishResults()
    }

    dropExpiredWorkflows(){
        setInterval(async function(){
            let workflows_to_drop = []
            let published_workflows = await this.contentManager.list('/workflows/published')
            for(let published_workflow of published_workflows){
                if(published_workflow === 'my') continue
                let workflow = await this.contentManager.get('/workflows/published/' + published_workflow)
                if(workflow.submittedAt > (performance.now() + (3 * 24 * 60 * 60 * 1000))){//2 days
                    workflows_to_drop.push(workflow.wid)
                }
            }
            if(workflows_to_drop.length > 0)
                await this.dropWorkflows({wids : workflows_to_drop})
        }.bind(this),5 * 60 * 1000)

    }

    startExecutionCycle(){
        this.executionCycleInterval = setInterval(async function(){
            await this.manageWorkflowsExecution()
        }.bind(this), this.executionCycleTimeout)
    }

    publishWorkflows(){
        try{
            this.publishWorkflowsInterval = setInterval(async function(){
                let my_published_workflows = await this.contentManager.list('/workflows/published/my')
                for(let workflow of my_published_workflows) {
                    let decoded_workflow = await this.contentManager.get('/workflows/published/my/' + workflow)
                    await this.contentManager.sendOnTopic({
                        action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST,
                        payload: decoded_workflow
                    })
                }

                let published_workflows = await this.contentManager.list('/workflows/published')
                for(let workflow of published_workflows) {
                    if(workflow === 'my') continue
                    let decoded_workflow = await this.contentManager.get('/workflows/published/' + workflow)
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
            }.bind(this), this.publishWorkflowsTimeout)
        }catch(e){
            console.log('Error during workflows publishing : %O', e)
        }
    }

    publishResults(){
        try{
            this.publishResultsInterval = setInterval(async function(){
                try {
                    for (let [wid, workflow] of this.runningWorkflowsQueue.entries()){
                        let nodes_to_publish = JobsDAG.getNodesToUpdate(workflow.jobsDAG)
                        if(nodes_to_publish.length > 0) {
                            await this.contentManager.sendOnTopic({
                                action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE,
                                payload: {
                                    wid: workflow.id,
                                    nodes: nodes_to_publish
                                }
                            })
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
            }.bind(this), this.publishResultsTimeout)
        }catch (e) {
            if(e.message !== 'file does not exist')
                console.log('Got error during results publishing : %O', e)
        }
    }

    async updatePublishedWorkflowFiles(data){
        await this.contentManager.save('/workflows/published/' + data.workflow_id, data)
        let encoded_workflow = await this.contentManager.getFromNetwork(data.cid)
        let workflow = JSON.parse(encoded_workflow)
        if(workflow){
            workflow.remoteSelectedJobs = []
            await this.contentManager.save('/workflows/running/' + data.workflow_id, workflow)
            this.runningWorkflowsQueue.set(workflow.id, workflow)
            this.eventManager.emit(Constants.EVENTS.RUNNING_WORKFLOWS_UPDATE, this.getRunningWorkflows())
            this.executionCycle()
        }
    }

    async handleRequestExecutionWorkflow(data){
        try{
            if(this.runningWorkflowsQueue.size > this.maxManagedWorkflows) return
            let published_workflows = await this.contentManager.list('/workflows/published')
            if(!data.workflow_id && !data.cid || this.getWorkflow(data.workflow_id)) return
            //check if received workflow is already in published dir
            let published_workflow = await this.contentManager.get('/workflows/published/' + data.workflow_id)
            if(!published_workflow) {
                await this.updatePublishedWorkflowFiles(data)
            }else{
                if(published_workflow.cid !== data.cid) await this.updatePublishedWorkflowFiles(data)
            }
        }catch (e) {
            console.log('Error during workflow execution : %O', e)
        }
    }

    async runningWorkflowJobsSelection(data){
        try{
            if(!data.jobs) return
            data.jobs.map(j => {
                let workflow = this.runningWorkflowsQueue.get(j.wid)
                if(workflow)
                   workflow.remoteSelectedJobs = [...workflow.remoteSelectedJobs, ...j]
            })
        }catch (e) {
            console.log('Error during remote running workflow jobs selection : %O', e)
        }
    }

    isAllRunningWorkflowsNodesInExecutionQueue(){
        for(let [wid, w] of this.runningWorkflowsQueue.entries()){
            let readyNodes = JobsDAG.getReadyNodes(w.jobsDAG)
            for(let n of readyNodes){
                if(!n.isInQueue)
                    return false
            }
        }
        return true
    }
    async fillExecutionQueue(){
        if(this.runningWorkflowsQueue.size === 0) return
        let stop = false
        while (this.jobsExecutionQueue.length < this.maxConcurrentJobs && !stop){
            let running_workflows_keys = [ ...this.runningWorkflowsQueue.keys()]
            let workflow_to_run_id = MathJs.pickRandom(running_workflows_keys, running_workflows_keys.map(w => 1 / running_workflows_keys.length))
            //Select randomly a ready node from selected running workflow
            let workflow_to_run = this.runningWorkflowsQueue.get(workflow_to_run_id)
            if(!workflow_to_run) return
            let nodes = JobsDAG.getReadyNodes(workflow_to_run.jobsDAG)
            let node = MathJs.pickRandom(nodes, nodes.map( n => 1 / nodes.length))
            if(!this.jobsExecutionQueue.find(e => e.node.id === node.id) && !workflow_to_run.remoteSelectedJobs.find(j => j.id === node.id)) {
                node.isInQueue = true
                this.jobsExecutionQueue.push({node: node, wid: workflow_to_run.id, running : false, timestamp : Date.now()})
            }
            stop = this.isAllRunningWorkflowsNodesInExecutionQueue()
        }
        await this.contentManager.sendOnTopic({
            action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.SELECTED_RUNNING_WORKFLOW_JOBS,
            payload: {
                jobs: this.jobsExecutionQueue
            }
        })
    }
    async updateRunningWorkflows(){
        for(let running_workflow of this.runningWorkflowsQueue){
            await this.contentManager.save('/workflows/running/' + running_workflow.id, running_workflow)
        }
    }

    async executionCycle(){
        try {
            await this.fillExecutionQueue()
            for (let entry of this.jobsExecutionQueue) {
                if(!entry.running) {
                    entry.running = true

                    setTimeout(async function () {
                        //console.log(`Executing ${entry.node.id} job`)
                        let results = await this.runtimeManager.runJob(entry.node.job)
                        if (results) {
                            let workflow_to_run = this.runningWorkflowsQueue.get(entry.wid)
                            entry.node.job.executorPeerId = this.identityManager.peerId
                            console.log("****************EXECUTED JOB*********************")
                            this.executedJobs.push(entry.node.job.id)
                            console.log(this.executedJobs.length)
                            this.executedJobs.map( j => console.log(j))
                            console.log("****************END EXECUTED JOB*****************")
                            JobsDAG.setNodeState(
                                workflow_to_run.jobsDAG,
                                entry.node,
                                entry.node.job.status === Constants.JOB.STATUS.ENDLESS ? Constants.JOB.STATUS.ENDLESS : Constants.JOB.STATUS.COMPLETED,
                                {results: results})
                            //let nodes_to_publish = JobsDAG.getNodesToUpdate(workflow_to_run.jobsDAG)
                            //let message_id =await PeerId.create({bits: 1024, keyType: 'RSA'})
                            await this.contentManager.sendOnTopic({
                                action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE,
                                payload: {
                                    //id : message_id,
                                    wid: workflow_to_run.id,
                                    nodes: [entry.node]//nodes_to_publish
                                }
                            })
                            await this.contentManager.save('/workflows/running/' + entry.wid, workflow_to_run)
                            this.eventManager.emit(Constants.EVENTS.RUNNING_WORKFLOW_UPDATE, workflow_to_run)//?? find a better strategy
                            this.jobsExecutionQueue = this.jobsExecutionQueue.filter(e => e.node.id !== entry.node.id)
                            //console.log(`End execution ${entry.node.id} job`)
                            await this.executionCycle()
                        }
                    }.bind(this), 0)
                }
            }
            //await this.updateRunningWorkflows()
        }catch(e){
            console.log('Got error during workflows execution : ' + e.message)
        }
    }

    async manageWorkflowsExecution(){
        try {
            if(this.jobsExecutionQueue.length === this.maxConcurrentJobs) return
            //Select randomly a running workflow
            let running_workflows_keys = [ ...this.runningWorkflowsQueue.keys()]
            let workflow_to_run_id = MathJs.pickRandom(running_workflows_keys, running_workflows_keys.map(w => 1 / running_workflows_keys.length))
            //Select randomly a ready node from selected running workflow
            let workflow_to_run = this.runningWorkflowsQueue.get(workflow_to_run_id)
            if(!workflow_to_run) return
            let nodes = JobsDAG.getReadyNodes(workflow_to_run.jobsDAG)
            let node = MathJs.pickRandom(nodes, nodes.map( n => 1 / nodes.length))
            //if(!node || this.jobsExecutionQueue.filter(r => r === node.job.id).length > 0) return
            if(!node || this.jobsExecutionQueue.find(r => r === node.job.id)) return
            this.jobsExecutionQueue.push(node.job.id)
            let results = await this.runtimeManager.runJob(node.job)
            if(results){
                node.job.executorPeerId = this.identityManager.peerId
                console.log("****************EXECUTED JOB*********************")
                this.executedJobs.push(node.job.id)
                for(let j of this.executedJobs)
                    console.log(j)
                console.log(this.executedJobs.length)
                console.log("****************END EXECUTED JOB*****************")
                JobsDAG.setNodeState(
                    workflow_to_run.jobsDAG,
                    node,
                    node.job.status === Constants.JOB.STATUS.ENDLESS ? Constants.JOB.STATUS.ENDLESS : Constants.JOB.STATUS.COMPLETED,
                    {results : results})
                let nodes_to_publish = JobsDAG.getNodesToUpdate(workflow_to_run.jobsDAG)
                await this.contentManager.sendOnTopic({
                    action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE,
                    payload: {
                        wid: workflow_to_run.id,
                        nodes: nodes_to_publish
                    }
                })
                this.eventManager.emit(Constants.EVENTS.RUNNING_WORKFLOW_UPDATE, workflow_to_run)
                await this.contentManager.save('/workflows/running/' + workflow_to_run_id, workflow_to_run)
                //this.jobsExecutionQueue.splice(this.jobsExecutionQueue.indexOf(node.job.id), 1)
                this.jobsExecutionQueue = this.jobsExecutionQueue.filter( j => j !== node.job.id)
            }
        }catch (e) {
            console.log('Got error during workflows execution : %O :',  e)
        }
    }

    async runLocalJob(wid, job) {
        try {
            return await this.runtimeManager.runJob(job)
        }catch (e) {
            console.log('Got error executing job : %O', e)
        }
    }

    async manageResults(data){
        try{
            if(!data.wid && !data.nodes) return
            let workflow = this.getWorkflow(data.wid)
            if(workflow) {
                //PRIVATE WORKFLOWS
                //check if workflow do not stand in the completed ones
                if(!workflow.completedAt){
                    for(let result_node of data.nodes){
                        let local_job_node = workflow.jobsDAG.nodes.find(nd => nd.id === result_node.id)
                        if( local_job_node.job.status !== Constants.JOB.STATUS.COMPLETED ||
                            (local_job_node.job.status === Constants.JOB.STATUS.WAITING && result_node.job.status === Constants.JOB.STATUS.READY)){
                            local_job_node.color = result_node.color
                            local_job_node.job = result_node.job
                        }else{//Already completed
                            //Check results
                            /*if(local_job_node.job.results !== result_node.job.results){
                                //do something
                                local_job_node.job.warnings.push({ message : "Detected some differences in results", results : result_node.job.results })
                            }*/
                        }
                        /*if(local_job_node.receivedResults.indexOf(result_node.job.executorPeerId) === -1) {
                            local_job_node.receivedResults.push(result_node.job.executorPeerId)
                            workflow.numOfReceivedResults++
                        }*/
                    }
                    let completed_nodes = JobsDAG.getCompletedNodes(workflow.jobsDAG)
                    if(completed_nodes.length === workflow.jobsDAG.nodes.length - 1) {// -1 to not consider the root
                        workflow.completedAt = Date.now()
                        /*for(let node of workflow.jobsDAG.nodes){
                            if(node.job)
                                workflow.numOfReceivedResults += node.receivedResults.length
                        }*/
                        await this.unsubmitWorkflow(workflow.id)
                        this.eventManager.emit(Constants.EVENTS.WORKFLOW_UPDATE, workflow)
                    }
                    await this.updateWorkflow(workflow)
                    //Todo debounce with clear timeout to prevent browser freezing when user stands in the current private workflow page
                    this.eventManager.emit(Constants.EVENTS.WORKFLOW_UPDATE, workflow)
                }

                /* let completed = await this.contentManager.get('/workflows/completed/' + workflow.id)
                 if(completed) return
                 let completed_nodes = JobsDAG.getCompletedNodes(workflow.jobsDAG)
                 if(completed_nodes.length === workflow.jobsDAG.nodes.length - 1){// -1 to not consider the root
                     if(!workflow.completedAt) workflow.completedAt = Date.now()
                     await this.unsubmitWorkflow(workflow.id)
                 }else{
                     for(let result_node of data.nodes){
                         let local_job_node = workflow.jobsDAG.nodes.find(nd => nd.id === result_node.id)
                         if( local_job_node.job.status !== Constants.JOB.STATUS.COMPLETED ||
                             (local_job_node.job.status === Constants.JOB.STATUS.WAITING && result_node.job.status === Constants.JOB.STATUS.READY)){
                             local_job_node.color = result_node.color
                             local_job_node.job = result_node.job
                         }else{//Already completed
                             //Check results
                             if(local_job_node.job.results !== result_node.job.results){
                                 local_job_node.job.warnings.push({ message : "Detected some differences in results", results : result_node.job.results })
                             }
                         }
                     }
                 }
                 this.updateWorkflow(workflow)
                 this.eventManager.emit(Constants.EVENTS.WORKFLOW_UPDATE, workflow)*/
            }else {
                //RUNNING WORKFLOWS
                let running_workflow = this.runningWorkflowsQueue.get(data.wid)
                if (running_workflow) {
                    for (let result_node of data.nodes) {
                        let local_job_node = running_workflow.jobsDAG.nodes.find(nd => nd.id === result_node.id)
                        if ((!this.jobsExecutionQueue.find( j => j === result_node.job.id)) &&
                            //!local_job_node.visited &&
                            (local_job_node.job.status !== Constants.JOB.STATUS.COMPLETED ||
                                (local_job_node.job.status === Constants.JOB.STATUS.WAITING && result_node.job.status === Constants.JOB.STATUS.READY))) {
                            if(local_job_node.job.status === Constants.JOB.STATUS.ENDLESS) {
                                JobsDAG.combineResults(result_node, local_job_node)
                            }
                            //else if(local_job_node.job.status !== result_node.job.status) {
                                JobsDAG.setRunningNodeState(
                                    running_workflow.jobsDAG,
                                    local_job_node,
                                    result_node)
                            //}
                        }
                    }
                    this.contentManager.save('/workflows/running/' + data.wid, JSON.stringify(running_workflow))
                    this.eventManager.emit(Constants.EVENTS.RUNNING_WORKFLOW_UPDATE, running_workflow)
                }
            }
        }catch (e) {
            console.log('Error during results management : ' + e.message)
        }
    }

    async dropWorkflows(data){
        try{
            if(!data.wids) return
            for(let wid of data.wids) {
                await this.contentManager.delete('/workflows/running/' + wid)
                await this.contentManager.delete('/workflows/published/' + wid)
                await this.contentManager.delete('/workflows/completed/' + wid)
                this.runningWorkflowsQueue.delete(wid)
            }
        }catch (e) {
            console.log('Error during dropping results : %O', e)
        }
    }

    async getPublishedWorkflows(){
        //get workflow from global IPFS queue
        return this.publishedWorkflows
    }

    getWorkflow(workflowId){
        try {
            let workflow = this.workflows.find(w => w.id === workflowId)
            if (workflow) {
                workflow.published = this.publishedWorkflows.filter(w => w.workflow_id === workflowId).length === 1
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
            if(result.error || (result.results && result.results.error)){
                let error = result.error ? result.error : result.results.error
                console.log(error)
                return { error : error}
            }else{
                workflow = this.currentWorkflow
                workflow.jobsDAG = workflow.jobsDAG.toJSON()
                let start = Date.now()//performance.now()
                let nodes = JobsDAG.getReadyNodes(workflow.jobsDAG)
                while(nodes.length > 0) {
                    for (let node of nodes) {
                        let results = await this.runLocalJob(workflow.id, node.job)
                        if (results) {
                            JobsDAG.setNodeState(workflow.jobsDAG, node, Constants.JOB.STATUS.COMPLETED, {results: results})
                        }
                    }

                    nodes = JobsDAG.getReadyNodes(workflow.jobsDAG)
                }
                workflow.executionTime = Date.now() - start
                console.log("RUN LOCAL WORKFLOW : " +  workflow_id + " " + workflow.executionTime + " ms")
                return workflow
            }
        }catch (e) {

            console.log('Got some error during the workflow execution: %O', e)
            return {error : e}
        }

    }

    async saveWorkflow(id, name, code, language){
        try{
            let isNew = false
            let workflow = this.workflows.find(w => w.id === id)
            if(workflow){
                workflow.name = name
                workflow.code = code
                workflow.language = language
                workflow.submittedAt = null
                workflow.completedAt = null
                workflow.numOfReceivedResults = 0
            }else {
                //todo find a strategy to get a new workflow id
                let workflow_id = await PeerId.create({bits: 1024, keyType: 'RSA'})
                workflow = new Workflow(workflow_id._idB58String, name, code, language, new JobsDAG())
                isNew = true
            }
            workflow.ownerId = this.identityManager.peerId
            let execution_result = await this.checkWorkflow(workflow)
            if(execution_result.error || (execution_result.results && execution_result.results.error)){
                let error = execution_result.error ? execution_result.error : execution_result.results.error
                console.log(error)
                return {error : error}
            }else{
                if(isNew) this.workflows.push(workflow)
            }
            workflow.jobsDAG = this.currentWorkflow.jobsDAG.toJSON ? this.currentWorkflow.jobsDAG.toJSON() : this.currentWorkflow.jobsDAG
            await this.contentManager.save('/workflows/private/' + workflow.id, workflow)

            /*let workflow_cid = await this.contentManager.save('/workflows/private/' + workflow.id + '.json', JSON.stringify(workflow), {pin : true})
            //todo
            //the CID depends on if a pin cluster (first case) or regular net(second case) is used
            await this.identityManager.saveWorkflow(workflow.id, workflow_cid)*/

            await this.contentManager.delete('/workflows/completed/' + workflow.id)
            console.log('Workflow successfully saved: %O', workflow)
            return workflow
        }catch (e){
            console.log('Got some error during the workflow saving: %O', e)
            return null
        }
    }

    async updateWorkflow(workflow){
        try{
            let workflow_cid = await this.contentManager.save('/workflows/private/' + workflow.id, workflow, {pin : false})
            //await this.identityManager.saveWorkflow(workflow.id, workflow_cid.toString())
        }catch (e) {
            log('Got some error during the workflow updating: %O', e)
        }
    }

    async deleteWorkflow(workflow_id){
        try{
            await this.contentManager.delete('/workflows/private/'  + workflow_id)
            await this.identityManager.deleteWorkflow(workflow_id)
            this.workflows.splice(this.workflows.indexOf(this.getWorkflow(workflow_id)), 1);
            //TODO UNPINNING
            let workflow = this.publishedWorkflows.find(pw => pw.workflow_id === workflow_id)
            if(workflow) await this.unsubmitWorkflow(workflow)
            await this.contentManager.save('/workflows/completed/' + workflow_id, "completed")
            console.log('Workflow successfully removed')
            return true
        }catch (e){
            log('Got some error during the workflow saving: %O', e)
            return { error : e}
        }
    }

    async submitWorkflow(workflow_id){
        try{
            let submittedAt = Date.now()
            let workflow = this.getWorkflow(workflow_id)
            workflow.submittedAt = submittedAt
            await this.updateWorkflow(workflow)
            let cid = await this.contentManager.save('/workflows/private/' + workflow_id, workflow, {pin : true, net: true})

            let workflow_to_publish = {workflow_id : workflow_id, cid : cid, submittedAt : submittedAt}
            await this.contentManager.save('/workflows/published/my/' + workflow_id , workflow_to_publish)
            await this.contentManager.delete('/workflows/completed/' + workflow_id)

            this.publishedWorkflows.push({workflow_id: workflow_id, ipns_name: name, cid: cid})
            await this.contentManager.sendOnTopic({
                action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST,
                payload: workflow_to_publish
            })
            console.log('Workflow successfully submitted: %s', name)

            /*
            //let new_key = await this.contentManager.getKey(workflow_id)
            let cid = this.identityManager.getWorkflowCid(workflow_id)
            if(!cid)
                return {error : 'The current workflow is not saved in your private space'}

            let submittedAt = Date.now()
            let workflow = this.getWorkflow(workflow_id)
            workflow.submittedAt = submittedAt
            await this.updateWorkflow(workflow)

            let workflow_to_publish = {workflow_id : workflow_id, cid : cid, submittedAt : submittedAt}

            let name //= await this.contentManager.publish(cid, new_key.name)//todo resolve
            await this.contentManager.save('/workflows/published/my/' + workflow_id + '.json', JSON.stringify(workflow_to_publish), {pin : true})

            let current_workflow = await this.contentManager.get('/workflows/completed/' + workflow_id)
            if(current_workflow)
                await this.contentManager.delete('/workflows/completed/' + workflow_id)
            this.publishedWorkflows.push({workflow_id: workflow_id, ipns_name: name, cid: cid})
            await this.contentManager.sendOnTopic({
                action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST,
                payload: workflow_to_publish
            })
            console.log('Workflow successfully submitted: %s', name)*/
            return true
        }catch (e){
            console.log('Got some error during the workflow submission: %O', e)
            return { error : e}
        }
    }

    async unsubmitWorkflow(workflow_id){
        try{
            let workflow = this.publishedWorkflows.find(pw => pw.workflow_id === workflow_id)
            if(workflow) {
                this.publishedWorkflows.splice(this.publishedWorkflows.indexOf(workflow), 1)
                await this.contentManager.save('/workflows/completed/' + workflow_id, "completed")
                await this.contentManager.delete('/workflows/published/my/'  + workflow_id)
                //let message_id =await PeerId.create({bits: 1024, keyType: 'RSA'})
                await this.contentManager.sendOnTopic({
                    //id : message_id,
                    action: Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED,
                    payload: {
                        wids: [workflow_id],
                    }
                })
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
    async saveOnNetwork(data, json = false){
        try{
            return await this.contentManager.saveOnIpfs(json ? JSON.stringify(data) : data)
        }catch (e) {
            console.log('Got error during saving on network : %O', e)
            return e
        }
    }

    async getFromNetwork(cid){
        try{
            return await this.contentManager.getFromNetwork(cid)
        }catch (e) {
            console.log('Got error during getting data from network : %O', e)
            return e
        }
    }
    //TODO da completare
    async registerFunction(name, func){
        try {
            this.currentWorkflow.functions.push({name: name, func: func})
            return true
        }catch (e) {
            console.log('Error during register function : %O', e)
            return false
        }
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
            return {error : e.message}
        }
    }

    async setEndlessJob(job_id){
        try{
            let result = this.currentWorkflow.jobsDAG.setEndlessJob(job_id)
            return result
        }catch (e){
            console.log('Got some error setting endless job: %O', e)
            return {error : e.message}
        }
    }

    async setJobReturnType(job_id, type){
        try{
            return this.currentWorkflow.jobsDAG.setJobReturnType(job_id, type)
        }catch (e){
            console.log('Got some error setting job return type: %O', e)
            return {error : e.message}
        }
    }

    async addJobToGroup(job_id, group){
        try{
            return this.currentWorkflow.jobsDAG.addJobToGroup(job_id, group)
        }catch (e){
            console.log('Got some error adding job to group: %O', e)
            return {error : e.message}
        }
    }

    getRunningWorkflows(){
        try{
            return [...this.runningWorkflowsQueue.values()]

        }catch (e) {
            console.log('There was an error during running workflows retrieving : %O', e)
            return []
        }
    }

    async getRunningWorkflow(id){
        try{
            let encoded_workflow = await this.contentManager.get('/workflows/running/' + id)
            if(!encoded_workflow) return null
            return JSON.parse(encoded_workflow)
        }catch (e) {
            console.log('There was an error during running workflow retrieving : %O', e)
            return null
        }
    }

    async removeRunningWorkflow(id){
        try{
            await this.contentManager.delete('/workflows/running/' + id )
            await this.contentManager.delete('/workflows/published/' + id)
            await this.contentManager.delete('/workflows/completed/' + id)
            let running_workflows = await this.contentManager.list('/workflows/running')
            this.workflowsWeights = running_workflows.map(w => 1 / running_workflows.length)
            this.runningWorkflowsQueue.delete(id)
            return true
        }catch (e) {
            console.log('There was an error removing running workflow : %O', e)
            return {error : e.message}
        }
    }

    getWorkflowResults(wid){
        let workflow = this.workflows.find(w => w.id === wid)
        return workflow ? JobsDAG.getOutputNodes(workflow.jobsDAG) : []
    }

    getRunningWorkflowResults(wid){
        try {
            let workflow = this.runningWorkflowsQueue.get(wid)
            return workflow ? JobsDAG.getOutputNodes(workflow.jobsDAG) : []
        }catch(e){
            console.log('There was an error retrieving running workflow : %O', e)
            return []
        }
    }


}

module.exports = WorkflowManager
