import React, { useState, useEffect } from 'react'
import Graph from "react-graph-vis";

export default function DAGVis(props) {

    const [graph, setGraph] = useState(props.jobsDAG)

    useEffect(() => {
        try {
            let dag = graph.getJSON()
            setGraph(dag)
        }catch (e) {
            console.log(e)
        }
    }, [props.jobsDAG])

    const options = {
        layout: {
            hierarchical: false
        },
        edges: {
            color: "#000000"
        },
        /*height: "500px"*/
    };

    const events = {
        select: function(event) {
            let { nodes, edges } = event;
        }
    };

    return (
        <>
            {graph &&
                <Graph
                    graph={graph}
                    options={options}
                    events={events}
                    getNetwork={network => {
                        //  if you want access to vis.js network api you can set the state in a parent component using this property
                    }}
                />
            }
        </>
    )

}
