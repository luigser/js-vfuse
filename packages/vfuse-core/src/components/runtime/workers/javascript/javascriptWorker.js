const JavascriptNodeWorker = require('./node/javascriptNodeWorker')

class JavascriptWorker{

    constructor() {

    }

    getWebWorker(){
        const JavascriptWebWorkerScript = require('./web/javascriptAsyncWebWorker')
        return new Worker(JavascriptWebWorkerScript);
    }

    getNodeWorker(runtime){
        return new JavascriptNodeWorker(runtime)
    }

    getDefaultPackages(){
        return []
    }
}

module.exports = JavascriptWorker
