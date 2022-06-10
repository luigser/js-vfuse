const PythonWorker = require("vfuse-python-worker")

const VFuse  = require('vfuse-core')

const main = async () => {
    let node = await VFuse.create({
        bootstrapNode : true,
        SignalServer: true,
        HttpAPI: true,
        IPFSGateway: false,
        ipfs:{
            config: {
                Bootstrap: ['/ip4/193.205.161.5/tcp/4003/ws/p2p/12D3KooWS8x3JoxZazS8K1zDQGKGFoWQ1JX5u7enEPAeTM84YiDY']
            }
        },
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
       swarmKey: "/key/swarm/psk/1.0.0/\n" +
            "/base16/\n" +
            "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3"
    })
}

main()
