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

    async checkProfile(){
        const content = []
        try {
            if(this.id){
                let ipfs_profile = ""
                for await (const name of this.net.ipfs.name.resolve('/ipns/' + this.id)) {
                    ipfs_profile = name
                    console.log(name)
                }

                for await (const file of this.net.ipfs.get(ipfs_profile)) {
                    if (!file.content) continue;
                    for await (const chunk of file.content) {
                        content.push(chunk)
                    }
                }
                if (content.length > 0) {
                    let p = JSON.parse(content)
                    this.wokflows = p.wokflows
                    this.rewards  = p.rewards
                    console.log('Profile loaded : %O', p)
                }else
                    throw new Error("Got some error during profile retrieving")

            } else {
                let new_profile = {
                    workflows: [],
                    rewards: []
                }
                let profile = {
                    path: 'profile.json',
                    content : JSON.stringify(new_profile)
                }
                let remote_profile = await this.net.ipfs.add(profile)
                let published_profile = await this.net.ipfs.name.publish(remote_profile.cid.string)
                this.id = published_profile.name
                console.log('New remote profile created\nPreserve your PROFILE ID: %s\n', published_profile.name)
                console.log('https://gateway.ipfs.io/ipns/%s',published_profile.name)
                console.log('https://ipfs.io%s',published_profile.value)
            }
        }catch(e){
            log('Got some error during profile retrieving: %O', e)
        }
    }
}
module.exports = Profile