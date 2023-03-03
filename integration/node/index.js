//const PythonWorker = require("vfuse-python-worker")
const VFuse  = require('../build/vfuse-node-bundle')
const path = require('path')

const main = async () => {
    let node = await VFuse.create({
        proxy: {
            certs : {
                keyPemFile : path.join('.', 'certs','key.pem'),
                certPemFile : path.join('.', 'certs','cert.pem')
            }
        },
        computation: true,
        localStorage: true,
        localPath: __dirname,
        bootstrapNode : true,
        SignalServer: true,
        HttpAPI: true,
        IPFSGateway: false,
        preferences: {
            MAX_CONCURRENT_JOBS : 1
        }
    })
}

main()
