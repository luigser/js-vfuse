import VFuse from "vfuse-core";
import PythonWorker from'vfuse-python-worker'

import {gStore} from "../store";

export const useVFuse = () => {

    const getNode = async(signalServer, bootstraps, pinningServer, delegateNode) => {
        let node = null
        try {
            node = gStore.get("vFuseNode")
            if (!node) {
                node = await VFuse.create(
                    {
                        ipfs:{
                            config: {
                                Addresses : {
                                    Swarm: [
                                        signalServer
                                        //'/ip4/192.168.1.57/tcp/2000/ws/p2p-webrtc-star',
                                    ]
                                },
                                Bootstrap : bootstraps/*[
                                    '/ip4/192.168.1.57/tcp/4003/ws/p2p/12D3KooWRKxogWN84v2d8zWUexowJ2v6iGQjkAL9qYXHuXrf9DLY',//ALL-IN-ONE
                                    '/ip4/192.168.1.51/tcp/4003/ws/p2p/12D3KooWLoK9JGoCAdkNjPeZXJNfGaAPTYc93h3W9WWfLGwuQ5u5',//SURFACE

                                    //'/ip4/192.168.1.57/tcp/2000/wss/p2p-webrtc-star',
                                    //'/ip4/192.168.1.57/tcp/9090/http/p2p-webrtc-direct/p2p/12D3KooWSy9Gxdc3QcJ3hgiw8ydxab7NpQE37kCqZLSuVYnqHTtd'
                                ]*/
                            }
                        },
                        runtime: {
                            worker : PythonWorker,
                            packages : []
                        },
                        discoveryCallback: () => {},
                        connectionCallback: () => {},
                        getMessageFromProtocolCallback: () => {},
                        ipfsClusterApi : pinningServer !== '' ? pinningServer : null,
                        ipfsClientOptions: delegateNode !== '' ? delegateNode : null
                        //ipfsClusterApi: {host: '192.168.1.57', port: '9094', protocol: 'http'},
                        //ipfsClientOptions: {host: '192.168.1.57', port: '5001', protocol: 'http'}
                    }
                )
                console.log({node})

                gStore.set({ vFuseNode : node })
            }
        }catch (e) {
            console.log(e)
            return node
        }
        return node;
    }

    return {
        getNode
    }

}
