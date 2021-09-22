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
        this.status = Constants.NODE_STATE.STOP
    }

    async start(){
        console.log('Strating VFuse node...')
        this.status = Constants.NODE_STATE.INITIALIZING;
        switch(this.options.mode){
            case Constants.VFUSE_MODE.BROWSER:
                await this.net.start()
                this.profile = new Profile(this.net, this.options)
                this.workflowManager = new WorkflowManager(this.net, this.profile, this.options)
                await this.workflowManager.start()
                //await this.profile.check()
                setTimeout(async () => await this.profile.check(), 30000)
                break
            case Constants.VFUSE_MODE.GATEWAY:
                if(this.options.signalServerEnabled){
                    const WStarSignalingServer = require('libp2p-webrtc-star/src/sig-server/index')
                    this.webRtcStartServer = await WStarSignalingServer.start(
                        {
                            port: 2000,
                            host: '0.0.0.0'
                        }
                    )
                    console.log('RTC Signaling server Listening on:',  this.webRtcStartServer.info.uri)

                    process.on('SIGINT', async function(){
                        await this.webRtcStartServer.stop()
                        console.log('Signalling server stopped')
                        await this.stop()
                        process.exit(0);
                    }.bind(this))

                }
                await this.net.start()
                break
        }
        this.status = Constants.NODE_STATE.RUNNING
    }

    registerTopicListener(callback){
        this.net.registerTopicListener(callback)
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

    registerCallbacks(discoveryCallback, connectionCallback, getMessageFromProtocolCallback){
        this.net.registerCallbacks(discoveryCallback, connectionCallback, getMessageFromProtocolCallback)
    }

    async stop(){
        console.log('Stopping VFuse node...')
        await this.net.stop()
        this.status = Constants.NODE_STATE.STOP
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
