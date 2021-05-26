'use strict'

const Service = require('../utils/service')

/**
 * @param {Object} config
 */
module.exports = (network, options ) => {
    const start = async () => {
       await Service.start(network, {
            options
        })
    }

    return start
}
