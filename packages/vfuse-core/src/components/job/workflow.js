'use strict'
/*
Here some consideration
- Workflow could have a Job DAG to represent the dependencies
- Job queue can be reprensented ad an array of arrays.
  Each level represent the jobs dependencies form previous level
  [[j1], [j2, j3]] => j2,j3 depend on j1 and they cannot be execute unitl j1 ends up
*/

const Constants = require("../constants");

class Workflow{
    //decomment in build
   /* static STATUS = {
        IDLE : 0,
        RUNNING : 1,
        COMPLETED : 2
    }*/

    constructor(results_dir, jobs_dir) {
        /*this.id = null
        this.status = Constants.WORKFLOW_STATUS.IDLE//Workflow.STATUS.IDLE
        this.jobs = []*/
        this.results_dir = results_dir
        this.jobs_dir = jobs_dir
    }

    addJob(job){
        //todo build execution array according to depedencies
        this.jobs.push(job)
    }
}
module.exports = Workflow