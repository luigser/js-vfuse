'use strict'

const WebWorkerScript = require('./components/web/worker')

class PythonWorker{

    constructor() {
        //todo This should be improved by importing the js not the string
        this.webWorker = new Worker(URL.createObjectURL(
            new Blob([WebWorkerScript], {
                type: 'text/javascript',
            })
        ));
    }

    static getWebWorker(){
        return new PythonWorker().webWorker
    }
}

module.exports = PythonWorker