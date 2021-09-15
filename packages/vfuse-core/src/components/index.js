'use strict'

const log = require('debug')('vfuse:node')
const Network = require('./network')
const Profile = require('./profile')
const WorkflowManager = require('./job/workflowManager')
const Constants = require('./constants')

const WStarSignalingServer = require('libp2p-webrtc-star/src/sig-server/index')

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

                this.webRtcStartServer = await WStarSignalingServer.start(
                    {
                        port: 2000,
                        host: '127.0.0.1'
                    }
                )
                console.log('RTC Signaling server Listening on:',  this.webRtcStartServer.info.uri)

                process.on('SIGINT', async function(){
                    await this.webRtcStartServer.stop()
                    console.log('Signalling server stopped')
                }.bind(this))
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
