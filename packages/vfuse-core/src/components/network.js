'use strict'

const IPFS = require('ipfs')
const Noise = require('libp2p-noise')
const Bootstrap = require('libp2p-bootstrap')
const WebSockets = require('libp2p-websockets')
const WebRTCDirect = require('libp2p-webrtc-direct')
const WebRTCStar = require('libp2p-webrtc-star')
const Mplex = require('libp2p-mplex')
const Gossipsub = require('libp2p-gossipsub')
const PeerId = require('peer-id')
const toString = require('uint8arrays/to-string')
const fromString = require('uint8arrays/from-string')
const Constants = require("./constants");

class Network {
    /**
     * @param {Object} config
     * @param {Options} config.options
     */
    constructor(options) {
        this.ipfs = null
        this.libp2p = null
        this.peerId= options.peerId
        this.profileId= options.profileId
        if(options.bootstrapNodes)
            this.bootstrapNodes = options.bootstrapNodes
        else
            this.bootstrapNodes = [
                '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
        ]
        this.identity = options.identity
        this.topicListeners = []
        this.ipfsOptions = options.ipfs
        this.libp2pOptions = options.libp2p
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
            repo: this.ipfsOptions && this.ipfsOptions.repo ? this.ipfsOptions.repo : 'vfuse-node-repo',
            Identity:{
                PeerID: this.profileId
            },
            Bootstrap: this.bootstrapNodes,
            Pubsub : {
                Enabled : true
            }
        }

        if(this.libp2pOptions)
            opt.libp2p = this.libp2pOptions

        let node = await IPFS.create(opt)
        this.ipfs = node
        this.libp2p= node.libp2p
        let pid = await this.ipfs.id()
        console.log("IPFS Peer ID:", pid)
        let key = await this.ipfs.key.list()
        console.log({key})

        await this.initTopicsChannel()
    }

    /**
     * @param {Network} network
     */
    async stop(){
        await this.ipfs.stop()
    }

    async update(data){
        try {
            //todo delete previous version
            let remote_data = await this.ipfs.add(data)
            let published_data = await this.ipfs.name.publish(remote_data.cid.string)
            return published_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }

    async publish(cid){
        try {
            let published_cid = await this.ipfs.name.publish(cid)
            return published_cid
        }catch (e){
            console.log('Got some error during the data update: %O', e)
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


}

module.exports = Network