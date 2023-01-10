//const PythonWorker = require("vfuse-python-worker")
const VFuse  = require('../build/index.min')

const main = async () => {
    let node = await VFuse.create({
        computation: false,
        localStorage: true,
        localPath: __dirname,
        bootstrapNode : true,
        SignalServer: true,
        HttpAPI: true,
        IPFSGateway: true,
        preferences: {
            MAX_CONCURRENT_JOBS : 1
        }
    })
}

main()
