'use strict'

const Constants = require('./constants');

//const log = require('debug')('vfuse:profile')

class IdentityManager {
    /**
     * @param {Object} networkManager
     * @param {Object} options
     */
    constructor ( contentManager, eventManager, peerId , options) {
        options = options.preferences
        this.id = options && options.profileId ? options.profileId : peerId
        this.peerId = peerId
        this.contentManager = contentManager
        this.eventManager = eventManager
        this.workflows = []
        this.rewards = 0.00
        this.preferences = {
            ENDPOINTS:{
                SIGNAL_SERVER : options && options.SIGNAL_SERVER ? options && options.SIGNAL_SERVER : '',
                BOOTSTRAPS: options && options.BOOTSTRAPS ? options && options.BOOTSTRAPS : [],
                PINNING_SERVER : {
                    PROTOCOL : options && options.PINNING_SERVER ? options && options.PINNING_SERVER.PROTOCOL : 'https',
                    HOST : options && options.PINNING_SERVER ? options && options.PINNING_SERVER.HOST : '193.205.161.5',
                    PORT : options && options.PINNING_SERVER ? options && options.PINNING_SERVER.PORT : '9097'
                },
                DELEGATE_NODE : ''
            },
            TIMEOUTS:{
                DISCOVERY : options && options.DISCOVERY ? options && options.DISCOVERY : 15,
                WORKFLOWS_PUBLISHING : options && options.WORKFLOWS_PUBLISHING ? options && options.WORKFLOWS_PUBLISHING : 60,
                JOBS_PUBLISHING : options && options.JOBS_PUBLISHING ? options && options.JOBS_PUBLISHING : 15,
                RESULTS_PUBLISHING: options && options.RESULTS_PUBLISHING ? options && options.RESULTS_PUBLISHING : 120,
                EXECUTION_CYCLE: options && options.EXECUTION_CYCLE ? options && options.EXECUTION_CYCLE : 1,
                JOB_EXECUTION : options && options.JOB_EXECUTION ? options && options.JOB_EXECUTION : 300,
            },
            LIMITS: {
                MAX_CONCURRENT_JOBS : options && options.MAX_CONCURRENT_JOBS ? options && options.MAX_CONCURRENT_JOBS : 5,
                MAX_MANAGED_WORKFLOW : options && options.MAX_MANAGED_WORKFLOW ? options && options.MAX_MANAGED_WORKFLOW : 100,
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
            let decoded_profile = await this.contentManager.get('/profiles/' + (!id ? this.id : id) + '.json')
            if(decoded_profile){
                let p = JSON.parse(decoded_profile)
                this.assignProfile(p)
                console.log('Profile loaded : %O', p)
                //console.log(this.workflows[0].id)
                this.eventManager.emit(Constants.EVENTS.PROFILE_STATUS, { status : true, profile : {...p, ...{id : this.id}}  })
                return p
            }else{
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
            let profile = await this.contentManager.get('/profiles/' + this.peerId + '.json')
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
                /*new TextEncoder().encode(JSON.stringify(new_profile))*/
                await this.contentManager.save("/profiles/" + this.peerId + '.json', JSON.stringify(new_profile), {pin : true})
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
            await this.contentManager.save("/profiles/" + this.id + '.json', JSON.stringify(profile), {pin : true})
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

module.exports = IdentityManager
