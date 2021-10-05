'use strict'

const log = require('debug')('vfuse:profile')

class IdentityManager {
    /**
     * @param {Object} networkManager
     * @param {Object} options
     */
    constructor ( contentManager, options) {
        this.id = options.profileId ? options.profileId : null
        this.peerId = options.peerId
        this.contentManager = contentManager
        this.workflows = []
        this.rewards   = []
        this.publishedWorkflows = []
    }

    async getProfile(id) {
        try {
            //For IPFS FILE MFS usage
            let decoded_profile = await this.contentManager.get('/profiles/' + (!id ? this.id : id) + '.json')
            if(decoded_profile){
                let p = JSON.parse(decoded_profile)
                if(p.content) p.content = JSON.parse(p.content)
                this.workflows = p.workflows
                this.rewards = p.rewards
                this.publishedWorkflows = p.publishedWorkflows
                console.log('Profile loaded : %O', p)
                //console.log(this.workflows[0].id)
                return true
            }else{
                return false
            }
        }catch(e){
            console.log('Got some error during profile retrieving: %O', e)
            return false
        }
    }

    getCurrentProfile(){
        return {
            id: this.id,
            workflows : this.workflows,
            rewards : this.rewards,
            publishedWorkflows : this.publishedWorkflows
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
                    workflows: [],
                    rewards: [],
                    publishedWorkflows: []
                }

                await this.contentManager.save("/profiles/" + this.peerId + '.json', new TextEncoder().encode(JSON.stringify(new_profile)),
                    {create : true, parents: true, mode: parseInt('0775', 8), pin : true})
                this.id = this.peerId
                console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', this.peerId)
            }else{
                this.id = this.peerId
            }
        }catch (e){
            console.log('Got some error during the profile creation: %O', e)
        }
    }

    async addWorkflow(workflow){
        try {
            //todo define strategy for rewarding users
            //this.rewards.push(rewards)
            this.workflows.push(workflow)
            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards,
                publishedWorkflows : this.publishedWorkflows
            }
            await this.updateProfile(new_profile)
            console.log('Workflow successfully added in the profile')
        }catch (e){
            console.log('Got some error during the profile creation: %O', e)
        }
    }

    async publishWorkflow(workflow_id){
        try{
            this.publishedWorkflows.push(workflow_id)
            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards,
                publishedWorkflows : this.publishedWorkflows
            }
            await this.updateProfile(new_profile)
            console.log('Workflow successfully published in the profile')
        }catch (e){
            console.log('Got some error during the profile publishing: %O', e)
        }
    }

    async updateProfile(profile){
        try{
            await this.contentManager.save("/profiles/" + this.id + '.json', new TextEncoder().encode(JSON.stringify(profile)))
            console.log('Workflow successfully published in the profile')
        }catch (e){
            console.log('Got some error during the profile publishing: %O', e)
        }

    }

    async updateWorkflow(workflowId, name, code, language){
        try {
            let workflow = this.workflows.filter(w => w.id === workflowId)
            if(workflow && workflow.length === 1) {
                workflow[0].name = name
                workflow[0].code = code
                workflow[0].language = language
            }else
                throw 'Selected workflow do not exists'

            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards,
                publishedWorkflows : this.publishedWorkflows
            }
            await this.contentManager.save("/profiles/" + this.id + '.json', new TextEncoder().encode(JSON.stringify(new_profile)))
            console.log('Workflow successfully updated')
        }catch (e){
            console.log('Got some error during updating the workflow: %O', e)
        }
    }

    getWorkflow(workflowId){
        try {
            let workflow = this.workflows.filter(w => w.id === workflowId)
            if (workflow && workflow.length === 1)
                return workflow[0]
            else
                throw 'Selected workflow do not exists'
        }catch (e){
            console.log('Got some error during workflow retrieving : %O', e)
            return null
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
