'use strict';
const path = require("path");

class JavascriptWorker{

    constructor() {

    }

    getWebWorker(){
        const JavascriptWebWorkerScript = require('./web/javascriptAsyncWebWorker')
        return new Worker(JavascriptWebWorkerScript);
    }

    getNodeWorker(workerData){
        const {isBrowser} = require("browser-or-node");
        const path = require('path')
        let lib = isBrowser ? '' : 'worker_threads'
        const {Worker} = require(lib)
        return new Worker(path.join(__dirname, 'node/javascriptNodeWorkerThread.js'), workerData)
    }

    getDefaultPackages(){
        return []
    }
}

module.exports = JavascriptWorker
