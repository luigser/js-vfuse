const _ = require('underscore')
const PeerId = require('peer-id')
const Constants = require("../constants");

class JobsDAGVertex{
    constructor(props) {
        this.id = props.id
        this.label = props.label
        this.job   = props.job
    }
}

class JobsDAG {
    constructor() {
        this.edges = new Map();
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
        if(!this.checkIfNodeExist(nodes, node.id))
           nodes.push({id : node.id, label: node.label})
        for (let n of this.edges.get(node)) {
            edges.push({from: node.id, to : n.id})
            this.treeVisit(n, nodes, edges)
        }
    }

    getJSON(){
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
        this.edges.set(v, []);
    }

    addEdge(v, w)
    {
        //check if edge generate a cycle
        this.edges.get(v).push(w);
    }

    addJob(job){
        try {
            let new_job_vertex = new JobsDAGVertex({id: job.id, label: job.name, job: job})
            this.addVertex(new_job_vertex)
            if (!job.dependencies || (_.isArray(job.dependencies) && job.dependencies.length === 0)) {
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
