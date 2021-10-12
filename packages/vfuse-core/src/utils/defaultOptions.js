const Repo = require('./ipfsRepo')

module.exports = {

    getGatewayOptions : (options) => {
        return {
            signalServerEnabled : false,
            ipfsClusterApi : {},
            bootstrapNodes: [],
            packages: [],
            ipfs: {
                repo: Repo,
                config: {
                    Bootstrap:  [/*'/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWD9GpdKboHZ87s8FeVmaPqH5sCqpFvvB77TuCCtKVBdnE'*/],
                    Addresses: {
                        API: "/ip4/0.0.0.0/tcp/5001",
                        Swarm: [
                            //"/ip4/127.0.0.1/tcp/4001",
                            "/ip4/0.0.0.0/tcp/4001/ws",
                            '/ip4/0.0.0.0/tcp/2000/ws/p2p-webrtc-star',
                        ],
                        Announce: [],
                        Gateway: "/ip4/0.0.0.0/tcp/8080",
                        Delegates: []
                    },
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
                    Routing: {
                        Type: "dht"
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
                        EnableAutoRelay: true,
                        EnableRelayHop: true,
                        /* Transports: {
                             Multiplexers: {},
                             Network: {},
                             Security: {}
                         }*/
                    }
                }
            },
            ...options
        }
    },
    getBrowserOptions : (options) => {
        return {
            swarmKey: "/key/swarm/psk/1.0.0/\n" +
                "/base16/\n" +
                "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3",
            ipfs:{
                pass: "01234567890123456789",
                config:{
                    Addresses: {
                        Swarm: [
                            '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star',//UNCOMMENT FOR CUSTOM GATEWAY VERSION
                            //'/ip4/127.0.0.1/tcp/4001/ws'
                        ],
                        // Delegates: ["/ip4/127.0.0.1/tcp/8080"]
                    },
                    Swarm: {
                        EnableRelayHop: true
                    },
                    Bootstrap:  [
                        //'/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star/p2p/12D3KooWMqNSWNH95gZMAEhymuirCBNnfWeFDTAM8davwRGQncrv'
                    ],
                    /* Discovery: {
                         MDNS: {
                             Enabled: false
                         },
                         webRTCStar: {
                             Enabled: false
                         }
                     },*/
                }
            },
            libp2p : { addresses : { listen : ['/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star'] }},
            ipfsClusterApi : { host: 'localhost', port: '9094', protocol: 'http' },
            ipfsClientOptions :{ host: 'localhost', port: '5001', protocol : 'http' },
            ...options
        }
    }

}
