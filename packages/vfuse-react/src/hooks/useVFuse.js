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
                        mode:VFuse.Constants.VFUSE_MODE.BROWSER,
                        profileId: profileId,//QmZXH9QvPSr4JbPgoD9TuxUZhW1yqgp68FUS6qDa41rFp3
                        worker: PythonWorker.getWebWorker(),
                        discoveryCallback: () => {},
                        connectionCallback: () => {},
                        getMessageFromProtocolCallback: () => {},
                        swarmKey: "/key/swarm/psk/1.0.0/\n" +
                            "/base16/\n" +
                            "0c3dff9473e177f3098be363ac2e554a0deadbd27a79ee1c0534946d1bb990b3",
                        ipfs:{
                            pass: "01234567890123456789",
                            config:{
                                Addresses: {
                                    Swarm: [
                                        '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star',//UNCOMMENT FOR CUSTOM GATEWAY VERSION
                                        //'/ip4/127.0.0.1/tcp/4001/ws'
                                    ],
                                   // Delegates: ["/ip4/127.0.0.1/tcp/8080"]
                                },
                                Swarm: {
                                    EnableRelayHop: true
                                },
                                Bootstrap:  [
                                    '/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star/p2p/12D3KooWMqNSWNH95gZMAEhymuirCBNnfWeFDTAM8davwRGQncrv'
                                ],
                               /* Discovery: {
                                    MDNS: {
                                        Enabled: false
                                    },
                                    webRTCStar: {
                                        Enabled: false
                                    }
                                },*/
                            }
                        },
                        packages: [],
                        libp2p : { addresses : { listen : ['/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star'] }},
                        ipfsClusterApi : { host: 'localhost', port: '9094', protocol: 'http' },
                        ipfsClientOptions :{ host: 'localhost', port: '5001', protocol : 'http' }
                    }
                )
                //console.log("Profile ID: %s", node.profile.id)
                //console.log('VFuse NODE')
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
