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
                        worker: PythonWorker.getWebWorker(),
                        discoveryCallback: () => {
                        },
                        connectionCallback: () => {
                        },
                        getMessageFromProtocolCallback: () => {
                        },
                        bootstrapNodes: ['/ip4/127.0.0.1/tcp/4003/ws/p2p/QmU13jxZXrTmpgodotGGNMdCre2BKfmqPyHdHWGh7vmJ5e'],
                        packages: []
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