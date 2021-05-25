'use strict'

const Network = require('./network')

class VFuse {
    /**
     * @param {Object} config
     * @param {Options} config.options
     */
    constructor({options}) {
        this._network = new Network({
            peerId : options.peerId,
            bootstrapNodes : options.bootstrapNodes
        })
    }

    async start(){
       this._network.start()
    }

    /**
     * @param {Options} options
     */
    static async create (options = {}) {
        options = {
            ...getDefaultOptions(),
            ...options
        }

        const vfuse = new VFuse({
            options : options
        })

        await vfuse.start()
        return vfuse
    }
}

const getDefaultOptions = () => ({
    bootstrapNodes : [
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
    ]

})