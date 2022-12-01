'use strict'
/*
Here some consideration
- Workflow could have a Job DAG to represent the dependencies
- Job queue can be represented ad an array of arrays.
  Each level represent the jobs dependencies form previous level
  [[j1], [j2, j3]] => j2,j3 depend on j1 and they cannot be execute unitl j1 ends up
*/

const Constants = require ("../constants")

class Workflow{
    //decomment in build
   /* static STATUS = {
        IDLE : 0,
        RUNNING : 1,
        COMPLETED : 2
    }*/

    constructor(id, name = '', code, language, jobsDAG, scheduling) {
        this.timestamp = Date.now()
        this.ownerId = null
        this.id = id
        this.name = name
        this.code = code
        this.language = language
        this.jobsDAG = jobsDAG
        this.functions = []
        this.submittedAt = null
        this.completedAt = null
        this.numOfReceivedResults = 0
        this.scheduling = scheduling ? scheduling : Constants.WORKFLOW.SCHEDULING.BALANCED
        this.input = null
    }
}
module.exports = Workflow
