const {createRepo}     = require('ipfs-repo')
const DatastoreFS  = require("datastore-fs")
const BlockstoreDatastoreAdapter = require('blockstore-datastore-adapter')
const VFuse        = require('vfuse-core')
const HttpApi      = require('ipfs-http-server')

//todo
//When a new gateway wont to be added in VFuse it have to update an pinned ipfs file when all gateway nodes are registered

class VFuseGateway{
    constructor(options) {

        this.codecs = [
            require('@ipld/dag-pb'),
            require('@ipld/dag-cbor'),
            require('multiformats/codecs/raw')
        ].reduce((acc, curr) => {
            acc[curr.name] = curr
            acc[curr.code] = curr

            return acc
        }, {})

        this.loadCodec = (nameOrCode) => {
            if (this.codecs[nameOrCode]) {
                return this.codecs[nameOrCode]
            }

            throw new Error(`Could not load codec for ${nameOrCode}`)
        }

        this.repoPath = 'fs-repo'

        this.customRepositoryOptions = {
            root: new DatastoreFS(this.repoPath, {
                extension: '.ipfsroot', // Defaults to '', appended to all files
                errorIfExists: false, // If the datastore exists, don't throw an error
                createIfMissing: true // If the datastore doesn't exist yet, create it
            }),
            // blocks is a blockstore, all other backends are datastores - but we can wrap a datastore
            // in an adapter to turn it into a blockstore
            blocks: new BlockstoreDatastoreAdapter(
                new DatastoreFS(`${this.repoPath}/blocks`, {
                    extension: '.ipfsblock',
                    errorIfExists: false,
                    createIfMissing: true
                })
            ),
            keys: new DatastoreFS(`${this.repoPath}/keys`, {
                extension: '.ipfskey',
                errorIfExists: false,
                createIfMissing: true
            }),
            datastore: new DatastoreFS(`${this.repoPath}/datastore`, {
                extension: '.ipfsds',
                errorIfExists: false,
                createIfMissing: true
            }),
            pins: new DatastoreFS(`${this.repoPath}/pins`, {
                extension: '.ipfspin',
                errorIfExists: false,
                createIfMissing: true
            }),
            ipns: new DatastoreFS(`${this.repoPath}/ipns`, {
                extension: '.ipfsipns',
                errorIfExists: false,
                createIfMissing: true
            }),
            ipfs: new DatastoreFS(`${this.repoPath}/ipfs`, {
                extension: '.ipfsipfs',
                errorIfExists: false,
                createIfMissing: true
            })
        }

        this.options = {
            mode: VFuse.Constants.VFUSE_MODE.GATEWAY,
            signalServerEnabled : options.signalServerEnabled || false,
            ipfsClusterApi : options.ipfsClusterApi || {},
            bootstrapNodes: options.bootstrapNodes || [],
            packages: [],
            swarmKey: options.swarmKey,
            ipfs: {
                repo: createRepo('./fs-repo/.ipfs/vfuse-gateway', this.loadCodec, this.customRepositoryOptions),
                config: {
                    Bootstrap:  [/*'/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWD9GpdKboHZ87s8FeVmaPqH5sCqpFvvB77TuCCtKVBdnE'*/],
                    Addresses: {
                        API: "/ip4/127.0.0.1/tcp/5001",
                        Swarm: [
                            //"/ip4/127.0.0.1/tcp/4001",
                            "/ip4/127.0.0.1/tcp/4001/ws",
                            '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star',
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
        }

    }

    async init(){
        this.node = await VFuse.create(this.options)

        const Gateway = require('ipfs-http-gateway');
        this.gateway = new Gateway(this.node.net.ipfs);
        await this.gateway.start();
        console.log('Gateway started')

        this.httpApi = new HttpApi(this.node.net.ipfs)
        await this.httpApi.start()
        console.log('Http API Server started')
        if (this.httpApi._apiServers.length) {
            await this.node.net.ipfs.repo.setApiAddr(this.httpApi._apiServers[0].info.ma)
        }
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
