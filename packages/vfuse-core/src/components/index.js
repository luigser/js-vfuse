'use strict'

const log = require('debug')('vfuse:node')
const Network = require('./network')
const Profile = require('./profile')
const WorkflowManager = require('./job/workflowManager')
const Constants = require('./constants')

class VFuse {
    /**
     * @param {Object} options
     */
    constructor(options) {
        this.net = new Network(options)
        this.options = options
    }

    async start(){
        console.log('Strating VFuse node...')
        await this.net.start()
        switch(this.options.mode){
            case Constants.VFUSE_MODE.NORMAL:
                this.profile = new Profile(this.net, this.options)
                this.workflowManager = new WorkflowManager(this.net, this.profile, this.options)
                await this.workflowManager.start()
                await this.profile.check()
                break
            case Constants.VFUSE_MODE.GATEWAY:
                break

        }
    }

    async createWorkflow(){
       return await this.workflowManager.createWorkflow()
    }

    getWorkflows(){
        return this.profile.workflows
    }

    async runAllWokflows(){
        await this.workflowManager.runAllWokflows()
    }
    
    async addJob(workflow, code, data, dependencies){
        await this.workflowManager.addJob(workflow, code, data, dependencies)
    }

    async stop(){
        console.log('Stopping VFuse node...')
        await this.net.stop()
    }

    /**
     * @param {Options} options
     */
    static async create (options = {}) {
        const vfuse = new VFuse(options)
        await vfuse.start()
        await vfuse.net.send("VFuse node is ready")
        return vfuse
    }
}

module.exports = VFuse