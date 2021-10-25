const _ = require('underscore')
const PeerId = require('peer-id')
const ResultsUtils = require('../../utils/resultsUtils')
const Constants = require("../constants");

class JobsDAGVertex{
    constructor(props) {
        this.id = props.id
        this.label = props.label
        this.job   = props.job
    }
}

class JobsDAG {

    static getReadyNodes = (JSONJobDAG) => {
        return JSONJobDAG.nodes.filter( n => n.job && n.job.status === Constants.JOB_SATUS.READY)
    }

    static setNodeState = (JSONJobDAG, node, state, data) => {
        switch(state){
            case Constants.JOB_SATUS.COMPLETED:
                if(data.results.error){
                    node.job.status = Constants.JOB_SATUS.ERROR
                    node.color = Constants.JOB_SATUS.COLORS.ERROR
                    node.job.results = data.results
                    return
                }

                node.job.status = Constants.JOB_SATUS.COMPLETED
                node.color = Constants.JOB_SATUS.COLORS.COMPLETED
                node.job.results = ResultsUtils.combine(node.job.results, data.results)
                let dependent_nodes = JSONJobDAG.nodes.filter( n => n.job && (n.job.dependencies.indexOf(node.job.id) >= 0 || n.job.dependencies.indexOf(node.job.name) >= 0))
                for(let dependent_node of dependent_nodes){
                    dependent_node.job.data = ResultsUtils.combine(dependent_node.job.data, node.job.results)
                    let isReady = true
                    for(let dep of dependent_node.job.dependencies){
                        let dns = JSONJobDAG.nodes.filter(nd => nd.id === dep || nd.label === dep)
                        for(let nx of dns) {
                            if (nx.job.results.length === 0) isReady = false
                        }
                    }
                    if(isReady){
                        dependent_node.job.status = Constants.JOB_SATUS.READY
                        dependent_node.color = Constants.JOB_SATUS.COLORS.READY
                    }
                }
                break
        }
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
        this.root = new JobsDAGVertex({id : 'root', label: 'root', job : null})
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
                switch (node.job.status) {
                    case Constants.JOB_SATUS.WAITING:
                        color = Constants.JOB_SATUS.COLORS.WAITING
                        break
                    case Constants.JOB_SATUS.COMPLETED:
                        color = Constants.JOB_SATUS.COLORS.COMPLETED
                        break
                    case Constants.JOB_SATUS.ERROR:
                        color = Constants.JOB_SATUS.COLORS.ERROR
                        break
                    case Constants.JOB_SATUS.READY:
                        color = Constants.JOB_SATUS.COLORS.READY
                        break
                }
            }
            nodes.push({
                id: node.id,
                label: node.label,
                color: color,
                job: node.job
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
        if(node.label === dependency){
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
            let new_job_vertex = new JobsDAGVertex({id: job.id, label: job.name, job: job})
            this.addVertex(new_job_vertex)
            if (!job.dependencies || (_.isArray(job.dependencies) && job.dependencies.length === 0)) {
                new_job_vertex.job.status = Constants.JOB_SATUS.READY
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
                        let node = this.getVertexById(this.root, dependency)
                        this.addEdge(
                            node,
                            new_job_vertex
                        )
                    }else{
                        this.addVertexByLabel(this.root, dependency, new_job_vertex)
                    }
                })
            }
            return new_job_vertex
        }catch (e) {
            console.log('Error during adding job to DAG : %O', e)
            return null
        }
    }
}

module.exports = {JobsDAGVertex, JobsDAG}
