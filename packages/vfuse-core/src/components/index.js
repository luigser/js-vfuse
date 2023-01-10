'use strict'

//const log = require('debug')('vfuse:node')
const EventManager = require('./eventManager')
const NetworkComponent = require('./networkComponent')
const EventAndDataComponent = require('./eventAndDataComponent')
const IdentityModule = require('./identityModule')
const WorkflowModule = require('./workflowModule')
const Constants = require('./constants')
const DefaultOptions = require('../utils/defaultOptions')
const Miscellaneous = require('../utils/miscellaneous')

const { isNode, isBrowser } = require("browser-or-node");

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
        this.networkComponent = new NetworkComponent(this.options, this.eventManager)
        this.eventAndDataComponent = new EventAndDataComponent(this.networkComponent, this.eventManager, this.options)
        await this.networkComponent.start()
        this.identityModule = new IdentityModule(this.eventAndDataComponent, this.eventManager, this.networkComponent.peerId, this.options)
        this.workflowModule = new WorkflowModule(this.eventAndDataComponent, this.identityModule, this.eventManager, this.options)
        //TODO MANAGE IT
        await this.workflowModule.start()
        await this.identityModule.checkProfile()
    }

    async start(){
        try {
            console.log('Strating VFuse node...')
            this.status = Constants.NODE_STATE.INITIALIZING;

            if (isBrowser) {
                this.logs = []
                console=(function(oldCons){
                    return {
                        log: function(text, args){
                            let messages = [text]
                            if(args ) {
                                messages.push(args)
                                oldCons.log(text, args);
                            }else
                                oldCons.log(text)
                            let log = {method : 'info', data : messages}
                            this.logs.push(log)
                            this.eventManager.emit(Constants.EVENTS.CONSOLE_MESSAGE, this.logs)
                        }.bind(this),
                        info: function (text) {
                            oldCons.info(text);
                        },
                        warn: function (text) {
                            oldCons.warn(text);
                        },
                        error: function (text) {
                            oldCons.error(text);
                        }
                    };
                }.bind(this)(window.console));
                window.console = console;
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
                            port: 2001,
                            host: '0.0.0.0'
                        }
                    )
                    console.log('WebRTC Signaling server Listening on:', this.webRtcStartServer.info.uri)

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
                    this.gateway = new Gateway.HttpGateway(this.networkComponent.ipfs);
                    await this.gateway.start();
                    console.log('Gateway started')
                }

                if (this.options.HttpAPI) {
                    const HttpApi = require('ipfs-http-server')
                    this.httpApi = new HttpApi(this.networkComponent.ipfs)
                    await this.httpApi.start()
                    console.log('Http API Server started')
                    if (this.httpApi._apiServers.length) {
                        await this.networkComponent.ipfs.repo.setApiAddr(this.httpApi._apiServers[0].info.ma)
                    }
                }
            }

            this.status = Constants.NODE_STATE.RUNNING
        }catch (e) {
            console.log('Error during VFuse node initialization: ' + e.message)
            this.status = Constants.NODE_STATE.STOP
        }
    }

    getLogs(){
        return this.logs
    }

    getConnectedPeers(){
        return this.networkComponent.getConnectedPeers()
    }

    registerTopicListener(callback){
        this.networkComponent.registerTopicListener(callback)
    }

    getProfile(){
        return this.identityModule.getCurrentProfile()
    }

    getWorkflows(){
        return this.workflowModule.getCurrentWorkflows()
    }

    async getWorkflow(id){
        return await this.workflowModule.getWorkflow(id)
    }

    async saveWorkflow(name, id, code, language, scheduling, input){
       return await this.workflowModule.saveWorkflow(name, id, code, language, scheduling, input)
    }

    async deleteWorkflow(workflow_id){
        return await this.workflowModule.deleteWorkflow(workflow_id)
    }

    async submitWorkflow(workflow_id){
        return await this.workflowModule.submitWorkflow(workflow_id)
    }
    async unsubmitWorkflow(workflow_id){
        return await this.workflowModule.unsubmitWorkflow(workflow_id)
    }

    async getPublishedWorkflows(){
        return await this.workflowModule.getPublishedWorkflows()
    }

    async checkWorkflow(code){
        return await this.workflowModule.checkWorkflow(code)
    }

    async testWorkflow(code, language){
        return await this.workflowModule.testWorkflow(code, language)
    }

    async getRunningWorkflows(){
        return await this.workflowModule.getRunningWorkflows()
    }

    async getRunningWorkflow(id){
        return await this.workflowModule.getRunningWorkflow(id)
    }
    async removeRunningWorkflow(id){
        await this.workflowModule.removeRunningWorkflow(id)
    }

    async addJob(workflow, code, data, dependencies){
        //Todo the dependencies and data should be extracted directly from the entire code in the notebook
        await this.workflowModule.addJob(workflow, code, data, dependencies)
    }

    getWorkflowResults(wid){
        return this.workflowModule.getWorkflowResults(wid)
    }

    getRunningWorkflowResults(wid){
        return this.workflowModule.getRunningWorkflowResults(wid)
    }

    async savePreferences(preferences){
        return await this.identityModule.savePreferences(preferences)
    }

    addListener(event, callback){
        this.eventManager.addListener(event, callback)
    }

    removeListener(event, callback){
        this.eventManager.removeListener(event, callback)
    }

    async stop(){
        console.log('Stopping VFuse node...')
        await this.networkComponent.stop()
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
            await vfuse.networkComponent.send("VFuse node is ready")
            if(isBrowser)
                window.VFuse = vfuse
            return vfuse
        }catch (e) {
            return { error : e.message}
        }
    }
}

module.exports = VFuse
