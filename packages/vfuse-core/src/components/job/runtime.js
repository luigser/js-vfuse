'use strict'
// mainly a Pyodide wrapper class now
// but will serve as an abstraction around
// any Wasm language module
class Runtime {
    constructor(worker, packages) {
        this.count = 0
        this.id =  this.getRandomBetween(0,1000)
        this.history = []
        this.value = null
        this.defaultPackages = ['numpy']
        this.packages = [...this.defaultPackages, ...packages]
        this.worker = worker

        // attach web worker callbacks
        this.worker.onerror = (e) => {
            console.log(
                `Error in worker ${this.id} at ${e.filename}, Line: ${e.lineno}, ${e.message}`
            );
        };
    }

    getRandomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    history() {
        return this.history.map((x) => x.cmd).join('\n');
    }

    init() {
        // initialize Runtime
        const promise = new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { action } = e.data;
                if (action === 'initialized') {
                    resolve(this);
                } else {
                    reject(new Error('Runtime initialization failed'));
                }
            };
        });
        this.worker.postMessage({ action: 'init' });
        return promise;
    }

    load() {
        // preload packages
        const promise = new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { action } = e.data;
                if (action === 'loaded') {
                    resolve(this);
                } else {
                    reject(new Error('Package preloading failed'));
                }
            };
        });

        this.worker.postMessage({ action: 'load', packages: this.packages });
        return promise;
    }

    async restart() {
        const startTs = Date.now();

        this.worker.terminate();
        this.packages.clear();

        await this.init();
        await this.load(this.packages);

        const log = { start: startTs, end: Date.now(), cmd: '$RESTART SESSION$' };
        this.history.push(log);
    }

    exec(code) {
        const promise = new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { action, results } = e.data;
                if (action === 'return') {
                    resolve(results);
                } else if (action === 'error') {
                    reject(results);
                } else {
                    reject(new Error('Unknown Pyodide worker response'));
                }
            };
        });

        this.worker.postMessage({
            action: 'exec',
            code,
        });
        return promise;
    }

    async run(code) {
        const startTs = Date.now();
        this.value = await this.exec(code);

        const log = { start: startTs, end: Date.now(), cmd: code };
        this.history.push(log);

        return this;
    }
}

module.exports = Runtime