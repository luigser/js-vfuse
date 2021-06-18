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
                        bootstrapNodes: ['/ip4/192.168.1.57/tcp/9096/p2p/12D3KooWPgiEiS6p73rSi5peTvo16SKaiU4y4pYBri8wjQmjpGbE'],
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