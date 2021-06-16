const VFuseGateway = require('./src')

const main = async () => {
    let node = await VFuseGateway.create({
        profileId : 'QmU13jxZXrTmpgodotGGNMdCre2BKfmqPyHdHWGh7vmJ5e'
    })
    console.log(node.node.profile)
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
    let stat = await node.node.net.stat('/workflows/1/jobs')
    console.log({stat})
}

main()