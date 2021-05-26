'use strict'

const IPFS = require('ipfs')
const Noise = require('libp2p-noise')
const Bootstrap = require('libp2p-bootstrap')
const WebSockets = require('libp2p-websockets')
const WebRTCDirect = require('libp2p-webrtc-direct')
const WebRTCStar = require('libp2p-webrtc-star')
const Mplex = require('libp2p-mplex')

class Network {
    /**
     * @param {Object} config
     * @param {Options} config.options
     */
    constructor(options) {

        this.ipfs = null
        this.libp2p = null
        this.peerId= options.peerId
        if(options.bootstrapNodes)
            this.bootstrapNodes = options.bootstrapNodes
        else
            this._bootstrapNodes = [
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
        ]
    }

    async start(){
        /*let node = await IPFS.create(
            {
                repo: String(Math.random() + Date.now()),//todo manage platform (nodejs, browser)
                config: {
                    Addresses: {
                        Swarm: [],
                        SignalServer: '127.0.0.1:2000',
                        //Gateway: "/ip4/127.0.0.1/tcp/8080"
                    },
                    //Bootstrap: bootstrapNodes,
                    Discovery: {
                        MDNS : {
                            Enabled: true
                        }
                    }
                },
                libp2p: {
                    addresses: {
                        listen: [
                            '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star',
                            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                            '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
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
                                list: this._bootstrapNodes
                            },
                            mdns: {
                                interval: 20e3,
                                enabled: true
                            }
                        }
                    }
                }
            }
        )*/
        let node = await IPFS.create()
        this.ipfs = node
        this.libp2p= node.libp2p
    }

    /**
     * @param {Network} network
     */
    async stop(){
        await this.ipfs.stop()
    }
}

module.exports = Network