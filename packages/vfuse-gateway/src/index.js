const PeerId       = require('peer-id')
const IPFSRepo     = require('ipfs-repo')
const DatastoreFs  = require("datastore-fs")
const VFuse        = require('vfuse-core')
const HttpApi      = require('ipfs-http-server')


class VFuseGateway{
    constructor(options) {
        this.customRepositoryOptions = {
            storageBackends: {
                root: DatastoreFs, // version and config data will be saved here
                blocks: DatastoreFs,
                keys: DatastoreFs,
                datastore: DatastoreFs
            },
            storageBackendOptions: {
                root: {
                    extension: '.ipfsroot', // Defaults to ''. Used by datastore-fs; Appended to all files
                    errorIfExists: false, // Used by datastore-fs; If the datastore exists, don't throw an error
                    createIfMissing: true // Used by datastore-fs; If the datastore doesn't exist yet, create it
                },
                blocks: {
                    sharding: false, // Used by IPFSRepo Blockstore to determine sharding; Ignored by datastore-fs
                    extension: '.ipfsblock', // Defaults to '.data'.
                    errorIfExists: false,
                    createIfMissing: true
                },
                keys: {
                    extension: '.ipfskey', // No extension by default
                    errorIfExists: false,
                    createIfMissing: true
                },
                datastore: {
                    extension: '.ipfsds', // No extension by default
                    errorIfExists: false,
                    createIfMissing: true
                }
            },
            //lock: fsLock
        }

        this.options = {
            mode: VFuse.Constants.VFUSE_MODE.GATEWAY,
            ipfsClusterApi : options.ipfsClusterApi,
            bootstrapNodes: options.bootstrapNodes,
            packages: [],
            ipfs: {
                repo: new IPFSRepo('./fs-repo/.ipfs/vfuse-gateway', this.customRepositoryOptions),
                config: {
                    Bootstrap: [],
                    Addresses: {
                        API: "/ip4/127.0.0.1/tcp/5001",
                        Swarm: [
                            "/ip4/127.0.0.1/tcp/4001",
                           /* "/ip6/127.0.0.1/tcp/4001",*/
                            "/ip4/127.0.0.1/udp/4001/quic",
                            /*"/ip6/127.0.0.1/udp/4001/quic",*/
                            "/ip4/127.0.0.1/tcp/4003/ws"
                        ],
                        Announce: [],
                        Gateway: "/ip4/127.0.0.1/tcp/8080",
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
                                "<*>"
                            ], "X-Special-Header": [
                                "Access-Control-Expose-Headers: Ipfs-Hash"
                            ]
                        },
                        RootRedirect: "",
                        Writable: true,
                        PathPrefixes: [],
                        APICommands: []
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
                        Writable: false
                    },
                    Ipns: {
                        RecordLifetime: "",
                        RepublishPeriod: "",
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
                        EnableRelayHop: false,
                        Transports: {
                            Multiplexers: {},
                            Network: {},
                            Security: {}
                        }
                    }
                }
            }
        }

    }

    async init(){
        this.node = await VFuse.create(this.options)

        const Gateway = require('ipfs-http-gateway');
        this.gateway = new Gateway(this.node.net.ipfs);
        await this.gateway.start();
        console.log('Gateway started')

        console.log('Http API Server started')
        const httpApi = new HttpApi(this.node.net.ipfs)
        this.httpApi = await httpApi.start()

        if (this.httpApi._apiServers.length) {
            await this.node.net.ipfs.repo.apiAddr.set(this.httpApi._apiServers[0].info.ma)
        }
    }

    async createWorkflow(){
        await this.node.createWorkflow()
    }

    async addJob(job){
        await this.node.addJob(job)
    }

    static async create (options = {}) {
        const vFuseGateway = new VFuseGateway(options)
        await vFuseGateway.init()
        return vFuseGateway
    }
}

module.exports = VFuseGateway