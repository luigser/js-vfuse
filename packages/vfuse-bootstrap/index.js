const PythonWorker = require("vfuse-python-worker")

const VFuse  = require('vfuse-core')

const main = async () => {
    let node = await VFuse.create({
        bootstrapNode : true,
        SignalServer: true,
        HttpAPI: true,
        IPFSGateway: false,
        /*ipfs:{
            config:{
                Addresses: {
                    Swarm: ['/ip4/192.168.1.57/tcp/443/wss/p2p-circuit']
                }
            }
        }*/
        /*runtime: {
            language : VFuse.Constants.PROGRAMMING_LANGUAGE.PYTHON,
            worker : PythonWorker,
            packages : []
        },*/
       /* swarmKey: "/key/swarm/psk/1.0.0/\n" +
            "/base16/\n" +
            "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3"*/
    })
}

main()
