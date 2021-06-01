'use strict'
const log = require('debug')('vfuse:results')
class Results{
    constructor(workflowId, jobs) {
        try {
            this.workflowId = workflowId
            this.results = new Map()
            for (let j in jobs)
                this.results.set(jobs[j].id, null)
        }catch (e){
            log('Got some error during result creation: %O', e)
        }
    }

    update(jobId, results){
        this.results.set(jobId, results)
    }

    get(jobId){
        this.results.get(jobId)
    }


}