const { generate } = require('libp2p/src/pnet')

exports = module.exports = function getSwarmKey(){
    const swarmKey = new Uint8Array(95)
    generate(swarmKey);
    return swarmKey;
}
