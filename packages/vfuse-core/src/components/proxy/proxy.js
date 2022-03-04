const httpProxy = require('http-proxy')
const fs = require('fs')
const path = require('path')
const https = require('https');
const { WebSocketServer } = require('ws').Server

class VFuseProxy{
    constructor(props) {
        httpProxy.createServer({
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
            },
            target: 'http://localhost:80',
            secure: false
        }).listen(443, '0.0.0.0');

        this.pinnerServerProxy = httpProxy.createServer({
            target: {
                host: 'localhost',
                port: props.pinning.port,
            },
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
            },
            secure: props.certs.verify
        }).listen(props.pinning.proxyPort, "0.0.0.0");

        /*httpProxy.createServer({
            target: {
                host: 'localhost',
                port: props.bootstrap.wsPort,
            },
            ws : true,
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
            },
            secure: props.certs.verify
        }).listen(props.bootstrap.wsProxyPort, '0.0.0.0');
        console.log("Proxy listening on wss://0.0.0.0:%s", props.bootstrap.wsProxyPort)*/

       /* const proxyServer = https.createServer({
            key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
            cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
        })
        const wss = new WebSocketServer({ server : proxyServer});
        wss.on('connection', function connection(ws) {
            console.log(ws)
            ws.on('message', function message(data) {
                console.log('received: %s', data);
            });
        });
        proxyServer.listen(4002, '0.0.0.0')

        const WebSocketServer = require('ws').Server
            const wss = new WebSocketServer({
            ssl: true,
            port: 999,
            ssl_key: 'path/to/privkey.pem',
                    ssl_cert: 'path/to/cert.pem'
         });
        */

        /*this.signalWebRTCProxy = httpProxy.createProxyServer({
            target: {
                host: 'localhost',
                port: props.signal.port,
            },
            ws: true,
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
            },
            secure: props.certs.verify
        }).listen(props.signal.proxyPort, "0.0.0.0");*/
    }
}

module.exports = VFuseProxy
