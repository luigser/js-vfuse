import React, { useState, useEffect } from 'react'
import Graph from "react-graph-vis";
import NodeModal from "../modals/nodeModal";
import { Statistic, Row, Col } from 'antd';

export default function DAGVis(props) {

    const [graph, setGraph] = useState(props.jobsDAG)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [currentNode, setCurrentNode] = useState(null)

    useEffect(() => {
        try {
            //GENERATE A NEW GRAPH KEY EVERY TIME THE GRAPH CHANGE
            //TO AVOID ERROR
            //SOLVED REMOVING STRICT MODE IN INDEX APP
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
            physics: false,
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
            mass: 0.3
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
            let node = graph.nodes.filter(n => n.id === nodes[0])
            if(node.length === 1 && node[0].job) {
                node = node[0]
                setCurrentNode(node)
                setIsModalVisible(true)
                let status
                switch (node.job.status) {
                    case 2:
                        status = 'COMPLETED'
                        break
                    case 1:
                        status = 'READY'
                        break
                    case 0:
                        status = 'WAITING'
                        break
                }
                //console.info("NAME : %s\nSTATUS : %s\nID : %s\nDATA : %O\nRESULTS: %O", node.label, status,  node.id, node.job.data, node.job.results)
            }

        }
    };

    return (
        <>
            {graph &&
                <>
                    <Row gutter={16}>
                        <Col span={4}>
                            <Statistic title="Jobs" value={graph.nodes.length} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="Dependencies" value={graph.edges.length} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="Waiting" value={graph.nodes.filter(n=>n.job && n.job.status === 0).length} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="Ready" value={graph.nodes.filter(n=>n.job && n.job.status === 1).length} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="Completed" value={graph.nodes.filter(n=>n.job && n.job.status === 2).length} />
                        </Col>
                    </Row>
                    <Graph
                        graph={graph}
                        options={options}
                        events={events}
                        getNetwork={network => {
                            //  if you want access to vis.js network api you can set the state in a parent component using this property
                        }}
                    />
                </>
            }
            <NodeModal setVisible={setIsModalVisible} node={currentNode} isVisible={isModalVisible}/>
        </>
    )

}
