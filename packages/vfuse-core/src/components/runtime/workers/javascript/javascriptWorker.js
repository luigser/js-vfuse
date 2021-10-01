class JavascriptWorker{

    constructor() {
        const JavascriptWebWorkerScript = require('./web/javascriptWebWorker')
        this.webWorker = new Worker(JavascriptWebWorkerScript);
    }

    getDefaultPackages(){
        return []

    }
}

module.exports = JavascriptWorker
