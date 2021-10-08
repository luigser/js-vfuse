class JavascriptWorker{

    constructor() {

    }

    getWebWorker(){
        const JavascriptWebWorkerScript = require('./web/javascriptAsyncWebWorker')
        return new Worker(JavascriptWebWorkerScript);
    }

    getDefaultPackages(){
        return []

    }
}

module.exports = JavascriptWorker
