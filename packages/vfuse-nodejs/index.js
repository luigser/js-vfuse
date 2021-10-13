const VFuse = require('vfuse-core')

const main = async () => {
    let node = await VFuse.create({
        profileId : '12D3KooWERW7UyQFdwovQjLbGrTSHDwRqo8HvBwVsUcHDvRCsaGd',
        SignalServer: false,
        HttpAPI: false,
        IPFSGateway: false,
        swarmKey: "/key/swarm/psk/1.0.0/\n" +
            "/base16/\n" +
            "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3",
        ipfs: {
            config: {
                Bootstrap: ['/ip4/192.168.1.57/tcp/4001/p2p/12D3KooWC5LReZk9uVHpCcXYpEm4UfLBzSvSsNpLosC7p3XbBwGC']
            }
        }
    })
}

main()
