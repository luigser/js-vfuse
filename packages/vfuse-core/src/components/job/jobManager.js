'use strict'

const log = require('debug')('vfuse:jobmanager')
const Runtime = require('./runtime')
/*
JobManager is responsible for job management and execution
 */
class JobManager{
    /**
     * @param {Object} network
     * @param {Object} options
     */
    constructor(network, options){
        try {
            this.net = network
            this.runtime = new Runtime(options.worker, options.packages)
        }catch(e){
            log('Got some error during runtime initialization: %O', e)
        }
    }

    async start(){
        await this.runtime.init()
        await this.runtime.load()
    }
}

module.exports = JobManager