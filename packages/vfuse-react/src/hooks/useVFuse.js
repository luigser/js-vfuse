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
                        profileId: profileId,
                        worker: PythonWorker.getWebWorker(),
                        discoveryCallback: () => {},
                        connectionCallback: () => {},
                        getMessageFromProtocolCallback: () => {},
                        swarmKey: "/key/swarm/psk/1.0.0/\n" +
                            "/base16/\n" +
                            "644a17d6bd356f40431872d3471e11918b5f8a9e50f1155eb291982a7548defc",
                        ipfs:{
                            config:{
                                Addresses: {
                                    Swarm: [
                                        //'/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star',
                                        //"/ip4/0.0.0.0/tcp/4001/ws"
                                    ],
                                    //SignalServer: '127.0.0.1:2000'
                                },
                                Swarm: {
                                    EnableRelayHop: true
                                },
                                /*Discovery: {
                                    MDNS: {
                                        Enabled: false,
                                        Interva: 10
                                    }
                                },*/
                                Bootstrap:  [
                                    //'/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star',
                                    '/ip4/127.0.0.1/tcp/4001/ws/p2p/QmVVx6s2QvEnRZwYhxH1j7bzYgwpQZWVpguhPbCsTdR8Bq'
                                ]
                            }
                        },
                        packages: [],
                        //libp2p : { addresses : { listen : ['/ip4/127.0.0.1/tcp/2000/ws/p2p-webrtc-star'] }},
                        libp2p : { addresses : { listen: ['/ip4/127.0.0.1/tcp/4001/ws'] }},
                        ipfsClusterApi : { host: 'localhost', port: '9094', protocol: 'http' }
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
