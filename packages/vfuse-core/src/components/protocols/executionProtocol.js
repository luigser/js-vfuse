const pipe = require('it-pipe')

const handler = async({protocol, stream}) => {
    pipe(
        stream,
        source => (async function () {
            for await (const msg of source) {
                console.log(msg.toString())
            }
        }.bind(this))()
    )
}

const send = async(node) =>{
    try {
        const {stream} = await this.node.libp2p.dialProtocol(node.libp2p.peerId, '/message/0.0.2')
        await pipe(
            ['Hello', 'I\'m node ' + this.node.libp2p.peerId.toB58String()],
            stream
        )
        console.log(`Node ${this.node.libp2p.peerId.toB58String()} has sent a message`)
    }catch(e){
        console.log(e);
    }
}
