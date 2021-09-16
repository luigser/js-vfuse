'use strict'

const IPFS = require('ipfs')
const Bootstrap = require('libp2p-bootstrap')
const Noise = require('libp2p-noise')
const WebSockets = require('libp2p-websockets')
const Mplex = require('libp2p-mplex')
const TCP = require('libp2p-tcp')
const filters = require('libp2p-websockets/src/filters')
/*const WebRTCDirect = require('libp2p-webrtc-direct')
const WebRTCStar = require('libp2p-webrtc-star')
const Gossipsub = require('libp2p-gossipsub')
const PeerId = require('peer-id')
const wrtc = require('wrtc')*/
const Protector = require('libp2p/src/pnet')
const toString = require('uint8arrays/to-string')
const fromString = require('uint8arrays/from-string')
const ipfsCluster = require('ipfs-cluster-api')
const Constants = require("./constants");

class Network {
    /**
     * @param {Object} config
     * @param {Options} config.options
     */
    constructor(options) {
        this.ipfs = null
        this.libp2p = null
        this.mode = options.mode
        this.peerId= options.peerId
        this.profileId= options.profileId
        /*if(options.bootstrapNodes)
            this.bootstrapNodes = options.bootstrapNodes
        else
            this.bootstrapNodes = [
                '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
        ]*/
        this.identity = options.identity
        this.topicListeners = []
        this.ipfsOptions = options.ipfs
        this.libp2pOptions = options.libp2p
        this.ipfsClusterApi = options.ipfsClusterApi
        this.ipfsCluster = null

        //PRIVATE NETWORK CONFS
        this.swarmKey = options.swarmKey;

        //CALLBACKS
        this.discoveryCallback = options.discoveryCallback
        this.connectionCallback = options.connectionCallback
        this.getMessageFromProtocolCallback = options.getMessageFromProtocolCallback
    }

    registerTopicListener(callback){
        this.topicListeners.push(callback)
    }

    topicHandler(message){
        for(let l in this.topicListeners) {
            if(message.from !== this.profileId)
               this.topicListeners[l](JSON.parse(toString(message.data)))
        }
    }

    async initTopicsChannel(){
        await this.ipfs.pubsub.subscribe(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL, this.topicHandler.bind(this) )
    }

    async send(data){
        await this.ipfs.pubsub.publish(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL, fromString(JSON.stringify(data)))
    }

    async start(){

        //const peerId = await PeerId.create({ bits: 256, keyType: 'ed25519' })
        /*const node = await IPFS.create(
            {
                repo: this.profileId ? this.profileId : String(Math.random() + Date.now()),//todo manage platform (nodejs, browser)
                libp2p: {
                    //peerId: this.profileId ? PeerId.createFromCID(this.identity.PeerID) : null,
                    modules: {
                        connEncryption: [Noise],
                        streamMuxer: [Mplex],
                        pubsub: Gossipsub
                    },
                    peerDiscovery: [
                        Bootstrap
                    ],
                    config: {
                        peerDiscovery: {
                            autoDial: true, // auto dial to peers we find when we have less peers than `connectionManager.minPeers`
                            mdns: {
                                interval: 10000,
                                enabled: true
                            },
                            bootstrap: {
                                interval: 30e3,
                                enabled: true,
                                list: this.bootstrapNodes
                            }
                        },
                        relay: {
                            enabled: true,
                            hop: {
                                enabled: true,
                                active: true
                            }
                        },
                        pubsub: {
                            enabled: true
                        }
                    }
                }
            }
        )*/

        let opt = {
            ...this.ipfsOptions,
            repo: this.ipfsOptions && this.ipfsOptions.repo ? this.ipfsOptions.repo : 'vfuse-node-repo',
            config : {
                ...this.ipfsOptions.config,
                //Bootstrap: this.bootstrapNodes,
                Pubsub : {
                    Router: "gossipsub",
                    Enabled: true
                }
            }
        }

        const transportKey = WebSockets.prototype[Symbol.toStringTag]
        opt.libp2p = {
            modules: {
                transport:  this.mode === Constants.VFUSE_MODE.BROWSER ? [WebSockets] : [TCP, WebSockets],
                connEncryption: [Noise],
                streamMuxer: [Mplex],
                peerDiscovery: [Bootstrap]
            },
            connProtector : new Protector((new TextEncoder()).encode(this.swarmKey)),
            config: {
                autoDial: true,
                peerDiscovery: {
                    [Bootstrap.tag]: {
                        enabled: true,
                        list: this.ipfsOptions.config.Bootstrap
                    }
                },
                [transportKey]: {
                    filter: filters.dnsWsOrWss
                }
            }
        }

        /*opt.libp2p = {};
        if(this.mode === Constants.VFUSE_MODE.BROWSER)
            opt.libp2p = {
                addresses: {
                    listen: [
                        '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star'
                    ]
                },
                modules: {
                    transport: [WebSockets, WebRTCStar, WebRTCDirect],
                        connEncryption: [Noise],
                        streamMuxer: [Mplex],
                        peerDiscovery: [ WebRTCStar, Bootstrap ]
                },
                config: {
                    peerDiscovery: {
                        autoDial: true,
                            [Bootstrap.tag]: {
                            enabled: true,
                                list: this.ipfsOptions.Bootstrap
                        },
                        mdns: {
                            interval: 20e3,
                                enabled: true
                        }
                    },

                },
                ...this.libp2pOptions
            }

       if(this.mode === Constants.VFUSE_MODE.GATEWAY) {
            opt.libp2p.modules = {
                transport: [WebRTCStar]
            }
            opt.config = {
                peerDiscovery: {
                    webRTCStar: {
                        enabled: true
                    }
                },
                transport: {
                    WebRTCStar: {
                        wrtc
                    }
                }
            }
        }*/


        let node = await IPFS.create(opt)
        this.ipfs = node
        this.libp2p= node.libp2p
        let pid = await this.ipfs.id()
        console.log("IPFS Peer ID:", pid)
        let key = await this.ipfs.key.list()
        console.log({key})

        await this.initTopicsChannel()
        this.hookEvents()
        this.swarm()

        if(this.ipfsClusterApi) this.cluster = ipfsCluster(this.ipfsClusterApi)
    }

    /**
     * @param {Network} network
     */
    async stop(){
        await this.ipfs.stop()
    }

    registerCallbacks(discoveryCallback, connectionCallback, getMessageFromProtocolCallback){
        this.discoveryCallback = discoveryCallback
        this.connectionCallback = connectionCallback
        this.getMessageFromProtocolCallback = getMessageFromProtocolCallback
    }

    hookEvents(){
        this.libp2p.on('peer:discovery', function(peerId) {
            //console.log(`Found peer ${peerId.toB58String()}`)
            if(this.discoveryCallback) this.discoveryCallback(peerId);
        }.bind(this))

        // Listen for new connections to peers
        this.libp2p.connectionManager.on('peer:connect', function(connection){
            //console.log(`Connected to ${connection.remotePeer.toB58String()}`)
            if(this.connectionCallback) this.connectionCallback(connection.remotePeer.toB58String())
            //console.log(connection.remotePeer)
        }.bind(this))

        // Listen for peers disconnecting
        this.libp2p.connectionManager.on('peer:disconnect', (connection) => {
            console.log(`Disconnected from ${connection.remotePeer.toB58String()}`)
        })

        //this.node.libp2p.peerStore.on('peer', (peerId) => console.log('peer', peerId))

        this.libp2p.peerStore.on('change:multiaddrs', ({ peerId, multiaddrs}) => {
            const addresses = []
            for (const multiaddr of multiaddrs) {
                addresses.push(multiaddr.toString())
            }
            //console.log('change:multiaddrs', {peerId, multiaddrs, addresses})
        })
        //this.node.libp2p.peerStore.on('change:protocols', ({ peerId, protocols}) => console.log('change:protocols', {peerId, protocols}))
        this.libp2p.on('error', (err) => console.log('error', err))

    }

    swarm(){
        setInterval(async () => {
            try {
                const peers = await this.ipfs.swarm.peers()
                if(peers.length > 0){
                    console.log(`The node now has ${peers.length} peers.`)
                    console.log({peers})
                }
                if(this.discoveryCallback) this.discoveryCallback(peers)
            } catch (err) {
                console.log('An error occurred trying to check our peers:', err)
            }
        }, 20000)
    }

    /*STANDARD IPFS API*/
    async update(data){
        try {
            //todo delete previous version
            //let remote_data = await this.ipfs.add(data)
            console.log(this.cluster)
            //let remote_data = await this.cluster.add(data)
            let remote_data = await this.addAndPin(data)
            let published_data = await this.ipfs.name.publish(/*remote_data.cid.string*/remote_data.hash)
            let pin_result = await this.cluster.pin.add(published_data.name)
            console.log({pin_result})
            return published_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }

    async publish(cid){
        try {
            let published_data = await this.ipfs.name.publish(cid)
            await this.cluster.pin.add(published_data.name)
            return published_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }

    }

    async addAndPin(data){
        try {
            //todo delete previous version
            let remote_data = await this.cluster.add(data)
            return remote_data
        }catch (e){
            console.log('Got some error during the data adding and pinning: %O', e)
            return null
        }

    }

    async add(data){
        try {
            //todo delete previous version
            let remote_data = await this.ipfs.add(data)
            return remote_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }

    async ls(cid){
        let files = []
        for await (const file of this.ipfs.ls(cid)) {
            files.push(file.path)
        }
        return files
    }

    async get(cid, path) {
        try {
            let ipfs_data_addr = "", content = [], decodedData = null
            for await (const name of this.ipfs.name.resolve(/*'/ipns/' +*/ cid)) {
                ipfs_data_addr = name
            }

            for await (const file of this.ipfs.get(ipfs_data_addr + path)) {
                if (!file.content) continue;
                for await (const chunk of file.content) {
                    content.push(chunk)
                }
            }
            if (content.length > 0) {
                decodedData = toString(content[0])
            }
            return decodedData
        } catch (e) {
            console.log('Got some error during data retrieving: %O', e)
            return null
        }
    }

    async getRaw(path){
        try {
            let content = [], decodedData = null
            for await (const file of this.ipfs.get(path)) {
                if (!file.content) continue;
                for await (const chunk of file.content) {
                    content.push(chunk)
                }
            }
            if (content.length > 0) {
                decodedData = toString(content[0])
            }
            return decodedData
        } catch (e) {
            console.log('Got some error during data retrieving: %O', e)
            return null
        }
    }

    /* MFS API */

    async chmod(path, mode, options){
        await this.ipfs.files.chmod(path, mode, options)
    }

    async makeDir(dir, options){
        return await this.ipfs.files.mkdir(dir, options)
    }

    async touchFile(file){
        return await this.ipfs.files.touch(file)
    }

    async copy(source, destination){
        await this.ipfs.files.cp(source, destination)
    }

    async writeFile(path, content, options){
        return await this.ipfs.files.write(path, content, options)
    }

    async stat(path){
        return await this.ipfs.files.stat(path)
    }

    async list(path){
        let jobs = []
        for await (const file of this.ipfs.files.ls(path)) {
            jobs.push(file.name)
        }
        return jobs
    }

    /*CLUSTER API FOR PINNING*/

    async pin(cid){
        try {
            //todo delete previous version
            await this.cluster.pin.add(cid)
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }

    async getPins(cid){
        try {
            //todo delete previous version
            let pins = await this.cluster.pin.ls({filter: 'all'})
            return pins
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }





}

module.exports = Network
