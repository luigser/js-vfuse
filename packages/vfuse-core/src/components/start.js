'use strict'

const Service = require('../utils/service')

/**
 * @param {Object} config
 */
module.exports = ({ network, options }) => {
    const start = async () => {
        const { bitswap, libp2p } = await Service.start(network, {
            options
        })
    }

    return start
}
