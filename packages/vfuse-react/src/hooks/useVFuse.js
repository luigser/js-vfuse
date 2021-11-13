import VFuse from "vfuse-core";
import PythonWorker from'vfuse-python-worker'

import {gStore} from "../store";

export const useVFuse = () => {

    const getNode = async(profileId) => {
        let node = null
        try {
            node = gStore.get("vFuseNode")
            if (!node) {
                node = await VFuse.create(
                    {
                        profileId: profileId,
                        ipfs:{
                            config: {
                                Addresses : {
                                    Swarm: [
                                        '/ip4/192.168.1.57/tcp/2000/ws/p2p-webrtc-star',
                                    ]
                                },
                                Bootstrap :[
                                    '/ip4/192.168.1.57/tcp/4003/ws/p2p/12D3KooWGysUW9fVHJ9KJreJ4wCDF48ANBS3BTpSGS15a1uUmLBE',//ALL-IN-ONE
                                    '/ip4/192.168.1.51/tcp/4003/ws/p2p/12D3KooWLoK9JGoCAdkNjPeZXJNfGaAPTYc93h3W9WWfLGwuQ5u5',//SURFACE

                                    //'/ip4/192.168.1.57/tcp/2000/wss/p2p-webrtc-star',
                                    //'/ip4/192.168.1.57/tcp/9090/http/p2p-webrtc-direct/p2p/12D3KooWSy9Gxdc3QcJ3hgiw8ydxab7NpQE37kCqZLSuVYnqHTtd'
                                ]
                            }
                        },
                        runtime: {
                            language : VFuse.Constants.PROGRAMMING_LANGUAGE.PYTHON,
                            worker : new PythonWorker(),
                            packages : []
                        },
                        discoveryCallback: () => {},
                        connectionCallback: () => {},
                        getMessageFromProtocolCallback: () => {},
                        ipfsClusterApi: {host: '192.168.1.57', port: '9094', protocol: 'http'},
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
