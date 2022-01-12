class JavascriptWorker{

    constructor() {

    }

    getWebWorker(){
        const JavascriptWebWorkerScript = require('./web/javascriptAsyncWebWorker')
        return new Worker(JavascriptWebWorkerScript);
    }

    getNodeWorker(runtime){
        const JavascriptNodeWorker = require('./node/javascriptNodeWorker')
        return new JavascriptNodeWorker(runtime)
    }

    getDefaultPackages(){
        return []
    }
}

module.exports = JavascriptWorker
