class JavascriptWorker{

    constructor() {}

    getDefaultPackages(){
        return []

    }

    getWebWorker(){
        const JavascriptWebWorkerScript = require('./web/javascriptWebWorker')
        return new Worker(JavascriptWebWorkerScript);
    }
}

module.exports = JavascriptWorker
