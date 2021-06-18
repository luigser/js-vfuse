const VFuseGateway = require('./src')

const main = async () => {
    let node = await VFuseGateway.create({
       // profileId : 'QmU13jxZXrTmpgodotGGNMdCre2BKfmqPyHdHWGh7vmJ5e',
        bootstrapNodes : ['/ip4/192.168.1.57/tcp/9096/p2p/12D3KooWPgiEiS6p73rSi5peTvo16SKaiU4y4pYBri8wjQmjpGbE'],
        ipfsClusterApi : '/ip4/192.168.1.57/tcp/9096'
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