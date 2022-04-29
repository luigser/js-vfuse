const _ = require('underscore')
const PeerId = require('peer-id')
const ResultsUtils = require('../../utils/resultsUtils')
const Constants = require("../constants");
const Utils = require("../../utils/miscellaneous")

class JobsDAGVertex{
    constructor(props) {
        this.id = props.id
        this.label = props.label
        this.job   = props.job
        this.group = props.group
        this.color = props.color
        this.receivedResults = []
    }
}

class JobsDAG {

    static getReadyNodes = (JSONJobsDAG) =>  JSONJobsDAG.nodes.filter( n => n.job && (n.job.status === Constants.JOB.STATUS.READY || n.job.status === Constants.JOB.STATUS.ENDLESS))

    static getNodesToUpdate = (JSONJobsDAG) => JSONJobsDAG.nodes.filter(n => n.job &&
        (
            (n.job.status === Constants.JOB.STATUS.COMPLETED || n.job.status === Constants.JOB.STATUS.ERROR || n.job.status === Constants.JOB.STATUS.ENDLESS) ||
            (n.job.status === Constants.JOB.STATUS.READY && n.job.initialStatus === Constants.JOB.STATUS.WAITING)
        )
    )

    static getCompletedNodes = (JSONJobsDAG) => JSONJobsDAG.nodes.filter(n => n.job && (n.job.status === Constants.JOB.STATUS.COMPLETED || n.job.status === Constants.JOB.STATUS.ERROR /*|| n.job.status === Constants.JOB.STATUS.ENDLESS*/))

    static getOutputNodes(JSONJobDAG){
        //get all nodes with no children
        let outputNodes = JSONJobDAG.nodes.filter(n => {
            if(n.job && (n.job.status === Constants.JOB.STATUS.COMPLETED || n.job.status === Constants.JOB.STATUS.ENDLESS)){
                let edges = JSONJobDAG.edges.filter(e => e.from === n.id)
                if(edges.length === 0)
                    return n
            }
        })
        return outputNodes
    }

    static isRunningComplete(JSONJobsDAG){
        let outputNodes = JSONJobsDAG.getOutputNodes(JSONJobsDAG)
        for(let n of outputNodes){
            if(!n.job.results || n.job.results.length === 0)
                return false
        }
        return true
    }

    static setNodeState = (JSONJobsDAG, node, state, data) => {
        try {
            if (data.results && data.results.error) {
                node.job.status = Constants.JOB.STATUS.ERROR
                node.color = Utils.getColor(Constants.JOB.STATUS.ERROR)
                node.job.results = data.results
                return
            }
            //Maybe a not useful control
            if (state === Constants.JOB.STATUS.READY) return

            switch (state) {
                case Constants.JOB.STATUS.COMPLETED:
                    node.job.status = Constants.JOB.STATUS.COMPLETED
                    node.color = Utils.getColor(Constants.JOB.STATUS.COMPLETED)
                    node.job.results = data.results.results//ResultsUtils.combine(node.job.results, data.results.results)
                    node.job.executionTime = data.results.executionTime
                    break
                case Constants.JOB.STATUS.ENDLESS:
                    node.job.results = ResultsUtils.combine(node.job.results, data.results.results)
                    break
            }

            JobsDAG.updatesDependentNodes(JSONJobsDAG, node)

            /*let dependent_nodes = JSONJobsDAG.nodes.filter(n => n.job && (n.job.dependencies.indexOf(node.job.id) >= 0
                || n.job.dependencies.filter(d => (new RegExp(d)).test(node.job.name) || new RegExp(d).test(node.job.group)).length > 0)
            )
            for (let dependent_node of dependent_nodes) {
                if (!dependent_node.job.resultsForJobs.find(r => r === node.job.id)) {
                    dependent_node.job.data = ResultsUtils.combine(dependent_node.job.data, node.job.results)
                    dependent_node.job.resultsForJobs.push(node.job.id)
                }
                let isReady = true
                for (let dep of dependent_node.job.dependencies) {
                    let dns = JSONJobsDAG.nodes.filter(nd => nd.id === dep || (new RegExp(dep)).test(nd.label) || (new RegExp(dep).test(nd.group)))
                    for (let nx of dns) {
                        if (!nx.job.results || nx.job.results.length === 0) isReady = false
                    }
                }
                if (isReady && dependent_node.job.status !== Constants.JOB.STATUS.ENDLESS) {
                    dependent_node.job.status = Constants.JOB.STATUS.READY
                    dependent_node.color = Utils.getColor(Constants.JOB.STATUS.READY)
                }
            }*/
        }catch (e) {
            console.log("Boom : %O", e)
        }
    }

    static setRunningNodeState(JSONJobsDAG, local_node, results_node){
        local_node.job = results_node.job
        JobsDAG.updatesDependentNodes(JSONJobsDAG, local_node)
    }

    static updatesDependentNodes(JSONJobsDAG, node){
        let dependent_nodes = JSONJobsDAG.nodes.filter(n => n.job && (n.job.dependencies.indexOf(node.job.id) >= 0
            || n.job.dependencies.filter(d => (new RegExp(d)).test(node.job.name) || new RegExp(d).test(node.job.group)).length > 0)
        )
        for (let dependent_node of dependent_nodes) {
            if (!dependent_node.job.resultsForJobs.find(r => r === node.job.id)) {
                dependent_node.job.data = ResultsUtils.combine(dependent_node.job.data, node.job.results)
                dependent_node.job.resultsForJobs.push(node.job.id)
            }
            let isReady = true
            for (let dep of dependent_node.job.dependencies) {
                let dns = JSONJobsDAG.nodes.filter(nd => nd.id === dep || (new RegExp(dep)).test(nd.label) || (new RegExp(dep).test(nd.group)))
                for (let nx of dns) {
                    if (!nx.job.results || nx.job.results.length === 0) isReady = false
                }
            }
            if (isReady && dependent_node.job.status !== Constants.JOB.STATUS.ENDLESS) {
                dependent_node.job.status = Constants.JOB.STATUS.READY
                dependent_node.color = Utils.getColor(Constants.JOB.STATUS.READY)
            }
        }
    }

    static combineResults(node1, node2){
        node1.job.results = ResultsUtils.combine(node1.job.results, node2.job.results)
    }

    static compare(dag1, dag2){
        let dag1_ready_nodes = JobsDAG.getReadyNodes(dag1)
        let dag2_ready_nodes = JobsDAG.getReadyNodes(dag2)
        if(dag1_ready_nodes.length === dag2_ready_nodes.length){
            for(let i=0; i < dag1_ready_nodes.length; i++) {
                if (dag1_ready_nodes[i].id !== dag2_ready_nodes[i].id) return 3
            }
        }else if(dag1_ready_nodes.length > dag2_ready_nodes.length)
            return 1
        else if(dag1_ready_nodes.length < dag2_ready_nodes.length)
           return 2
        return 0

    }

    constructor() {
        this.edges = new Map();
        this.vertices = new Map()
        this.root = new JobsDAGVertex({id : 'root', label: 'root', job : null, color : '#838383'})
        this.addVertex(this.root)
    }

    getVertexById(node, id){
        if(node.id === id){
            return node
        }else if(this.edges.get(node).length > 0){
            let result = null
            for (let n = 0; result === null && n < this.edges.get(node).length; n++) {
                result = this.getVertexById(this.edges.get(node)[n], id)
            }
            return result
        }
        return null
    }

    getNodeById(id){
        return  this.vertices.get(id)
    }

    checkIfNodeExist(nodes, id){
        for(let n in nodes){
            if(nodes[n].id === id) return true
        }
        return false
    }

    treeVisit(node, nodes = [], edges = []){
        if(!this.checkIfNodeExist(nodes, node.id)) {
            let color = '#838383'
            if(node.job) {
                color = Utils.getColor(node.job.status)
            }
            nodes.push({
                id: node.id,
                label: node.label,
                color: color,
                job: node.job,
                group : node.group
            })
        }
        for (let n of this.edges.get(node)) {
            edges.push({from: node.id, to : n.id})
            this.treeVisit(n, nodes, edges)
        }
    }

    toJSON(){
       let nodes = [], edges = []
       this.treeVisit(this.root, nodes, edges)
       return { nodes : nodes, edges : edges }
    }

    addVertexByLabel(node, dependency, vertex){
        let adjList = this.edges.get(node)
        if(dependency.test(node.label) || dependency.test(node.group)){
            this.addEdge(node, vertex)
        }else if(adjList.length > 0){
            for (let n = 0; n < adjList.length; n++) {
                this.addVertexByLabel(adjList[n], dependency, vertex)
            }
        }
    }

    addVertex(v)
    {
        this.vertices.set(v.id, v)
        this.edges.set(v, []);
    }

    addEdge(source, destination)
    {
        //check if edge generate a cycle
        this.edges.get(source).push(destination);
    }

    addJob(job){
        try {
            let new_job_vertex = new JobsDAGVertex({id: job.id, label: job.name, job: job, group : job.group})
            this.addVertex(new_job_vertex)
            if (!job.dependencies || (_.isArray(job.dependencies) && job.dependencies.length === 0)) {
                new_job_vertex.job.status = Constants.JOB.STATUS.READY
                new_job_vertex.job.initialStatus = Constants.JOB.STATUS.READY
                this.addEdge(
                    this.root,
                    new_job_vertex
                )
            } else {
                if(!_.isArray(job.dependencies)) throw 'Dependencies parameter must be an array';
                job.dependencies.map(dependency => {
                    let isJobId = false
                    try {
                        PeerId.createFromB58String(dependency)
                        isJobId = true
                    }catch (e){}
                    if(isJobId){
                        //let node = this.getVertexById(this.root, dependency)
                        let node = this.vertices.get(dependency)
                        this.addEdge(
                            node,
                            new_job_vertex
                        )
                    }else{
                        this.addVertexByLabel(this.root, new RegExp(dependency), new_job_vertex)
                    }
                })
            }
            return new_job_vertex
        }catch (e) {
            console.log('Error during adding job to DAG : %O', e)
            return null
        }
    }

    setEndlessJob(job_id){
        try{
            let vertex = this.vertices.get(job_id)
            if(vertex){
                vertex.job.status = Constants.JOB.STATUS.ENDLESS
                vertex.job.initialStatus = Constants.JOB.STATUS.ENDLESS
                vertex.color = Utils.getColor(Constants.JOB.STATUS.ENDLESS)
                return vertex.job.id
            }else{
                return null
            }
        }catch (e) {
            console.log('Error during setting endless job : %O', e)
            return null
        }
    }

    setJobReturnType(job_id, type){
        try{
            let vertex = this.vertices.get(job_id)
            if(vertex){
                switch (type){
                    case Constants.JOB.RETURN_TYPES.ARRAY:
                        vertex.job.results = []
                        break
                    case Constants.JOB.RETURN_TYPES.INTEGER:
                        vertex.job.results = 0
                        break
                    case Constants.JOB.RETURN_TYPES.OBJECT:
                        vertex.job.results = {}
                }
                return vertex.job.id
            }else{
                return null
            }
        }catch (e) {
            console.log('Error during setting job return type : %O', e)
            return null
        }

    }

    addJobToGroup(job_id, group){
        try{
            let vertex = this.vertices.get(job_id)
            if(vertex){
                vertex.group = group
                return vertex.id
            }else{
                return null
            }
        }catch (e) {
            console.log('Error during setting group to job : %O', e)
            return null
        }
    }
}

module.exports = {JobsDAGVertex, JobsDAG}
