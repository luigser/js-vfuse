'use strict'

const IPFS = require('ipfs')
//const Bootstrap = require('libp2p-bootstrap')
//const Noise = require('libp2p-noise')
//const Mplex = require('libp2p-mplex')
//const filters = require('libp2p-websockets/src/filters')
const Gossipsub = require('libp2p-gossipsub')
//const Floodsub = require('libp2p-floodsub')
//const WebRTCDirect = require('libp2p-webrtc-direct')
//const MDNS = require('libp2p-mdns')
const WebSockets = require('libp2p-websockets')
//const KadDHT = require('libp2p-kad-dht')
const { CID } = require('multiformats/cid')
const TCP = require('libp2p-tcp')
//const WebRTCStar = require('libp2p-webrtc-star')
//const wrtc = require('wrtc')
const Protector = require('libp2p/src/pnet')
const toString = require('uint8arrays/to-string')
//const fromString = require('uint8arrays/from-string')
const ipfsCluster = require('ipfs-cluster-api')
const IpfsHttpClient = require("ipfs-http-client")
const PeerId = require('peer-id')
const LZUTF8 = require('lzutf8')
const fflate = require('fflate')

const  { isNode, isBrowser } = require("browser-or-node");

const Constants = require("./constants")

class NetworkManager{
    /**
     * @param {Object} config
     * @param {Options} config.options
     *
     */
    constructor(options, eventManager) {
        this.eventManager = eventManager
        this.key = null
        this.ipfs = null
        this.libp2p = null
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
        this.ipfsClientOptions = options.ipfsClientOptions
        this.ipfsCluster = null
        this.httpClient = null

        //PRIVATE NETWORK CONFS
        this.swarmKey = options.swarmKey;
        this.isBootstrapNode = options.bootstrapNode
        this.profileChecked = false

        //CALLBACKS
        this.discoveryCallback = options.discoveryCallback
        this.connectionCallback = options.connectionCallback
        this.getMessageFromProtocolCallback = options.getMessageFromProtocolCallback

        this.connectedPeers = new Map()
        this.receivedMessages = []
    }

    async start() {

        let repo_id = await PeerId.create({ bits: 1024, keyType: 'RSA' })

        let opt = {
            ...this.ipfsOptions,
            repo: this.ipfsOptions && this.ipfsOptions.repo ? this.ipfsOptions.repo : repo_id._idB58String,
        }

        if (this.swarmKey)
            opt.libp2p = {
                connProtector: new Protector((new TextEncoder()).encode(this.swarmKey)),
            }

        /*if(isBrowser) {
            const filters = require('libp2p-websockets/src/filters')
            opt.libp2p = {
                addresses: {
                    listen: this.ipfsOptions.config.Addresses.Swarm
                },
                modules: {
                    transport: [WebSockets, WebRTCStar],
                    streamMuxer: [Mplex],
                    connEncryption: [Noise],
                    peerDiscovery: [Bootstrap],
                    dht: KadDHT,
                    pubsub : Gossipsub
                },
                dialer: {
                    maxParallelDials: 100,
                    maxDialsPerPeer: 4,
                    dialTimeout: 30e3
                },
                peerStore: {
                    persistence: false,
                    threshold: 5
                },
                config: {
                    transport: {
                        // This is added for local demo!
                        // In a production environment the default filter should be used
                        // where only DNS + WSS addresses will be dialed by websockets in the browser.
                        [WebSockets.prototype[Symbol.toStringTag]]: {
                            filter: filters.all
                        }
                    },
                    dht: {
                        enabled: true,
                        randomWalk: {
                            enabled: true
                        }
                    },
                    peerDiscovery: {
                        [WebRTCStar.tag]: {
                            enabled: true
                        },
                        [Bootstrap.tag]: {
                            enabled: true,
                            list: this.ipfsOptions.config.Bootstrap
                        }
                    }
                },
                ...this.libp2pOptions
            }

            this.httpClient = this.ipfsClientOptions ? IpfsHttpClient.create(this.ipfsClientOptions) : null
        }

        if(isNode) {
            opt.libp2p = {
                addresses: {
                    listen: this.ipfsOptions.config.Addresses.Swarm
                },
                modules: {
                    transport: [ WebRTCStar, TCP, WebSockets ],
                    streamMuxer: [ Mplex ],
                    connEncryption: [ Noise ],
                    peerDiscovery: [ MDNS ],
                    dht: KadDHT,
                    pubsub: Gossipsub
                },
                dialer: {
                    maxParallelDials: 100,
                    maxDialsPerPeer: 4,
                    dialTimeout: 30e3
                },
                peerStore: {
                    persistence: false,
                    threshold: 5
                },
                config: {
                    peerDiscovery: {
                        [WebRTCStar.tag]: {
                            enabled: true
                        },
                        /!*[Bootstrap.tag]: {
                            enabled: true,
                            //list: ['/ip4/192.168.1.57/tcp/9090/http/p2p-webrtc-direct']
                        }*!/
                    },
                    transport : {
                        [WebRTCStar.prototype[Symbol.toStringTag]]: {
                            wrtc
                        }
                    },
                    relay: {
                        enabled: true,
                        hop: {
                            enabled: true
                        },
                        advertise: {
                            enabled: true,
                        }
                    },
                    dht: {
                        enabled: true,
                        randomWalk: {
                            enabled: true
                        }
                    }
                },
                ...this.libp2pOptions
            }
        }*/

        //if(isBrowser){
            const filters = require('libp2p-websockets/src/filters')
            const transportKey = WebSockets.prototype[Symbol.toStringTag]
            opt.libp2p = {
                modules: {
                    pubsub: Gossipsub
                },
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
        //}

        let node = await IPFS.create(opt)
        this.ipfs = node
        this.libp2p = node.libp2p
        this.peerId = this.libp2p.addressManager.peerId._idB58String

        console.log("Peer ID:", this.peerId)
        this.key = await this.ipfs.key.list()
        //console.log(this.key)

        //console.log('PEER STORE : %O', this.libp2p.peerStore.peers)

        await this.initTopicsChannel()
        this.hookEvents()
        //this.announce()

        this.httpClient = this.ipfsClientOptions ? IpfsHttpClient.create(this.ipfsClientOptions) : null
        this.cluster = this.ipfsClusterApi ? ipfsCluster(this.ipfsClusterApi) : this.ipfs
        this.api = isBrowser && this.httpClient ?  this.httpClient : this.ipfs
    }

    /**
     * @param {NetworkManager} network
     */
    async stop(){
        await this.ipfs.pubsub.unsubscribe(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.NAME, null)
        await this.ipfs.pubsub.unsubscribe(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.DISCOVERY, null)
        await this.ipfs.stop()
    }

    announce(){
        setInterval(async function(){
            /*try {
                for (let peer of this.libp2p.peerStore.peers.values()) {
                    console.log("try to connect to : %s", peer.id._idB58String)
                    await this.ipfs.swarm.connect(peer.addresses[0].multiaddr)
                }
            }catch (e) {
                console.log("Error during dialing peer : %O", e)
            }*/
            /*if(isNode && this.isBootstrapNode)
               await this.ipfs.pubsub.publish(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.DISCOVERY, "peer-alive")
            await this.send({ action : Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.DISCOVERY, peer : this.peerId })*/
            await this.ipfs.pubsub.publish(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.DISCOVERY, "peer-alive")
        }.bind(this), Constants.TIMEOUTS.DISCOVERY);
    }

    // processes a circuit-relay announce over pubsub
    async processAnnounce(addr) {
        let me = await this.ipfs.id();
        me = me.id;
        // not really an announcement if it's from us
        if (addr.from === me) {
            return;
        }
        console.log('Get Anoounce from %s', addr.from)
        if (addr === "keep-alive") {
            return;
        }

        let peer = addr.from;
        if (peer === me) {
            return;
        }

        if(!this.profileChecked && this.isBootstrap(peer)) {
            this.eventManager.emit('circuit_enabled', {peer: peer})
            this.profileChecked = true
        }

        let peers = await this.ipfs.swarm.peers();
        for (let i in peers) {
            // if we're already connected to the peer, don't bother doing a
            // circuit connection
            //if(this.discoveryCallback) this.discoveryCallback(peers)
            if (peers[i].peer === peer) {
                return;
            }
        }
        return
        try {
            await this.ipfs.swarm.connect(addr);
        } catch(err) {
            console.log(err);
            //await this.ipfs.swarm.connect(addr);
        }
    }

    registerTopicListener(callback){
        this.topicListeners.push(callback)
    }

    async initTopicsChannel(){
        await this.ipfs.pubsub.subscribe(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.NAME, this.topicHandler.bind(this) )
        await this.ipfs.pubsub.subscribe(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.DISCOVERY, this.processAnnounce.bind(this));
    }

    async topicHandler(message){
        try{
            /*if(this.receivedMessages.find(message.id))
                return
            else
                this.receivedMessages.push(message.id)*/
            if(message.from === this.peerId) return
            let data = JSON.parse(Buffer.from(fflate.unzlibSync(message.data)).toString())//JSON.parse(LZUTF8.decompress(message.data));
            //console.log(`Got Message from ${message.from} - ${data.action}`)
            //console.log(data)
            switch(data.action){
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.DISCOVERY:
                    this.connectedPeers.set(data.peer, data.peer)
                    let peers = [...this.connectedPeers.keys()].map(function(p){ return {peer : p} })
                    this.eventManager(Constants.EVENTS.NETWORK_DISCOVERY_PEERS, peers)

                   /*try {
                        await this.ipfs.swarm.connect(message);
                    } catch(err) {
                        console.log(err);
                        await this.ipfs.swarm.connect(message);
                    }*/
                    break
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST:
                    this.eventManager.emit(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_REQUEST, data.payload)
                    break
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST:
                    this.eventManager.emit(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_REQUEST, data.payload)
                    break
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_RESPONSE:
                    this.eventManager.emit(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.EXECUTION_RESPONSE, data.payload)
                    break
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.UNPUBLISH:
                    this.eventManager.emit(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.UNPUBLISH, data.payload)
                    break
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE:
                    this.eventManager.emit(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.JOB.EXECUTION_RESPONSE, data.payload)
                    break
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED:
                    this.eventManager.emit(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.RESULTS.RECEIVED, data.payload)
                    break
                case Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.SELECTED_RUNNING_WORKFLOW_JOBS:
                    this.eventManager.emit(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.ACTIONS.WORKFLOW.SELECTED_RUNNING_WORKFLOW_JOBS , data.payload)
                    break
            }

            for(let l in this.topicListeners) {
                if(message.from !== this.profileId)
                    this.topicListeners[l](JSON.parse(toString(message.data)))
            }
        }catch (e) {
            console.log('Error during VFuse topic message handling : %O', e)
        }
    }

    async send(data){
        try {
            data = fflate.zlibSync((new TextEncoder().encode(JSON.stringify(data))), {level: 6})
            //console.log(`Sending ${data.length} bytes`)
            await this.libp2p.pubsub.publish(Constants.TOPICS.VFUSE_PUBLISH_CHANNEL.NAME, data)/*LZUTF8.compress(JSON.stringify(data))*/
        }catch(e){
            console.log("Got some error during message sending on VFuse channel : " + e.message)
        }
    }

    getConnectedPeers(){
        return [...this.connectedPeers.keys()].map(function(p){ return {peer : p} })
    }

    isBootstrap(peerId){
       for(let i = 0; i < this.ipfsOptions.config.Bootstrap.length; i++){
           let saddr = this.ipfsOptions.config.Bootstrap[i].split('/')
           if(saddr[saddr.length - 1] === peerId)
               return true
       }
       return false
    }

    hookEvents(){
        this.libp2p.on('peer:discovery', function(peerId) {
            console.log(`Found peer ${peerId.toB58String()}`)
            if(this.discoveryCallback) this.discoveryCallback(peerId);
        }.bind(this))

        // Listen for new connections to peers
        this.libp2p.connectionManager.on('peer:connect', async function(connection){
            console.log('Connection established to: ' + connection.remotePeer.toB58String())
            if (this.connectedPeers.has(connection.remotePeer.toB58String())) return
            this.connectedPeers.set(connection.remotePeer.toB58String(), connection.remotePeer.toB58String())
            let peers = [...this.connectedPeers.keys()].map(function(p){ return {peer : p} })
            this.eventManager.emit(Constants.EVENTS.NETWORK_DISCOVERY_PEERS, peers)
        }.bind(this))

        // Listen for peers disconnecting
        this.libp2p.connectionManager.on('peer:disconnect', (connection) => {
            console.log(`Disconnected from ${connection.remotePeer.toB58String()}`)
            this.connectedPeers.delete(connection.remotePeer.toB58String())
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

    /*REGULAR IPFS API*/

    async getKey(name){
        try{
            let keys = await this.ipfs.key.list()
            let founded = keys.filter(key => key.name === name)
            return founded.length > 0 ? founded[0] : await this.ipfs.key.gen(name)
        }catch (e) {
            console.log('Error during new key generation : %O', e)
        }
    }

    async add(data){
        try {
            //todo delete previous version
            let remote_data = await this.ipfs.add(data, {pin : true})
            return remote_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }

    async get(cid){
        try {
            let content = [], result = null
            for await (const parts of this.ipfs.get(cid))
                content.push(parts)
            if (content.length > 0) {
                result = toString(content[0])
            }
            return result
        } catch (e) {
            //console.log('Got some error during data retrieving: %O', e)
            return null
        }
    }

    async cat(cid){
        try {
            let content = [], result = ""
            for await (const parts of this.ipfs.cat(cid))
                content.push(parts)
            if (content.length > 0) {
                for(let part of content)
                   result += toString(part)
            }
            return result
        } catch (e) {
            //console.log('Got some error during data retrieving: %O', e)
            return null
        }
    }

    async getWithNS(cid) {
        try {
            let ipfs_data_addr = "", content = [], decodedData = null
            for await (const name of this.ipfs.name.resolve('/ipns/' + cid,  { stream: false }) ) {
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
            console.log('Got some error during data retrieving with IPNS: %O', e)
            return null
        }
    }

    async publish(cid, options){
        try {
            let published_data = await this.ipfs.name.publish(cid, options ? options : { resolve: false })
            return published_data.name
        }catch (e){
            console.log('Got some error during the cid publishing: %O', e)
            return null
        }
    }

    async unpublish(cid, options){
        try {
            let result = await this.ipfs.name.pubsub.cancel(cid, options)
            return result.canceled
        }catch (e){
            console.log('Got some error during the cid unpublishing: %O', e)
            return null
        }
    }

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

    async ls(cid){
        let files = []
        for await (const file of this.ipfs.ls(cid)) {
            files.push(file.path)
        }
        return files
    }

    async catWithNS(cid){
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

    async addAndPin(data){
        try {
            //todo delete previous version
            let added_data = await this.add(data);
            let added_to_cluster_data = await this.cluster.add(Buffer.from(data));
            let pinning_result = await this.cluster.pin.add(added_data.cid.toString());
            //il cid(hash) del pin diventa accessibile attraverso /ipfs(gateway)?
            //se si utilizzare l'api file per pubblicare su ipns il cid pinnato
            return pinning_result.cid ? pinning_result.cid['/'] : pinning_result.toString()
        }catch (e){
            console.log('Got some error during the data adding and pinning: %O', e)
            return {error : e}
        }

    }


    /* MFS API */

    async chmod(path, mode, options){
        try {
            await this.api.files.chmod(path, mode, options)
        }catch (e) {
            console.log('Got some error during chmod: %O', e)
        }
    }

    async makeDir(dir, options){
        try {
           return await this.api.files.mkdir(dir, options)
        }catch (e) {
            console.log('Got some error during makedDir: %O', e)
        }
    }

    async touchFile(file){
        try {
           return await this.api.files.touch(file)
        }catch (e) {
            console.log('Got some error during touch: %O', e)
        }
    }

    async copy(source, destination){
        await this.api.files.cp(source, destination)
    }

    async writeFile(path, content, options){
        try {
           return await this.api.files.write(path, content, options)
        }catch (e) {
            console.log('Got some error during write: %O', e)
        }
    }

    async deleteFile(path, options){
        try {
            return await this.api.files.rm(path, options)
        }catch (e) {
            console.log('Got some error during write: %O', e)
        }
    }

    async readFile(path, options){
        try {
            let chunks = [], decodedData = ""
            for await (const chunk of this.api.files.read(path, options)) {
                chunks.push(chunk)
            }

            if (chunks.length > 0) {
                for(let chunk of chunks)
                   decodedData += toString(chunk)
            }
            return decodedData
        }catch (e) {
           // console.log('Got some error during write: %O', e)
            return null
        }
    }

    async stat(path){
        try {
           return await this.api.files.stat(path)
        }catch (e) {
            //console.log('Got some error during stat: %O', e)
        }
    }

    async list(path){
        let files = []
        try{
            for await (const file of this.api.files.ls(path)) {
                files.push(file.name)
            }
            return files
        }catch (e) {
            //console.log('Got some error during list: %O', e)
            return files
        }
    }

    async pinFileInMFS(path){
        try{
            let stat = await this.stat(path)
            //console.log({stat})
            let pinning_result = await this.pin(stat.cid)
            return pinning_result
        }catch (e) {
            console.log('Got some error during stat: %O', e)
        }
    }

    async addToCluster(data){
        try{
            let result = await this.cluster.add(Buffer.from(data))
            console.log('AddToCluster : %O', result)
            return result.hash ? result.hash : { error : result }
        }catch (e) {
            console.log('Error adding content to cluster : %O', e)
            return { error : e }
        }
    }

    /*CLUSTER API FOR PINNING*/

    async pin(cid){
        try {
            //todo delete previous version
            let data_cid = await this.cluster.pin.add(cid,  { filter : 'all'})
            return data_cid.cid ? data_cid.cid['/'] : data_cid.toString()
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

    getDataFromUrl(url, start, end, type){
        return new Promise((resolve, reject) => {
            try {
                if (isNode) {
                    const http = require('https')
                    http.get(url, (response) => {
                        if(start !== undefined && end !== undefined)
                           response.setHeader("Range", `bytes=${start}-${end}`);
                        let chunks_of_data = [];

                        response.on('data', (fragments) => {
                            chunks_of_data.push(fragments)
                        })

                        response.on('end', () => {
                            let response_body = Buffer.concat(chunks_of_data);
                            resolve(response_body.toString())
                        })

                        response.on('error', (error) => {
                            reject({error: error});
                        })
                    })
                } else if (isBrowser) {
                    let headers = {}
                    if(start !== undefined && end !== undefined) {
                        headers = {
                            'range': `bytes=${start}-${end}`,
                        }
                    }
                    fetch(url, {
                        headers: headers,
                        method: "GET",
                        mode: "cors",
                    })
                        .then(response => resolve(response.text()))
                        .catch(error => reject({error: error}))
                }
            }catch (e) {
                reject({error : e})
            }
        })
    }







}

module.exports = NetworkManager
