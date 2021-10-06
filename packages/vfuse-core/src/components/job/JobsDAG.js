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
        this.addVertex(new JobsDAGVertex({id : 'root', label: 'root', job : null}))
    }

    getVertexById(id){
        return this.edges.get(id)
    }

    getVertexByLabel(label){

    }

    addVertex(v)
    {
        this.edges.set(v, []);
    }

    addEdge(v, w)
    {
        //check if edge generate a cycle
        this.edges.get(v).push(w);
        this.edges.get(w).push(v);
    }
}

module.exports = {JobsDAGVertex, JobsDAG}
