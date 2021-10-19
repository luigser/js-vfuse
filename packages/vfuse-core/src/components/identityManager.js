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
        this.rewards   = 0.00

        this.eventManager.addListener('circuit_enabled', async function(){await this.checkProfile()}.bind(this))
    }

    async getProfile(id) {
        try {
            //For IPFS FILE MFS usagel
            let decoded_profile = await this.contentManager.get('/profiles/' + (!id ? this.id : id) + '.json')
            if(decoded_profile){
                let p = JSON.parse(decoded_profile)
                if(p.content) p.content = JSON.parse(p.content)
                this.rewards = p.rewards
                this.publishedWorkflows = p.publishedWorkflows
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
            rewards : this.rewards
        }
    }

    async createProfile(){
        try{
            //try to check if profile for you peerId already exist
            //if yes do not create no one but get it
            let profile = await this.getProfile(this.peerId)
            if(!profile){
                //Todo check if profile already exist, of yes remove and create from scratch
                let new_profile = {
                    publishedWorkflows : [],
                    rewards: 10.00
                }

                await this.contentManager.makeDir('/workflows')
                await this.contentManager.save("/profiles/" + this.peerId + '.json', JSON.stringify(new_profile)/*new TextEncoder().encode(JSON.stringify(new_profile))*/,
                    {create : true, parents: true, mode: parseInt('0775', 8), pin : true})
                this.id = this.peerId
                this.eventManager.emit('profile.ready', { status : true, profile : {...new_profile, ...{id : this.id}}  })
                console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', this.peerId)
            }else{
                this.id = this.peerId
                this.eventManager.emit('profile.ready', { status : true, profile : {...profile, ...{id : this.id}} })
            }
        }catch (e){
            this.eventManager.emit('profile.ready', { status : false, error : e})
            console.log('Got some error during the profile creation: %O', e)
        }
    }

    async addPublishedWorkflow(wid, name, cid){
        try{
            let filtered = this.publishedWorkflows.filter(pw => pw.id === wid)
            if(filtered.length > 0) return

            this.publishedWorkflows.push({id : wid, name : name, cid : cid})
            let new_profile = {
                publishedWorkflows : this.publishedWorkflows,
                rewards : this.rewards
            }
            await this.updateProfile(new_profile)
        }catch (e) {
            console.log('Got error during add published workflow operation : %O', e)
        }
    }

    async updateProfile(profile){
        try{
            await this.contentManager.save("/profiles/" + this.id + '.json', JSON.stringify(profile)/*new TextEncoder().encode(JSON.stringify(profile))*/,
                {create : true, parents: true, mode: parseInt('0775', 8), truncate: true, pin : true})
            console.log('Workflow successfully published in the profile')
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
