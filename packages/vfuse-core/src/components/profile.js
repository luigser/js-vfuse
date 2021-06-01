'use strict'

const log = require('debug')('vfuse:profile')

class Profile {
    /**
     * @param {Object} network
     * @param {Object} options
     */
    constructor ( network, options) {
        this.id = options.profileId ? options.profileId : null
        this.net = network
        this.workflows = []
        this.rewards   = []
    }

    async get() {
        try {
            let decoded_profile = await this.net.get(this.id)
            if(decoded_profile){
                let p = JSON.parse(decoded_profile)
                this.workflows = p.workflows
                this.rewards = p.rewards
                log('Profile loaded : %O', p)
            }
        }catch(e){
            console.log('Got some error during profile retrieving: %O', e)
        }
    }

    async create(){
        try{
            let new_profile = {
                workflows: [],
                rewards: []
            }
            let profile = {
                path: 'profile.json',
                content : JSON.stringify(new_profile)
            }
            let published_profile = await this.net.create(profile)
            if(published_profile){
                this.id = published_profile.name
                console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', published_profile.name)
                console.log('https://gateway.ipfs.io/ipns/%s',published_profile.name)
                console.log('https://ipfs.io%s',published_profile.value)
            }
        }catch (e){
            console.log('Got some error during the profile creation: %O', e)
        }
    }

    async createWorkflow(workflow){
        try {
            workflow.id = this.workflows.length
            this.workflows.push(workflow)
            //todo define strategy for rewarding users
            //this.rewards.push(rewards)
            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards
            }
            await this.net.update(new_profile)
            console.log('Workflow successfully added')
        }catch (e){
            console.log('Got some error during the profile cretion: %O', e)
        }
    }

    async addJob(workflowId, job){
        try {
            job.id = this.workflows[workflowId].jobs.length
            this.workflows[workflowId].jobs.push(job)
            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards
            }
           await this.net.update(new_profile)
           console.log('Job successfully added')
        }catch (e){
            console.log('Got some error during adding a job: %O', e)
        }
    }

    getWorkflow(workflowId){
        return this.workflows[workflowId]
    }

    async check(){
        try {
            if(this.id){
                await this.get()
            } else {
                await this.create()
            }
        }catch(e){
            console.log('Got some error during profile checking: %O', e)
        }
    }
}
module.exports = Profile