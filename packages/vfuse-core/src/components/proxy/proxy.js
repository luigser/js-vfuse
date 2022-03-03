const httpProxy = require('http-proxy')
const fs = require('fs')
const path = require('path')

class VFuseProxy{
    constructor(props) {
        console.log("starting proxy ...")
        this.bootstrapWSProxy = httpProxy.createProxyServer({
            target: {
                host: 'localhost',
                port: props.bootstrap.wsPort,
            },
            ws : true,
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, 'certs','cert.pem'), 'utf8')
            },
            secure: props.certs.verify
        }).listen(props.bootstrap.wsProxyPort);

        this.signalWebRTCProxy = httpProxy.createProxyServer({
            target: {
                host: 'localhost',
                port: props.signal.port,
            },
            ws: true,
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, 'certs','cert.pem'), 'utf8')
            },
            secure: props.certs.verify
        }).listen(props.signal.proxyPort);

        this.pinnerServerProxy = httpProxy.createProxyServer({
            target: {
                host: 'localhost',
                port: props.pinning.port,
            },
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, 'certs','cert.pem'), 'utf8')
            },
            secure: props.certs.verify
        }).listen(props.pinning.proxyPort);
    }
}

module.exports = VFuseProxy
