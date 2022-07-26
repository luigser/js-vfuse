const httpProxy = require('http-proxy')
const fs = require('fs')
const path = require('path')
const https = require('https');
//const { WebSocketServer } = require('ws').Server

class VFuseProxy{
    constructor(props) {
        console.log('Create proxies ...')
        //HTTPS PROXY
        httpProxy.createServer({
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
            },
            target: 'http://localhost:80',
            ws: true,
            secure: false
        }).listen(443, '0.0.0.0');
        //PINNING SERVER PROXY
        httpProxy.createServer({
            target: {
                host: 'localhost',
                port: props.pinning.port,
            },
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
            },
            secure: props.certs.verify
        }).listen(props.pinning.proxyPort, "0.0.0.0");
        //WSS SWARM PROXY
        let proxy = httpProxy.createServer({
            /*target: {
                host: 'localhost',
                port: props.bootstrap.wsPort,
            },*/
            target: 'http://localhost:4003/',
            ws : true,
            ssl: {
                key: fs.readFileSync(props.keyPemFile ? props.cert.keyPemFile :  path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs', 'key.pem'), 'utf8'),
                cert: fs.readFileSync(props.certPemFile ? props.cert.certPemFile : path.join(__dirname, '..', '..', '..', '..', 'configuration', 'certs','cert.pem'), 'utf8')
            },
            xfwd: true,
            changeOrigin: true,
            secure: props.certs.verify
        }).listen(props.bootstrap.wsProxyPort, '0.0.0.0');
        proxy.on('error', function (err, req, res) {
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });

            res.end('Something went wrong. And we are reporting a custom error message.');
        });

        proxy.on('proxyRes', function (proxyRes, req, res) {
            console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
        });
        //console.log("Proxy listening on wss://0.0.0.0:%s", props.bootstrap.wsProxyPort)
        //SIGNAL SERVER PROXY
        httpProxy.createServer({
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
        }).listen(props.signal.proxyPort, "0.0.0.0");
    }
}

module.exports = VFuseProxy
