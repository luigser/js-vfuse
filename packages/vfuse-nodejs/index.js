const VFuse = require('vfuse-core')

const main = async () => {
    let node = await VFuse.create({
        bootstrapNode : true,
        SignalServer: false,
        HttpAPI: true,
        IPFSGateway: true,
        ipfs: {
            config: {
                Bootstrap: ['/ip4/192.168.1.57/tcp/4003/ws/p2p/12D3KooWD87Hx9e4ENMyf7hZPA3bgiyP4pDeRKL2q8dFtF6MEQZ3']
            }
        }
    })
}

main()
