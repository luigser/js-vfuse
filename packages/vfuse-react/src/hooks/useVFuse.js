import VFuse from "vfuse-core";
import PythonWorker from'vfuse-python-worker'

import {gStore} from "../store";

export const useVFuse = () => {



    const getNode = async(signalServer, bootstraps, pinningServer, delegateNode) => {
        let node = null
        try {
            node = gStore.get("vFuseNode")
            if (!node) {
                let options =  {
                    localStorage: true,
                    computation: true,
                    ipfs:{
                        config: {
                            Addresses : {
                                Swarm: signalServer ? [signalServer] : []
                            },
                            Bootstrap : bootstraps ? bootstraps : []
                        }
                    },
                    workers: [{
                        worker : PythonWorker,
                        packages : []
                    }],
                    ipfsClusterApi : pinningServer ? pinningServer : null,//{host: '193.205.161.5', port: '9097', protocol: 'https'}, //pinningServer !== '' ? pinningServer : null,
                    ipfsClientOptions: delegateNode !== '' ? delegateNode : null
                }
                node = await VFuse.create(options)
                console.log({node})

                if(node.error)
                    return {error: node.error}
                else
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
