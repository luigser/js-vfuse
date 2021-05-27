'use strict'

class Workflow{
    static STATUS = {
        IDLE : 0,
        RUNNING : 1,
        COMPLETED : 2
    }

    constructor(jobs) {
        this.status = Workflow.STATUS.IDLE
        this.jobs = jobs || []
    }

    addJob(job){
        this.jobs.push(job)
    }
}
module.exports = Workflow