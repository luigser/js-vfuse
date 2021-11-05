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
                                Bootstrap :[
                                    '/ip4/192.168.1.57/tcp/4003/ws/p2p/12D3KooWJrzceQZqEgTk4NBGtYABucjnBZ2Nji6JatqBwwZPNYa9',//ALL-IN-ONE
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
