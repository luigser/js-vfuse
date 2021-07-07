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
                        mode:VFuse.Constants.VFUSE_MODE.NORMAL,
                        profileId: profileId,
                        worker: PythonWorker.getWebWorker(),
                        discoveryCallback: () => {},
                        connectionCallback: () => {},
                        getMessageFromProtocolCallback: () => {},
                        ipfs:{
                            config:{
                                Addresses: {
                                    Swarm: [
                                        //"/ip4/127.0.0.1/tcp/4001",
                                        //"/ip4/127.0.0.1/tcp/4003/ws/p2p-websocket-star"
                                    ]
                                },
                                Discovery: {
                                    MDNS: {
                                        Enabled: false,
                                        Interva: 10
                                    }
                                },
                                Bootstrap:  [
                                    '/ip4/127.0.0.1/tcp/4003/ws/p2p/QmVVx6s2QvEnRZwYhxH1j7bzYgwpQZWVpguhPbCsTdR8Bq'
                                ]
                            }
                        },
                        packages: [],
                        //ipfsClusterApi : '/ip4/127.0.0.1/tcp/9094'
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