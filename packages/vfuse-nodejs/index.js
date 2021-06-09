const VFuseGateway = require('./src/gateway')

const main = async () => {
    let gatewayNode = new VFuseGateway({ name : "VFuseGateway"});
    await Promise.all([
        gatewayNode.create(),
    ]);
}

main()