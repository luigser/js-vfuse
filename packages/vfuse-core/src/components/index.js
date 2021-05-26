'use strict'
const log = require('debug')('vfuse:node')
const Network = require('./network')
const Profile = require('./profile')

class VFuse {
    /**
     * @param {Object} config
     * @param {Options} config.options
     */
    constructor({options}) {
        this.net = new Network(options)
        this.profile = new Profile(this.net, options)
    }

    async start(){
        console.log('Strating VFuse node...')
        await this.net.start()
        await this.profile.checkProfile()
    }

    async stop(){
        console.log('Stopping VFuse node...')
        await this.net.stop()
    }

    /**
     * @param {Options} options
     */
    static async create (options = {}) {

        const vfuse = new VFuse({
            options : options
        })

        await vfuse.start()
        return vfuse
    }
}

module.exports = VFuse