'use strict'

const log = require('debug')('vfuse:node')
const NetworkManager = require('./networkManager')
const ContentManager = require('./contentManager')
const IdentityManager = require('./identityManager')
const WorkflowManager = require('./workflowManager')
const Constants = require('./constants')
const DefaultOptions = require('../utils/defaultOptions')

const  { isNode, isBrowser } = require("browser-or-node");

class VFuse {
    /**
     * @param {Object} options
     */
    constructor(options) {
        this.options = options
        this.status = Constants.NODE_STATE.STOP
    }

    async startManagers(){
        this.networkManager = new NetworkManager(this.options)
        this.contentManager = new ContentManager(this.networkManager)
        await this.networkManager.start()
        this.options.peerId  = this.networkManager.key[0].id
        this.identityManager = new IdentityManager(this.contentManager, this.options)
        this.workflowManager = new WorkflowManager(this.contentManager, this.identityManager, this.options)
        await this.workflowManager.start()
        await this.identityManager.checkProfile()
    }

    async start(){
        try {
            console.log('Strating VFuse node...')
            this.status = Constants.NODE_STATE.INITIALIZING;

            if (isBrowser) {
                await this.startManagers()
            } else if (isNode) {
                //Start signal server
                if (this.options.SignalServer) {
                    const WStarSignalingServer = require('libp2p-webrtc-star/src/sig-server/index')
                    this.webRtcStartServer = await WStarSignalingServer.start(
                        {
                            port: 2000,
                            host: '0.0.0.0'
                        }
                    )
                    console.log('RTC Signaling server Listening on:', this.webRtcStartServer.info.uri)

                    process.on('SIGINT', async function () {
                        await this.webRtcStartServer.stop()
                        console.log('Signalling server stopped')
                        await this.stop()
                        process.exit(0);
                    }.bind(this))
                }

                await this.startManagers()

                if (this.options.IPFSGateway) {
                    const Gateway = require('ipfs-http-gateway');
                    this.gateway = new Gateway(this.networkManager.ipfs);
                    await this.gateway.start();
                    console.log('Gateway started')
                }

                if (this.options.HttpAPI) {
                    const HttpApi = require('ipfs-http-server')
                    this.httpApi = new HttpApi(this.networkManager.ipfs)
                    await this.httpApi.start()
                    console.log('Http API Server started')
                    if (this.httpApi._apiServers.length) {
                        await this.networkManager.ipfs.repo.setApiAddr(this.httpApi._apiServers[0].info.ma)
                    }
                }

            }

            this.status = Constants.NODE_STATE.RUNNING
        }catch (e) {
            console.log('Error during VFuse node initialization: %O', e)
        }
    }

    registerTopicListener(callback){
        this.networkManager.registerTopicListener(callback)
    }

    getProfile(){
        return this.identityManager.getCurrentProfile()
    }

    getWorkflow(id){
        return this.workflowManager.getWorkflow(id)
    }

    async saveWorkflow(name, id, code, language){
       return await this.workflowManager.saveWorkflow(name, id, code, language)
    }

    async publishWorkflow(workflow_id){
        return await this.workflowManager.publishWorkflow(workflow_id)
    }

    async getPublishedWorkflows(){
        return await this.workflowManager.getPublishedWorkflows()
    }

    async runLocalWorkflowCode(code){
        return await this.workflowManager.runLocalWorkflowCode(code)
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
        let currentOptions = isBrowser ? DefaultOptions.getBrowserOptions(options) : DefaultOptions.getGatewayOptions(options)
        const vfuse = new VFuse(currentOptions)
        await vfuse.start()
        await vfuse.networkManager.send("VFuse node is ready")

        return vfuse
    }
}

module.exports = VFuse
