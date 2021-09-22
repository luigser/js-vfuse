const VFuseGateway = require('./src')

const main = async () => {
    let node = await VFuseGateway.create({
       // profileId : 'QmU13jxZXrTmpgodotGGNMdCre2BKfmqPyHdHWGh7vmJ5e',
        signalServerEnabled: true,
        //ipfsClusterApi : '/ip4/127.0.0.1/tcp/9096',
        swarmKey: "/key/swarm/psk/1.0.0/\n" +
            "/base16/\n" +
            "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3",
        /*ipfs: {
            config: {
                Identity: {
                    PeerID: "12D3KooWD9GpdKboHZ87s8FeVmaPqH5sCqpFvvB77TuCCtKVBdnE",
                    PrivKey: "CAESQL+jpzKMsryufLsv5J6UuFWvCm9Sb4Ce1wyES7yMTiSVMWsM6hL8cneash1ObQoe/VmucfQ39EFQVwMiZ61e+R8="
                }
            }
        }*/
    })
    //console.log(node.node.profile)
    //await node.createWorkflow()
    /*await node.addJob(
        0,
        `import numpy as np
a = [[22, 0], [0, 2]]
b = [[41, 1], [28, 2]]
c = np.dot(a, b)
print(c)`,
        [],
        []
    )*/
    /*let stat = await node.node.net.stat('/workflows/1/jobs')
    console.log({stat})*/
}

main()
