const PeerId       = require('peer-id')
const IPFSRepo     = require('ipfs-repo')
const DatastoreFs  = require("datastore-fs")
const VFuse        = require('vfuse-core')

class VFuseGateway{
    constructor(options) {
        this.customRepositoryOptions = {
            storageBackends: {
                root: DatastoreFs, // version and config data will be saved here
                blocks: DatastoreFs,
                keys: DatastoreFs,
                datastore: DatastoreFs
            },
            storageBackendOptions: {
                root: {
                    extension: '.ipfsroot', // Defaults to ''. Used by datastore-fs; Appended to all files
                    errorIfExists: false, // Used by datastore-fs; If the datastore exists, don't throw an error
                    createIfMissing: true // Used by datastore-fs; If the datastore doesn't exist yet, create it
                },
                blocks: {
                    sharding: false, // Used by IPFSRepo Blockstore to determine sharding; Ignored by datastore-fs
                    extension: '.ipfsblock', // Defaults to '.data'.
                    errorIfExists: false,
                    createIfMissing: true
                },
                keys: {
                    extension: '.ipfskey', // No extension by default
                    errorIfExists: false,
                    createIfMissing: true
                },
                datastore: {
                    extension: '.ipfsds', // No extension by default
                    errorIfExists: false,
                    createIfMissing: true
                }
            },
            //lock: fsLock
        }

        this.options = {
            profileId: options.profileId,
            //worker: PythonWorker.getWebWorker(),
            discoveryCallback: () => {},
            connectionCallback: () => {},
            getMessageFromProtocolCallback: () => {},
            bootstrapNodes: null,
            packages: [],
            ipfs: {
                repo : new IPFSRepo ('./fs-repo/.ipfs/vfuse-gateway', this.customRepositoryOptions),
                API : {
                    HTTPHeaders: {
                        "Access-Control-Allow-Headers": [
                            "X-Requested-With",
                            "Access-Control-Expose-Headers",
                            "Range"
                        ],   "Access-Control-Expose-Headers": [
                            "Location",
                            "Ipfs-Hash"
                        ],   "Access-Control-Allow-Methods": [
                            "POST",
                            "GET"
                        ],   "Access-Control-Allow-Origin": [
                            //"<your_domain or all (*)>"
                            "<*>"
                        ],   "X-Special-Header": [
                            "Access-Control-Expose-Headers: Ipfs-Hash"
                        ]
                    },
                    RootRedirect: "",
                    Writable: true,
                    PathPrefixes: [],
                    APICommands: []
                }
            },
        }

    }

    async init(){
        this.node = await VFuse.create(this.options)
        //console.log(this.node)
    }

    async createWorkflow(){
        await this.node.createWorkflow()
    }

    async addJob(job){
        await this.node.addJob(job)
    }

    static async create (options = {}) {
        const vFuseGateway = new VFuseGateway(options)
        await vFuseGateway.init()
        return vFuseGateway
    }
}

module.exports = VFuseGateway