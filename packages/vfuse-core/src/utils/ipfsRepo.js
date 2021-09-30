const {createRepo}     = require('ipfs-repo')
const DatastoreFS  = require("datastore-fs")
const BlockstoreDatastoreAdapter = require('blockstore-datastore-adapter')

let codecs = [
    require('@ipld/dag-pb'),
    require('@ipld/dag-cbor'),
    require('multiformats/codecs/raw')
].reduce((acc, curr) => {
    acc[curr.name] = curr
    acc[curr.code] = curr

    return acc
}, {})

let loadCodec = (nameOrCode) => {
    if (codecs[nameOrCode]) {
        return codecs[nameOrCode]
    }

    throw new Error(`Could not load codec for ${nameOrCode}`)
}

let repoPath = 'vfuse-ipfs-repo'

let customRepositoryOptions = {
    root: new DatastoreFS(repoPath, {
        extension: '.ipfsroot', // Defaults to '', appended to all files
        errorIfExists: false, // If the datastore exists, don't throw an error
        createIfMissing: true // If the datastore doesn't exist yet, create it
    }),
    // blocks is a blockstore, all other backends are datastores - but we can wrap a datastore
    // in an adapter to turn it into a blockstore
    blocks: new BlockstoreDatastoreAdapter(
        new DatastoreFS(`${repoPath}/blocks`, {
            extension: '.ipfsblock',
            errorIfExists: false,
            createIfMissing: true
        })
    ),
    keys: new DatastoreFS(`${repoPath}/keys`, {
        extension: '.ipfskey',
        errorIfExists: false,
        createIfMissing: true
    }),
    datastore: new DatastoreFS(`${repoPath}/datastore`, {
        extension: '.ipfsds',
        errorIfExists: false,
        createIfMissing: true
    }),
    pins: new DatastoreFS(`${repoPath}/pins`, {
        extension: '.ipfspin',
        errorIfExists: false,
        createIfMissing: true
    }),
    ipns: new DatastoreFS(`${repoPath}/ipns`, {
        extension: '.ipfsipns',
        errorIfExists: false,
        createIfMissing: true
    }),
    ipfs: new DatastoreFS(`${repoPath}/ipfs`, {
        extension: '.ipfsipfs',
        errorIfExists: false,
        createIfMissing: true
    })
}

module.exports = createRepo('./', loadCodec, customRepositoryOptions)
