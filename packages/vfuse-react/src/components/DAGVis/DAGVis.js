import React, { useState, useEffect } from 'react'
import Graph from "react-graph-vis";

export default function DAGVis(props) {

    const [graph, setGraph] = useState(props.jobsDAG)

    useEffect(() => {
        try {
            setGraph(props.jobsDAG)
        }catch (e) {
            console.log(e)
        }
    }, [props.jobsDAG])

    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                levelSeparation: 300,
                nodeSpacing: 60,
                treeSpacing: 100,
                blockShifting: true,
                parentCentralization: true,
                edgeMinimization: false,
                direction: "LR", // UD, DU, LR, RL
                sortMethod: "directed" // hubsize, directed
            }
        },
        nodes: {
            physics: true,
            shape: "box",
            font: {
                //face: "Circular, Futura",
                color: "#fff",
                size: 15
            },
            color: {
                border: "red"
            },
            margin: {
                top: 7,
                bottom: 7,
                left: 10,
                right: 10
            },
            mass: 1
        },
        edges: {
            width: 2,
            font: { align: "bottom", strokeWidth: 3, strokeColor: "#ffffff" },
            color: {
                color: "#cccccc",
                highlight: "#aabbee",
                hover: "#aaaaaa",
                inherit: "both",
                opacity: 1
            },
            arrowStrikethrough: false,
            // font: '12px arial #ff0000',
            scaling: {
                label: true
            },
            smooth: {
                enabled: true,
                type: "continuous",
                forceDirection: "horizontal"
            }
        },
        interaction: { hover: true },
        physics: {
            barnesHut: {
                centralGravity: 0.2
            },
            minVelocity: 0.1
        },
        //height: "800px",
        //width: "100%",
        /*groups: {
             selected: { color: { background: "#feff00" } },
            map: { color: { background: "#feff00" } },
            reduce: { color: { background: "#feff00" } }
        }*/
    };

    const events = {
        select: function(event) {
            let { nodes, edges } = event;
            //console.log(event)

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
