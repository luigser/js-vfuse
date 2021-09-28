'use strict'

const log = require('debug')('vfuse:node')
const NetworkManager = require('./networkManager')
const IdentityManager = require('./identityManager')
const WorkflowManager = require('./workflowManager')
const Constants = require('./constants')

class VFuse {
    /**
     * @param {Object} options
     */
    constructor(options) {
        this.networkManager = new NetworkManager(options)
        this.options = options
        this.status = Constants.NODE_STATE.STOP
    }

    async start(){
        console.log('Strating VFuse node...')
        this.status = Constants.NODE_STATE.INITIALIZING;
        switch(this.options.mode){
            case Constants.VFUSE_MODE.BROWSER:
                await this.networkManager.start()
                this.identityManager = new IdentityManager(this.networkManager, this.options)
                this.workflowManager = new WorkflowManager(this.networkManager, this.identityManager, this.options)
                await this.workflowManager.start()
                await this.identityManager.checkProfile()
                //setTimeout(async () => await this.profile.check(), 30000)
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
                await this.networkManager.start()
                break
        }
        this.status = Constants.NODE_STATE.RUNNING
    }

    registerTopicListener(callback){
        this.networkManager.registerTopicListener(callback)
    }

    async createWorkflow(name){
       return await this.workflowManager.createWorkflow(name)
    }

    async publishWorkflow(workflow_id){
        return await this.workflowManager.publishWorkflow(workflow_id)
    }

    async getPublishedWorkflows(){
        return await this.workflowManager.getPublishedWorkflows()
    }

    async runAllWokflows(){
        await this.workflowManager.runAllWokflows()
    }

    async addJob(workflow, code, data, dependencies){
        //Todo the dependencies and data should be extracted directly from the entire code in the notebook
        await this.workflowManager.addJob(workflow, code, data, dependencies)
    }

    registerCallbacks(discoveryCallback, connectionCallback, getMessageFromProtocolCallback){
        this.networkManager.registerCallbacks(discoveryCallback, connectionCallback, getMessageFromProtocolCallback)
    }

    async stop(){
        console.log('Stopping VFuse node...')
        await this.networkManager.stop()
        this.status = Constants.NODE_STATE.STOP
    }

    /**
     * @param {Options} options
     */
    static async create (options = {}) {
        const vfuse = new VFuse(options)
        await vfuse.start()
        await vfuse.networkManager.send("VFuse node is ready")
        return vfuse
    }
}

module.exports = VFuse
