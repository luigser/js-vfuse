const IPFS         = require("ipfs")
const Libp2p       = require('libp2p')
const TCP          = require('libp2p-tcp')
const { NOISE }    = require('libp2p-noise')
const MPLEX        = require('libp2p-mplex')
const process      = require('process')
const multiaddr    = require('multiaddr')
const pipe         = require('it-pipe')
const concat       = require('it-concat')
const WebSockets   = require('libp2p-websockets')
const MulticastDNS = require('libp2p-mdns')
const PeerId       = require('peer-id')
const IPFSRepo     = require('ipfs-repo')
const DatastoreFs  = require("datastore-fs")
const WebRTCDirect = require('libp2p-webrtc-direct')
const Bootstrap    = require('libp2p-bootstrap')

class VFuseGatewayNode
{
    constructor(options) {
        this.name = options.name;
    }

    libp2pBundle (opts){
        // Set convenience variables to clearly showcase some of the useful things that are available
        const hardcodedPeerId = PeerId.createFromJSON({
            "id": "12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m",
            "privKey": "CAESQAG6Ld7ev6nnD0FKPs033/j0eQpjWilhxnzJ2CCTqT0+LfcWoI2Vr+zdc1vwk7XAVdyoCa2nwUR3RJebPWsF1/I=",
            "pubKey": "CAESIC33FqCNla/s3XNb8JO1wFXcqAmtp8FEd0SXmz1rBdfy"
        })

        const peerId = opts.peerId
        const bootstrapList = opts.config.Bootstrap

        // Build and return our libp2p node
        // n.b. for full configuration options, see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md
        return new Libp2p({
            peerId : peerId,
            addresses: {
                // To signal the addresses we want to be available, we use
                // the multiaddr format, a self describable address
                listen: ['/ip4/0.0.0.0/tcp/0', '/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct'/*'/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star', '/ip4/127.0.0.1/tcp/10000/ws'*/]
            },
            modules: {
                transport: [TCP, WebRTCDirect],
                connEncryption: [NOISE],
                streamMuxer: [MPLEX],
                peerDiscovery: [ MulticastDNS ]
                },
                config: {
                    peerDiscovery: {
                        autoDial: true,
                        [Bootstrap.tag]: {
                            enabled: false,
                        },
                        mdns: {
                            interval: 20e3,
                            enabled: true
                        }
                    },
                    relay: {
                        enabled: true,
                        hop: {
                            enabled: true,
                            active: true
                        }
                    }
                }
         })
    }

    async create(){
        console.log("Node creation ...")
        const customRepositoryOptions = {
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

        /*const peerId = await PeerId.create();
        console.log("PeerId : " + peerId._idB58String)*/
        this.node = await IPFS.create({
            config : {
                Addresses: {
                    Api: "/ip4/127.0.0.1/tcp/5001",
                    Announce: [],
                    Gateway: "/ip4/127.0.0.1/tcp/8080",
                    NoAnnounce: [],
                    Swarm: [
                        "/ip4/0.0.0.0/tcp/4001",
                        "/ip6/::/tcp/4001",
                        '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star'
                    ],
                    SignalServer: '127.0.0.1:2000'
                },
                Discovery: {
                    MDNS : {
                        Enabled: true
                    }
                },
                Bootstrap : [],
                API : {
                    HTTPHeaders: {
                        "Access-Control-Allow-Headers": [
                            "X-Requested-With",
                            "Access-Control-Expose-Headers",
                            "Range"
                        ],   "Access-Control-Expose-Headers": [
                            "Location",
                            "Ipfs-Hash"
                        ],   "Access-Control-Allow-Methods": [
                            "POST",
                            "GET"
                        ],   "Access-Control-Allow-Origin": [
                            //"<your_domain or all (*)>"
                            "<*>"
                        ],   "X-Special-Header": [
                            "Access-Control-Expose-Headers: Ipfs-Hash"
                        ]
                    },
                    RootRedirect: "",
                    Writable: true,
                    PathPrefixes: [],
                    APICommands: []
                }
            },
            repo: new IPFSRepo ('./fs-repo/.ipfs/' + this.name, customRepositoryOptions),
            libp2p: this.libp2pBundle
        });

        await this.start()
        //GATEWAY
        console.log("Strating gateway")
        const Gateway = require('ipfs-http-gateway');
        const gateway = new Gateway(this.node);
        gateway.start();

    }

    async start()
    {
        //PROTOCOLS
        this.node.libp2p.handle(['/vfuse/channel/0.0.1/', '/vfuse/channel/0.0.2' ], async ({ protocol, stream }) => {

            if (protocol.indexOf('0.0.2')) {
                console.log('Received messages from 0.0.2 protocol')
            }

            pipe(
                stream,
                source => (async function () {
                    console.log(`Node ${this.node.libp2p.peerId.toB58String()} receive a message`)
                    for await (const msg of source) {
                        console.log(msg.toString())
                    }
                }.bind(this))()
            )
        })
    }

    discover(){
        this.node.libp2p.on('peer:discovery', (peer) => {
            console.log('Discovered:', peer/*peer.id.toB58String()*/)
            console.log(this.node.peerStore.addressBook.data)
            this.sendMessage(peer);
        })
    }

    async stop(){
        await this.node.stop()
        process.exit(0)
    }

    /*async sendMessage(node){
        let id;
        try {
            if (node instanceof VFuseNode)
                node = node.node;
            //this.node.peerStore.addressBook.set(vnode.node.peerId, vnode.node.multiaddrs)
            const {stream} = await this.node.libp2p.dialProtocol(node.libp2p.peerId, '/message/0.0.2')
            await pipe(
                ['Hello', 'I\'m node ' + this.node.libp2p.peerId.toB58String()],
                stream
            )
            console.log(`Node ${this.node.libp2p.peerId.toB58String()} has sent a message`)
        }catch(e){
            console.log(e);
        }
    }

    printAddrs()
    {
        console.log(`Node ${this.node.libp2p.peerId.toB58String()} started`)
        this.node.libp2p.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${this.node.libp2p.peerId.toB58String()}`))
    }*/
}

module.exports = VFuseGatewayNode;