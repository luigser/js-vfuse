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
        this.publishedWorkflows = []
    }

    async get() {
        try {
            //For IPFS FILE MFS usage
            let decoded_profile = await this.net.readFile('/profiles/' + this.id + '.json')
            //For common IPFS FILE api
            //let decoded_profile = await this.net.get(this.id , '/' + this.id + '.json')
            //let decoded_profile = await this.net.cat(this.id) //USE THIS
            if(decoded_profile){
                let p = JSON.parse(decoded_profile)
                if(p.content) p.content = JSON.parse(p.content)
                this.workflows = p.workflows
                this.rewards = p.rewards
                this.publishedWorkflows = p.publishedWorkflows
                console.log('Profile loaded : %O', p)
                //console.log(this.workflows[0].id)
            }
        }catch(e){
            console.log('Got some error during profile retrieving: %O', e)
        }
    }

    async create(){
        try{

            //Todo check if profile already exist, of yes remove and create from scratch
            let new_profile = {
                workflows: [],
                rewards: [],
                publishedWorkflows: []
            }

            /*let profile = {
                path: this.net.key[0].id + '.json',
                content : Buffer.from(JSON.stringify(new_profile))
            }*/

            await this.net.writeFile("/profiles/" + this.net.key[0].id + '.json', new TextEncoder().encode(JSON.stringify(new_profile)),
                {create : true, parents: true, mode: parseInt('0775', 8)})
            await this.net.pinFileInMFS("/profiles/" + this.net.key[0].id + '.json')

            this.id = this.net.key[0].id
            console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', this.id)

           /* let published_profile = await this.net.update(profile)
            if(published_profile){
                this.id = published_profile.name
                console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', published_profile.name)
                console.log('https://gateway.ipfs.io/ipns/%s',published_profile.name)
                console.log('https://ipfs.io%s',published_profile.value)
            }*/
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
            await this.update(new_profile)
            /* let profile = {
              path: this.id + '.json',
              content : JSON.stringify(new_profile)
            }*/
            //await this.net.update(profile)
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
            await this.update(new_profile)
            console.log('Workflow successfully published in the profile')
        }catch (e){
            console.log('Got some error during the profile publishing: %O', e)
        }
    }

    async update(profile){
        try{
            await this.net.writeFile("/profiles/" + this.id + '.json', new TextEncoder().encode(JSON.stringify(profile)))
            console.log('Workflow successfully published in the profile')
        }catch (e){
            console.log('Got some error during the profile publishing: %O', e)
        }

    }

    async addJob(workflowId, job){
        try {
            let workflow = this.workflows.filter(w => w.id === workflowId)
            if(workflow && workflow.length === 1)
                workflow[0].jobs.push(job)
            else
                throw 'Selected workflow do not exists'

            let new_profile = {
                workflows: this.workflows,
                rewards: this.rewards
            }

           /* let profile = {
                path: '/tmp/profile.json',
                content : JSON.stringify(new_profile)
            }*/

            await this.net.writeFile("/profiles/" + this.id + '.json', new TextEncoder().encode(JSON.stringify(new_profile)))
           //await this.net.update(profile)
           console.log('Job successfully added to profile')
        }catch (e){
            console.log('Got some error during adding a job in the profile: %O', e)
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
