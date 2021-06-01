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
        let node = await IPFS.create({
            Pubsub : {
                Enabled : true
            }
        })
        this.ipfs = node
        this.libp2p= node.libp2p
    }

    /**
     * @param {Network} network
     */
    async stop(){
        await this.ipfs.stop()
    }

    async create(data){
        try{
            let remote_data = await this.ipfs.add(data)
            let published_data = await this.ipfs.name.publish(remote_data.cid.string)
            return published_data
        }catch (e){
            console.log('Got some error during the profile creation: %O', e)
            return null
        }
    }

    async update(data){
        try {
            let remote_data = await this.ipfs.add(data)
            let published_data = await this.ipfs.name.publish(remote_data.cid.string)
            return published_data
        }catch (e){
            console.log('Got some error during the data update: %O', e)
            return null
        }
    }

    async get(cid) {
        try {
            let ipfs_data_addr = "", content = [], decodedData = null
            for await (const name of this.ipfs.name.resolve('/ipns/' + cid)) {
                ipfs_data_addr = name
            }

            for await (const file of this.ipfs.get(ipfs_data_addr)) {
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