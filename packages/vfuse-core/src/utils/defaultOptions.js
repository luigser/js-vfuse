const Repo = require('./ipfsRepo')
const lodash = require('lodash')

module.exports = {

    getGatewayOptions : (options) => {
        return lodash.merge({
            ipfsClusterApi: {},
            bootstrapNodes: [],
            packages: [],
            ipfs: {
                repo: Repo,
                config: {
                    Bootstrap: [/*'/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWD9GpdKboHZ87s8FeVmaPqH5sCqpFvvB77TuCCtKVBdnE'*/],
                    Addresses: {
                        API: "/ip4/0.0.0.0/tcp/5001",
                        Swarm: [
                            "/ip4/0.0.0.0/tcp/4001",
                            "/ip4/127.0.0.1/tcp/4003/ws",
                            //options.SignalServer ? '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star' : '',
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
            }
        },
        options)
    },
    getBrowserOptions : (options) => {
        return lodash.merge({
            swarmKey: "/key/swarm/psk/1.0.0/\n" +
                "/base16/\n" +
                "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3",
            ipfs: {
                pass: "01234567890123456789",
                config: {
                    Addresses: {
                        Swarm: [
                            /*// This is a public webrtc-star server
                            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                            '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star',*/
                            '/ip4/127.0.0.1/tcp/2000/wss/p2p-webrtc-star',
                            //'/ip4/0.0.0.0/tcp/2000/ws/p2p-webrtc-star',
                        ],
                        // Delegates: ["/ip4/127.0.0.1/tcp/8080"]
                    },
                    Swarm: {
                        EnableRelayHop: true
                    },
                    Bootstrap: [
                        //'/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star/p2p/12D3KooWMqNSWNH95gZMAEhymuirCBNnfWeFDTAM8davwRGQncrv'
                    ],
                     Discovery: {
                         MDNS: {
                             Enabled: true
                         },
                         webRTCStar: {
                             Enabled: true
                         }
                     },
                }
            },
            //libp2p: {addresses: {listen: ['/ip4/0.0.0.0/tcp/2000/ws/p2p-webrtc-star']}},
            ipfsClusterApi: {host: 'localhost', port: '9094', protocol: 'http'},
            ipfsClientOptions: {host: 'localhost', port: '5001', protocol: 'http'}
        },
        options)
    }

}
