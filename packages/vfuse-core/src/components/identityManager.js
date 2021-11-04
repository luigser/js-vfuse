'use strict'

const log = require('debug')('vfuse:profile')

class IdentityManager {
    /**
     * @param {Object} networkManager
     * @param {Object} options
     */
    constructor ( contentManager, eventManager, options) {
        this.id = options.profileId ? options.profileId : null
        this.peerId = options.peerId
        this.contentManager = contentManager
        this.eventManager = eventManager
        this.publishedWorkflows = []
        this.workflows = []
        this.rewards   = 0.00

        this.eventManager.addListener('circuit_enabled', async function(){await this.checkProfile()}.bind(this))
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
                this.eventManager.emit('profile.ready', { status : true, profile : {...p, ...{id : this.id}}  })
                return p
            }else{
                this.eventManager.emit('profile.ready', { status : false })
                return false
            }
        }catch(e){
            console.log('Got some error during profile retrieving: %O', e)
            this.eventManager.emit('profile.ready', { status : false, error : e})
            return false
        }
    }

    getCurrentProfile(){
        return {
            id: this.id,
            rewards : this.rewards,
            publishedWorkflows: this.publishedWorkflows
        }
    }

    assignProfile(p){
        if(p.content) p.content = JSON.parse(p.content)
        this.rewards = p.rewards
        this.workflows = p.workflows
        this.publishedWorkflows = p.publishedWorkflows
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
                    publishedWorkflows : [],
                    rewards: 10.00
                }
                await this.contentManager.makeDir('/workflows/private')
                await this.contentManager.makeDir('/workflows/published')
                await this.contentManager.makeDir('/workflows/unpublished')
                await this.contentManager.makeDir('/workflows/running')
                await this.contentManager.makeDir('/workflows/completed')
                /*new TextEncoder().encode(JSON.stringify(new_profile))*/
                await this.contentManager.save("/profiles/" + this.peerId + '.json', JSON.stringify(new_profile), {pin : true})
                this.id = this.peerId
                this.rewards = 10.00
                this.eventManager.emit('profile.ready', { status : true, profile : {...new_profile, ...{id : this.id}}  })
                console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', this.peerId)
            }else{
                let p = JSON.parse(profile)
                this.assignProfile(p)
                this.id = this.peerId
                this.eventManager.emit('profile.ready', { status : true, profile : {...profile, ...{id : this.id}} })
            }
        }catch (e){
            this.eventManager.emit('profile.ready', { status : false, error : e})
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

    getWorkflowCid(wid){
        let filtered = this.workflows.filter(w => w.id === wid)
        let workflow = filtered.length > 0 ? filtered[0] : null
        return workflow ? workflow.cid : null
    }

    async updatePublishedWorkflow(wid, ipns_name, cid){
        try{
            let filtered = this.publishedWorkflows.filter(pw => pw.id === wid)
            if(filtered.length > 0){
                filtered[0].ipns_name = ipns_name
                filtered[0].cid = cid
            }else {
                this.publishedWorkflows.push({id: wid, ipns_name: ipns_name, cid: cid})
            }
            await this.updateProfile()
        }catch (e) {
            console.log('Got error during add published workflow operation : %O', e)
        }
    }

    async unpublishWorkflow(published_workflow){
        try{
            this.publishedWorkflows.splice(this.publishedWorkflows.indexOf(published_workflow), 1);
            await this.updateProfile()
            return true
        }catch (e) {
            console.log('Got error during unpublish workflow operation : %O', e)
            return false
        }
    }

    async updateProfile(){
        try{
            let profile = {
                workflows : this.workflows,
                publishedWorkflows : this.publishedWorkflows,
                rewards : this.rewards
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
