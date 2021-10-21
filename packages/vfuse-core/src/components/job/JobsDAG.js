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

    static getReadyNodes = (JSONJobDAG) => {
        return JSONJobDAG.nodes.filter( n => n.job && n.job.status === Constants.JOB_SATUS.READY)
    }

    static setNodeState = (JSONJobDAG, node, state, data) => {
        switch(state){
            case Constants.JOB_SATUS.COMPLETED:
                node.job.status = Constants.JOB_SATUS.COMPLETED
                node.color = Constants.JOB_SATUS.COLORS.COMPLETED
                node.job.results.push(data.cid)
                //TODO per i vertici label verificare che tutti i nodi dipendenti abbiamo un risultato
                let results = [], isReady = true
                for(let n of JSONJobDAG.nodes){
                    if(n.job){
                        for(let dependency of node.job.dependencies){
                            let isJobId = false
                            try {
                                PeerId.createFromB58String(dependency)
                                isJobId = true
                            }catch (e){}
                            if(isJobId) {
                                n.job.status = Constants.JOB_SATUS.READY
                                n.color = Constants.JOB_SATUS.COLORS.READY
                                results = [...results, ...data.results]
                            }else{
                                let dep_nodes = JSONJobDAG.nodes.filter(n => n.label === dependency)
                                for(let d of dep_nodes){
                                    if(d.job.result.length === 0) isReady = false
                                    else results = [...results, ...d.job.result]
                                }
                                if(isReady){
                                    n.job.status = Constants.JOB_SATUS.READY
                                    n.color = Constants.JOB_SATUS.COLORS.READY
                                    n.job.data = results
                                }
                            }
                        }
                    }
                }

                /*for(let n of JSONJobDAG.nodes){
                    if(n.job && (n.job.dependencies.indexOf(node.job.id) >= 0 || n.job.dependencies.indexOf(node.label) >= 0)){
                        n.job.status = Constants.JOB_SATUS.READY
                        n.color = Constants.JOB_SATUS.COLORS.READY
                        n.job.data = data.results
                    }
                }*/
                break
        }
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
