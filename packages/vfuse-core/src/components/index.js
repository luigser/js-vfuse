'use strict'

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
        await this.net.start()
        await this.profile.checkProfile()
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