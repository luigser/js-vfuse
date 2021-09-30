class JavascriptWorker{
    static getWebWorker(){
        const JavascriptWebWorkerScript = require('./web/javascriptWebWorker')
        return new Worker(JavascriptWebWorkerScript);
    }
}

module.exports = JavascriptWorker
