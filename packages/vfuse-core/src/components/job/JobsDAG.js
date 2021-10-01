class JobsDAGVertex{
    constructor(props) {
        this.id = props.id
        this.label = props.label
        this.job   = props.job
    }
}

class JobsDag {
    constructor(noOfVertices) {
        this.noOfVertices = noOfVertices;
        this.AdjList      = new Map();
    }

    addVertex(v)
    {
        this.AdjList.set(v, []);
    }

    addEdge(v, w)
    {
        //check if edge generate a cycle
        this.AdjList.get(v).push(w);
        this.AdjList.get(w).push(v);
    }
}

module.exports = {JobsDAGVertex, JobsDag}
