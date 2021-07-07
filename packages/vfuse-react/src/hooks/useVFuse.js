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
                                Discovery: {
                                    MDNS: {
                                        Enabled: false,
                                        Interva: 10
                                    }
                                },
                            }
                        },
                        bootstrapNodes: ['/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWD9GpdKboHZ87s8FeVmaPqH5sCqpFvvB77TuCCtKVBdnE'],
                        packages: [],
                        //ipfsClusterApi : '/ip4/127.0.0.1/tcp/9094'
                        ipfsClusterApi : { host: 'localhost', port: '9094', protocol: 'http' }
                    }
                )
                console.log("Profile ID: %s", node.profile.id)
                console.log('VFuse NODE')
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