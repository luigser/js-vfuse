//const Repo = require('./ipfsRepo')
const lodash = require('lodash')

module.exports = {

    getBootstrapOptions : (options) => {
        return lodash.merge({
            computation : false,
            maintainRunningState : true,
            proxy:{
                bootstrap: {
                    wsPort : 4003,
                    wsProxyPort : 4002
                },
                pinning:{
                    port: 9094,
                    proxyPort : 9097
                },
                signal:{
                    port: 2001,
                    proxyPort : 2002
                },
                certs:{
                    verify : false
                }
            },
            ipfsClusterApi: {},
            packages: [],
            ipfs: {
                preload: {
                    enabled: false
                },
                repo: 'vfuse-repo',//Repo,
                config: {
                    Datastore: {
                        StorageMax: "30GB",
                        StorageGCWatermark: 90,
                        GCPeriod: "1h",
                        Spec: {
                            mounts: [
                                {
                                    child: {
                                       path: "blocks",
                                       shardFunc: "/repo/flatfs/shard/v1/next-to-last/2",
                                       sync: true,
                                       type: "flatfs"
                                    },
                                    mountpoint: "/blocks",
                                    prefix: "flatfs.datastore",
                                    type: "measure"
                                },
                                {
                                    child: {
                                        compression: "none",
                                        path: "datastore",
                                        type: "levelds"
                                    },
                                    mountpoint: "/",
                                    prefix: "leveldb.datastore",
                                    type: "measure"
                                }
                            ],
                            type: "mount"
                        },
                        HashOnRead: false,
                        BloomFilterSize: 0
                    },
                    Bootstrap: options.ipfs && options.ipfs.config && options.ipfs.config.Bootstrap ? options.ipfs.config.Bootstrap : [],
                    Addresses: {
                        API: "/ip4/0.0.0.0/tcp/5001",
                        Swarm: [
                            "/ip4/0.0.0.0/tcp/4001",
                            "/ip4/0.0.0.0/tcp/4003/ws",
                            //"/ip4/0.0.0.0/tcp/4002/wss",
                            //'/ip4/0.0.0.0/tcp/2000/ws/p2p-webrtc-star'
                            //options.SignalServer ? options.SignalServer : '/ip4/192.168.1.57/tcp/2000/ws/p2p-webrtc-star/',
                            //'/ip4/0.0.0.0/tcp/2000/http/p2p-webrtc-direct'
                        ],
                        Announce: [],
                        Gateway: "/ip4/0.0.0.0/tcp/8080",
                        Delegates: []
                    },
                    Mounts: {
                        IPFS: "/ipfs",
                        IPNS: "/ipns",
                        FuseAllowOther: false
                    },
                    Routing: {
                        Type: "dht"
                    },
                    /*Protocols: [
                        "/ipfs/bitswap",
                        "/ipfs/bitswap/1.0.0",
                        "/ipfs/bitswap/1.1.0",
                        "/ipfs/bitswap/1.2.0",
                        "/ipfs/id/1.0.0",
                        "/ipfs/id/push/1.0.0",
                        "/ipfs/lan/kad/1.0.0",
                        "/ipfs/ping/1.0.0",
                        "/libp2p/autonat/1.0.0",
                        "/libp2p/circuit/relay/0.1.0",
                        "/p2p/id/delta/1.0.0",
                        "/x/"
                    ],*/
                    API: {
                        HTTPHeaders: {
                            "Access-Control-Allow-Headers": [
                                "X-Requested-With",
                                "Access-Control-Expose-Headers",
                                "Range"
                            ], "Access-Control-Expose-Headers": [
                                "Location",
                                "Ipfs-Hash"
                            ], "Access-Control-Allow-Methods": [
                                "POST",
                                "GET"
                            ], "Access-Control-Allow-Origin": [
                                //"<your_domain or all (*)>"
                                "*"
                            ], "X-Special-Header": [
                                "Access-Control-Expose-Headers: Ipfs-Hash"
                            ]
                        },
                        RootRedirect: "",
                        Writable: true,
                        PathPrefixes: [],
                        //APICommands: ["dht/findprovs", "dht/findpeer", "refs", "swarm/connect"]
                    },
                    Gateway: {
                        APICommands: [],
                        HTTPHeaders: {
                            "Access-Control-Allow-Headers": [
                                "X-Requested-With",
                                "Range",
                                "User-Agent"
                            ],
                            "Access-Control-Allow-Methods": [
                                "GET"
                            ],
                            "Access-Control-Allow-Origin": [
                                "*"
                            ]
                        },
                        NoDNSLink: false,
                        NoFetch: false,

                        PathPrefixes: [],
                        PublicGateways: null,
                        RootRedirect: "",
                        Writable: true
                    },
                    Ipns: {
                        /*RecordLifetime: "",
                        RepublishPeriod: "",*/
                        ResolveCacheSize: 128
                    },
                    Swarm: {
                        AddrFilters: null,
                        ConnMgr: {
                            GracePeriod: "20s",
                            HighWater: 900,
                            LowWater: 600,
                            Type: "basic"
                        },
                        DisableBandwidthMetrics: false,
                        DisableNatPortMap: false,
                        DisableRelay: false,
                        EnableAutoRelay: true,//false,
                        EnableRelayHop: true,
                        /* Transports: {
                             Multiplexers: {},
                             Network: {},
                             Security: {}
                         }*/
                    },
                    Discovery: {
                        MDNS: {
                            Enabled: true,
                            Interval : 10
                        },
                        webRTCStar: {
                            Enabled: true
                        }
                    },
                }
            }
        },
        options)
    },
    getBrowserOptions : (options) => {
        return lodash.merge({
         /*   swarmKey: "/key/swarm/psk/1.0.0/\n" +
                "/base16/\n" +
                "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3",*/
            computation : true,
            localStorage : true,
            maintainRunningState : true,
            ipfs: {
                preload: {
                    enabled: false
                },
                repo: 'vfuse-browser-repo',
                //pass: "01234567890123456789",
                config: {
                    Addresses: {
                       /* Swarm: [
                            /!*!// This is a public webrtc-star server
                            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                            '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star',*!/
                            //'/ip4/0.0.0.0/tcp/9090/http/p2p-webrtc-direct/p2p/',
                            //'/ip4/0.0.0.0/tcp/2000/ws/p2p-webrtc-star',
                        ],*/
                        //Delegates: options.ipfs.config.Bootstrap
                    },
                    Swarm: {
                        "ConnMgr": {
                            LowWater: 256,
                            HighWater: 512,
                        },
                        EnableAutoRelay: true,
                        EnableRelayHop: true,//false,
                    },
                    Bootstrap: options.ipfs.config.Bootstrap,
                    Discovery: {
                         MDNS: {
                             Enabled: true
                         },
                         webRTCStar: {
                             Enabled: true
                         }
                     },
                    Pubsub:{
                        enabled : true
                    }
                }
            },
            //libp2p: {addresses: {listen: ['/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star']}},
        },
        options)
    }

}
