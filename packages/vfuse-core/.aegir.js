/*'use strict'
const VFuse = require('./src')

const options = {
    id: null,
    discoveryCallback : () => {},
    connectionCallback: () => {},
    getMessageFromProtocolCallback : () => {},
    bootstrapNodes : null,
    packages: null
}

async function before () {
    const node = new VFuse.create(options)
    return node
}

async function after () {
    process.exit(0)
}

module.exports = {
    hooks: {
        pre: before,
        post: after
    }
}*/
// file: .aegir.js


/** @type {import('aegir').PartialOptions} */
module.exports = {
    tsRepo: false,
    release: {
        build: false
    }
}