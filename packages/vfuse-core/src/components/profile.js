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
            let decoded_profile = await this.net.get(this.id , "/profile.json")
            if(decoded_profile){
                let p = JSON.parse(decoded_profile)
                this.workflows = p.workflows
                this.rewards = p.rewards
                console.log('Profile loaded : %O', p)
                console.log(this.workflows[0].id)
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
                path: '/tmp/profile.json',
                content : JSON.stringify(new_profile)
            }

            let published_profile = await this.net.update(profile)
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

    async addWorkflow(workflow){
        try {
            //todo define strategy for rewarding users
            //this.rewards.push(rewards)
            this.workflows.push(workflow)
            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards
            }
            let profile = {
                path: '/tmp/profile.json',
                content : JSON.stringify(new_profile)
            }

            await this.net.update(profile)
            console.log('Workflow successfully added in the profile')
        }catch (e){
            console.log('Got some error during the profile cretion: %O', e)
        }
    }

    async addJob(workflowId, job){
        try {
            job.id = this.workflows[workflowId].jobs.length
            let results = {
                path: "/tmp/" + workflowId + '-' + job.id + '.json',
                content : JSON.stringify({
                    metrics : [],
                    results : []
                })
            }
            job.results = await this.net.update(results)
            this.workflows[workflowId].jobs.push(job)

            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards
            }

            let profile = {
                path: '/tmp/profile.json',
                content : JSON.stringify(new_profile)
            }
           await this.net.update(profile)
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