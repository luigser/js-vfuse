const { create } = require('./components')
const getPrivateKey = require('./utils/ipfs-swarm-key-gen')
const Constants = require('./components/constants')

module.exports = {
    create,
    getPrivateKey,
    Constants
}
