'use strict'
const log = require('debug')('vfuse:node')
const Network = require('./network')
const Profile = require('./profile')
const WorkflowManager = require('./job/workflowManager')

class VFuse {
    /**
     * @param {Object} options
     */
    constructor(options) {
        this.net = new Network(options)
        this.profile = new Profile(this.net, options)
        this.workflowManager = new WorkflowManager(this.net, options)
    }

    async start(){
        console.log('Strating VFuse node...')
        await this.net.start()
        await this.workflowManager.start()
        await this.profile.checkProfile()
    }
    //Just for test
    addWorkflow(workflow){
        return this.workflowManager.addWorkflow(workflow)
    }

    async runAllWokflows(){
        await this.workflowManager.runAllWokflows();
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
        return vfuse
    }
}

module.exports = VFuse