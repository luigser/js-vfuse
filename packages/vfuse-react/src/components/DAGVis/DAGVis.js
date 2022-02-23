import React, { useState, useEffect } from 'react'
import Graph from "react-graph-vis";
import NodeModal from "../modals/nodeModal";
import { Statistic, Row, Col } from 'antd';

export default function DAGVis(props) {

    const [graph, setGraph] = useState(props.jobsDAG)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [currentNode, setCurrentNode] = useState(null)
    const [selectedGroup, setSelectedGroup] = useState('None')

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
            borderWidth: 1,
            borderWidthSelected : 3,
            physics: props.jobsDAG ? props.jobsDAG.nodes.length < 50 : false,
            shape: "box",
            font: {
                //face: "Circular, Futura",
                color: "#fff",
                size: 15
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
        groups: {
        },
        clustering: {
            initialMaxNodes: 100,
            clusterThreshold:500,
            reduceToNodes:300,
            chainThreshold: 0.4,
            clusterEdgeThreshold: 20,
            sectorThreshold: 100,
            screenSizeThreshold: 0.2,
            fontSizeMultiplier:  4.0,
            maxFontSize: 1000,
            forceAmplification:  0.1,
            distanceAmplification: 0.1,
            edgeGrowth: 20,
            nodeScaling: {width:  1,
                height: 1,
                radius: 1},
            maxNodeSizeIncrements: 600,
            activeAreaBoxSize: 100,
            clusterLevelDifference: 2
        }
    }

    const highlightGroup = (node, active) => {
        let group = graph.nodes.filter(n => n.group !== node.group)
        for(let n of group) {
            if(active){
                n.prevColor = n.color
                n.color =  '#83838380'
            }else{
                n.color = n.prevColor
            }
        }

        setGraph({nodes: [], edges: []})
        setSelectedGroup(active ? node.group : 'None')
        setGraph(graph)

    }

    const events = {
        selectNode: function(event) {
            let node = graph.nodes.filter(n => n.id === event.nodes[0])[0]
            if (node.job) {
                setCurrentNode(node)
                highlightGroup(node, true)
                setIsModalVisible(true)
            }
        },
        deselectNode: function(event){
            if(currentNode)
               highlightGroup(currentNode, false)
        }
    }

    return (
        <>
            {graph &&
                <>
                    <Row gutter={30}>
                        <Col span={3}>
                            <Statistic title="Jobs" value={graph.nodes.length - 1} />
                        </Col>
                        <Col span={3}>
                            <Statistic title="Dependencies" value={graph.edges.length} />
                        </Col>
                        <Col span={3}>
                            <Statistic title="Waiting" value={graph.nodes.filter(n=>n.job && n.job.status === 0).length} />
                        </Col>
                        <Col span={3}>
                            <Statistic title="Ready" value={graph.nodes.filter(n=>n.job && n.job.status === 1).length} />
                        </Col>
                        <Col span={3}>
                            <Statistic title="Completed" value={graph.nodes.filter(n=>n.job && n.job.status === 2).length} />
                        </Col>
                        <Col span={3}>
                            <Statistic title="Endless" value={graph.nodes.filter(n=>n.job && n.job.status === 4).length} />
                        </Col>
                        <Col span={3}>
                            <Statistic title="Selected Group" value={selectedGroup} />
                        </Col>
                    </Row>
                    <Graph
                        graph={graph}
                        options={options}
                        events={events}
                        getNetwork={network => {
                            /*let options = {
                                joinCondition:function(nodeOptions) {
                                    return nodeOptions.group === 'map';
                                },
                                clusterNodeProperties: {
                                    allowSingleNodeCluster: true
                                }
                            }

                            network.clustering.cluster(options);*/
                        }}
                    />
                </>
            }
            <NodeModal setVisible={setIsModalVisible} node={currentNode} isVisible={isModalVisible}/>
        </>
    )

}
