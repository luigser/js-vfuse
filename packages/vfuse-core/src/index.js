const { create } = require('./components')
const getPrivateKey = require('./utils/ipfs-swarm-key-gen')
const Constants = require('./components/constants')
const Miscellaneous = require('./utils/miscellaneous')

module.exports = {
    create,
    getPrivateKey,
    Constants,
    Miscellaneous
}
