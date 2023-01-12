//const PythonWorker = require("vfuse-python-worker")
const VFuse  = require('../build/vfuse-node-bundle')

const main = async () => {
    let node = await VFuse.create({
        proxy: null,
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
