const VFuse  = require('vfuse-core')

const main = async () => {
    let node = await VFuse.create({
        profileId : '12D3KooWHsK8UgvRfUANT8o7KyRJfX3sXKQQnqZ67uVnQn6nudQR',
        SignalServer: true,
        HttpAPI: true,
        IPFSGateway: true,
        swarmKey: "/key/swarm/psk/1.0.0/\n" +
            "/base16/\n" +
            "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3"
    })
}

main()
