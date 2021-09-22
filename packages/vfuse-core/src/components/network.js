'use strict'

const IPFS = require('ipfs')
/*const Bootstrap = require('libp2p-bootstrap')
const Noise = require('libp2p-noise')
const WebSockets = require('libp2p-websockets')
const Mplex = require('libp2p-mplex')
const filters = require('libp2p-websockets/src/filters')*/
/*const Gossipsub = require('libp2p-gossipsub')
const PeerId = require('peer-id')
const WebRTCDirect = require('libp2p-webrtc-direct')*/
const WebSockets = require('libp2p-websockets')
const { CID } = require('multiformats/cid')
const TCP = require('libp2p-tcp')
const WebRTCStar = require('libp2p-webrtc-star')
const wrtc = require('wrtc')
const Protector = require('libp2p/src/pnet')
const toString = require('uint8arrays/to-string')
const fromString = require('uint8arrays/from-string')
const ipfsCluster = require('ipfs-cluster-api')
const IpfsHttpClient = require("ipfs-http-client")

const Constants = require("./constants")

class Network {
    /**
     * @param {Object} config
     * @param {Options} config.options
     */
    constructor(options) {
        this.key = null
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
        this.httpClient = null

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

    async start() {

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
            config: {
                ...this.ipfsOptions.config,
                //Bootstrap: this.bootstrapNodes,
                Pubsub: {
                    Router: "gossipsub",
                    Enabled: true
                }
            }
        }

        if (this.swarmKey)
            opt.libp2p = {
                connProtector: new Protector((new TextEncoder()).encode(this.swarmKey)),
            }

        if(this.mode === Constants.VFUSE_MODE.BROWSER) {
            /*const transportKey = WebRTCStar.prototype[Symbol.toStringTag]
            opt.libp2p = {
                modules: {
                    transport: [WebRTCStar],
                    peerDiscovery: [WebRTCStar]
                },
                config: {
                    peerDiscovery: {
                        autoDial: true,
                        webRTCStar: {
                            enabled: true
                        }
                    },
                    transport: {
                        [transportKey]: {
                            wrtc
                        }
                    }
                },
                ...this.libp2pOptions
            }*/
            const filters = require('libp2p-websockets/src/filters')
            const transportKey = WebSockets.prototype[Symbol.toStringTag]
            opt.libp2p = {
                config: {
                    transport: {
                        // This is added for local demo!
                        // In a production environment the default filter should be used
                        // where only DNS + WSS addresses will be dialed by websockets in the browser.
                        [transportKey]: {
                            filter: filters.all
                        }
                    }
                },
                ...opt.libp2p
            }

            this.httpClient = IpfsHttpClient.create({ host: '127.0.0.1', port: '5001', protocol: 'http' })
        }

        if(this.mode === Constants.VFUSE_MODE.GATEWAY) {
            opt.libp2p = {
                modules: {
                    transport: [WebRTCStar, TCP]
                },
                config: {
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
                },
                ...opt.libp2p
            }
        }

        let node = await IPFS.create(opt)
        this.ipfs = node
        this.libp2p = node.libp2p
        let pid = await this.ipfs.id()
        console.log("IPFS Peer ID:", pid)
        this.key = await this.ipfs.key.list()
        console.log(this.key)

        await this.initTopicsChannel()
        this.hookEvents()
        this.swarm()

        if(this.ipfsClusterApi) this.cluster = ipfsCluster(this.ipfsClusterApi)
        /*if (this.ipfsClusterApi && this.mode === Constants.VFUSE_MODE.BROWSER) {
            const {Cluster} = require('@nftstorage/ipfs-cluster')
            this.cluster = new Cluster(this.ipfsClusterApi)
        }*/

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
                    //console.log(`The node now has ${peers.length} peers.`)
                    //console.log({peers})
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
            let remote_data = await this.addAndPin(data)
            let options = {
                resolve: true,
                lifetime: "1024h",
                allowOffline: true,
                ...(this.profileId) ? {key : this.profileId} : {}
            }
            //let published_data = await this.ipfs.name.publish("/ipfs/" + remote_data.cid.toString()/*remote_data.cid['/']*/, options)
            let published_data = await this.httpClient.name.publish("/ipfs/" + remote_data.cid.toString()/*remote_data.cid['/']*/, options)
            //let pin_result = await this.cluster.pin.add(published_data.name)
            //console.log({pin_result})
            return published_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }

    async publish(cid){
        try {
            let published_data = await this.ipfs.name.publish(cid)
            await this.cluster.pin.add(published_data.value)
            return published_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }

    }

    async addAndPin(data){
        try {
            //todo delete previous version
            let added_data = await this.add(data);
            let added_to_cluster_data = await this.cluster.add(data);
            let pinning_result = await this.cluster.pin.add(added_data.cid.toString());
            //il cid(hash) del pin diventa accessibile attraverso /ipfs(gateway)?
            //se si utilizzare l'api file per pubblicare su ipns il cid pinnato
            return added_data
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
            for await (const name of this.ipfs.name.resolve('/ipns/' + cid)) {
                ipfs_data_addr = name
            }

            for await (const file of this.ipfs.get(CID.parse(ipfs_data_addr.replace('/ipfs/', '')))) {
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

    async cat(cid){
        try {
            let ipfs_data_addr = "", content = [], decodedData = null
            //for await (const name of this.ipfs.name.resolve('/ipns/' + cid)) {
            for await (const name of this.httpClient.name.resolve('/ipns/' + cid)) {
                ipfs_data_addr = name
            }
            for await (const chunk of await this.ipfs.cat(CID.parse(ipfs_data_addr.replace('/ipfs/', ''))))
                content.push(chunk)

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
        try {
            await this.ipfs.files.chmod(path, mode, options)
        }catch (e) {
            console.log('Got some error during chmod: %O', e)
        }
    }

    async makeDir(dir, options){
        try {
           return await this.ipfs.files.mkdir(dir, options)
        }catch (e) {
            console.log('Got some error during makedDir: %O', e)
        }
    }

    async touchFile(file){
        try {
           return await this.ipfs.files.touch(file)
        }catch (e) {
            console.log('Got some error during touch: %O', e)
        }
    }

    async copy(source, destination){
        await this.ipfs.files.cp(source, destination)
    }

    async writeFile(path, content, options){
        try {
           return await this.ipfs.files.write(path, content, options)
        }catch (e) {
            console.log('Got some error during write: %O', e)
        }
    }

    async readFile(path, options){
        try {
            let chunks = [], decodedData = null
            for await (const chunk of this.ipfs.files.read(path, options)) {
                chunks.push(chunk)
            }

            if (chunks.length > 0) {
                decodedData = toString(chunks[0])
            }
            return decodedData
        }catch (e) {
            console.log('Got some error during write: %O', e)
        }
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
