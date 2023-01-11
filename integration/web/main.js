import "../build/vfuse-web-bundle.js";

let options =  {
    localStorage: true,
    computation: true,
    maintainRunningState: false,
    preferences: {
        MAX_CONCURRENT_JOBS : 2
    },
    ipfs:{
        config: {
            Addresses : {
                Swarm: ['/dns4/193.205.161.5/tcp/2002/wss/p2p-webrtc-star/']
            },
            Bootstrap : ['/dns4/localhost/tcp/4002/wss/p2p/12D3KooWDNzDLuz5NfA44CJVPggGW9LGNELK6mucnHHoW82JdNmL']
        }
    },
    /*workers: [{
        worker : PythonWorker,
        packages : []
    }],*!/
    ipfsClusterApi : {host: '193.205.161.5', port: '9097', protocol: 'https'}*/
}
let node = await VFuse.create(options)
