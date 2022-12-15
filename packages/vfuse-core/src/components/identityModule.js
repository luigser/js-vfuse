'use strict'

const Constants = require('./constants');
const {isNode, isBrowser} = require("browser-or-node");

//const log = require('debug')('vfuse:profile')

class IdentityModule {
    /**
     * @param {Object} networkManager
     * @param {Object} options
     */
    constructor ( contentManager, eventManager, peerId , options) {
        this.id = peerId
        this.options = options
        this.peerId = peerId
        this.contentManager = contentManager
        this.eventManager = eventManager
        this.workflows = []
        this.rewards = 0.00
        this.preferences = {
            ENDPOINTS:{
                SIGNAL_SERVER : options.preferences && options.preferences.SIGNAL_SERVER ? options.preferences.SIGNAL_SERVER : '',
                BOOTSTRAPS: options.preferences && options.preferences.BOOTSTRAPS ? options.preferences.BOOTSTRAPS : [],
                PINNING_SERVER : {
                    PROTOCOL : options.preferences && options.preferences.PINNING_SERVER ? options.preferences.PINNING_SERVER.PROTOCOL : 'https',
                    HOST : options.preferences && options.preferences.PINNING_SERVER ? options.preferences.PINNING_SERVER.HOST : '172.16.149.150',
                    PORT : options.preferences && options.preferences.PINNING_SERVER ? options.preferences.PINNING_SERVER.PORT : '9097'
                },
                DELEGATE_NODE : ''
            },
            TIMEOUTS:{
                DISCOVERY : options.preferences && options.preferences.DISCOVERY ? options.preferences.DISCOVERY : 15,
                WORKFLOWS_PUBLISHING : options.preferences && options.preferences.WORKFLOWS_PUBLISHING ?options.preferences.WORKFLOWS_PUBLISHING : 60,
                JOBS_PUBLISHING : options.preferences && options.preferences.JOBS_PUBLISHING ? options.preferences.JOBS_PUBLISHING : 15,
                RESULTS_PUBLISHING: options.preferences && options.preferences.RESULTS_PUBLISHING ? options.preferences.RESULTS_PUBLISHING : 120,
                EXECUTION_CYCLE: options.preferences && options.preferences.EXECUTION_CYCLE ? options.preferences.EXECUTION_CYCLE : 1,
                JOB_EXECUTION : options.preferences && options.preferences.JOB_EXECUTION ? options.preferences.JOB_EXECUTION : 300,
            },
            LIMITS: {
                MAX_CONCURRENT_JOBS : options.preferences && options.preferences.MAX_CONCURRENT_JOBS ? options.preferences.MAX_CONCURRENT_JOBS : isBrowser ? window.navigator.hardwareConcurrency - 1 : require('os').cpus().length - 1,
                MAX_MANAGED_WORKFLOWS : options.preferences && options.preferences.MAX_MANAGED_WORKFLOWS ? options.preferences.MAX_MANAGED_WORKFLOWS : Constants.LIMITS.MAX_MANAGED_WORKFLOWS,
            },
            CONSTANTS:{
                CPU_USAGE : 0.2,
                cpuConstant : 0.2,
                discoveryTimeoutConstant : 15,
                workflowsPublishingTimeoutConstant : 60,
                resultsPublishingTimeoutConstant : 120,
                executionCycleTimeoutConstant : 1,
                maxConcurrentJobsConstant : 10
            }
        }
        //todo MANAGE IT
        //this.eventManager.addListener('circuit_enabled', async function(){await this.checkProfile()}.bind(this))
    }

    async getProfile(id) {
        try {
            //For IPFS FILE MFS usagel
            let profile = await this.contentManager.get('/profiles/' + (!id ? this.id : id))
            if(profile){
                this.assignProfile(profile)
                console.log('Profile loaded : %O', profile)
                //console.log(this.workflows[0].id)
                this.eventManager.emit(Constants.EVENTS.PROFILE_STATUS, { status : true, profile : {...profile, ...{id : this.id}}  })
                return profile
            }else{
                if(isNode && this.options.localStorage)
                    await this.createProfile()
                this.eventManager.emit(Constants.EVENTS.PROFILE_STATUS, { status : false })
                return false
            }
        }catch(e){
            console.log('Got some error during profile retrieving: %O', e)
            this.eventManager.emit(Constants.EVENTS.PROFILE_STATUS, { status : false, error : e})
            return false
        }
    }

    getCurrentProfile(){
        return {
            id: this.id,
            rewards : this.rewards,
            preferences : this.preferences
        }
    }

    assignProfile(p){
        if(p.content) p.content = JSON.parse(p.content)
        this.rewards = p.rewards
        this.workflows = p.workflows
        this.preferences = p.preferences
    }

    async createProfile(){
        try{
            //try to check if profile for you peerId already exist
            //if yes do not create no one but get it
            let profile = await this.contentManager.get('/profiles/' + this.peerId)
            if(!profile){
                //Todo check if profile already exist, of yes remove and create from scratch
                let new_profile = {
                    workflows : [],
                    rewards: 10.00,
                    preferences : this.preferences
                }
                await this.contentManager.makeDir('/workflows/private')
                await this.contentManager.makeDir('/workflows/published')
                await this.contentManager.makeDir('/workflows/published/my')
                await this.contentManager.makeDir('/workflows/running')
                await this.contentManager.makeDir('/workflows/completed')
                await this.contentManager.makeDir('/profiles')
                /*new TextEncoder().encode(JSON.stringify(new_profile))*/
                await this.contentManager.save("/profiles/" + this.peerId, new_profile)
                this.id = this.peerId
                this.rewards = 10.00
                this.eventManager.emit(Constants.EVENTS.PROFILE_STATUS, { status : true, profile : {...new_profile, ...{id : this.id}}  })
                console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', this.peerId)
            }else{
                let p = JSON.parse(profile)
                this.assignProfile(p)
                this.id = this.peerId
                this.eventManager.emit(Constants.EVENTS.PROFILE_STATUS, { status : true, profile : {...profile, ...{id : this.id}} })
            }
        }catch (e){
            this.eventManager.emit(Constants.EVENTS.PROFILE_STATUS, { status : false, error : e})
            console.log('Got some error during the profile creation: %O', e)
        }
    }

    async saveWorkflow(wid, cid){
        try{
            let filtered = this.workflows.filter(w => w.id === wid)
            let workflow = filtered.length > 0 ? filtered[0] : null
            if(workflow){
                workflow.cid = cid
            }else{
                this.workflows.push({ id : wid, cid : cid})
            }
            await this.updateProfile()

        }catch (e) {
            console.log('Error during workflow saving in the profile : %O', e)
        }
    }

    async deleteWorkflow(wid){
        try{
            let filtered = this.workflows.filter(w => w.id === wid)
            let workflow = filtered.length > 0 ? filtered[0] : null
            if(workflow){
                this.workflows.splice(this.workflows.indexOf(workflow), 1);
            }
            await this.updateProfile()

        }catch (e) {
            console.log('Error during workflow deletion from profile : %O', e)
        }

    }

    async savePreferences(preferences){
        try{
            let prefs = {
                ...this.preferences,
                ...preferences
            }
            this.preferences = prefs
            await this.updateProfile()
            this.eventManager.emit(Constants.EVENTS.PREFERENCES_UPDATED, this.preferences)
            return true
        }catch (e) {
            console.log('Error saving preferences : %O', e)
            return false
        }
    }

    getWorkflowCid(wid){
        let filtered = this.workflows.filter(w => w.id === wid)
        let workflow = filtered.length > 0 ? filtered[0] : null
        return workflow ? workflow.cid : null
    }

    async updateProfile(){
        try{
            let profile = {
                workflows: this.workflows,
                rewards: this.rewards,
                preferences: this.preferences
            }
            await this.contentManager.save("/profiles/" + this.id, profile)
        }catch (e){
            console.log('Got some error during the profile publishing: %O', e)
        }
    }

    async checkProfile(){
        try {
            if(this.id){
                await this.getProfile()
            } else {
                await this.createProfile()
            }
        }catch(e){
            console.log('Got some error during profile checking: %O', e)
        }
    }
}

module.exports = IdentityModule
