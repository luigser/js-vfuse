const VFuseGatewayNode = require('./src/node')

const main = async () => {
    let gatewayNode = new VFuseGatewayNode({ name : "VFuseGateway"});
    await Promise.all([
        gatewayNode.create(),
    ]);
}

main()