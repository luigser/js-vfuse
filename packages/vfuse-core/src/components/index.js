'use strict'

const log = require('debug')('vfuse:node')
const EventManager = require('./eventManager')
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
        this.eventManager = new EventManager()
        this.networkManager = new NetworkManager(this.options, this.eventManager)
        this.contentManager = new ContentManager(this.networkManager, this.eventManager)
        await this.networkManager.start()
        this.options.peerId  = this.networkManager.peerId
        this.identityManager = new IdentityManager(this.contentManager, this.eventManager, this.options)
        this.workflowManager = new WorkflowManager(this.contentManager, this.identityManager, this.eventManager, this.options)
        //TODO MANAGE IT
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
                if(this.options.proxy){
                    const VFuseProxy = require('./proxy/proxy')
                    this.proxy = new VFuseProxy(this.options.proxy)
                }

                //Start signal server
                if (this.options.SignalServer) {
                    const WStarSignalingServer = require('libp2p-webrtc-star/src/sig-server')
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
            this.status = Constants.NODE_STATE.STOP
        }
    }

    getConnectedPeers(){
        return this.networkManager.getConnectedPeers()
    }

    registerTopicListener(callback){
        this.networkManager.registerTopicListener(callback)
    }

    getProfile(){
        return this.identityManager.getCurrentProfile()
    }

    getWorkflows(){
        return this.workflowManager.getCurrentWorkflows()
    }

    async getWorkflow(id){
        return await this.workflowManager.getWorkflow(id)
    }

    async saveWorkflow(name, id, code, language){
       return await this.workflowManager.saveWorkflow(name, id, code, language)
    }

    async deleteWorkflow(workflow_id){
        return await this.workflowManager.deleteWorkflow(workflow_id)
    }

    async publishWorkflow(workflow_id){
        return await this.workflowManager.publishWorkflow(workflow_id)
    }
    async unpublishWorkflow(workflow_id){
        return await this.workflowManager.unpublishWorkflow(workflow_id)
    }

    async getPublishedWorkflows(){
        return await this.workflowManager.getPublishedWorkflows()
    }

    async checkWorkflow(code){
        return await this.workflowManager.checkWorkflow(code)
    }

    async testWorkflow(code, language){
        return await this.workflowManager.testWorkflow(code, language)
    }

    async getRunningWorkflows(){
        return await this.workflowManager.getRunningWorkflows()
    }

    async getRunningWorkflow(id){
        return await this.workflowManager.getRunningWorkflow(id)
    }
    async removeRunningWorkflow(id){
        await this.workflowManager.removeRunningWorkflow(id)
    }

    async addJob(workflow, code, data, dependencies){
        //Todo the dependencies and data should be extracted directly from the entire code in the notebook
        await this.workflowManager.addJob(workflow, code, data, dependencies)
    }

    getWorkflowResults(wid){
        return this.workflowManager.getWorkflowResults(wid)
    }

    getRunningWorkflowResults(wid){
        return this.workflowManager.getRunningWorkflowResults(wid)
    }

    async savePreferences(preferences){
        return await this.identityManager.savePreferences(preferences)
    }

    addListener(event, callback){
        this.eventManager.addListener(event, callback)
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
        try {
            let currentOptions = isBrowser ? DefaultOptions.getBrowserOptions(options) : DefaultOptions.getBootstrapOptions(options)
            const vfuse = new VFuse(currentOptions)
            await vfuse.start()
            await vfuse.networkManager.send("VFuse node is ready")
            return vfuse
        }catch (e) {
            return { error : e.message}
        }
    }
}

module.exports = VFuse
