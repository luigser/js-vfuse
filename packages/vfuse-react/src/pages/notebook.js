import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row} from "antd";
import VFuse from "vfuse-core";
import {gStore} from "../store";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagic} from "@fortawesome/free-solid-svg-icons";
import CodeEditor from "../components/CodeEditor/codeEditor";

/*
//import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs/components/prism-core";
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-funky.css'*/

export default function NotebookPage(props){
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [runLocalLoading, setRunLocalLoading] = useState(true)
    const [publishNetworkLoading, setPublishNetworkLoading] = useState(true)
    const [saveWorkflowLoading, setSaveWorkflowLoading] = useState(true)
    const [vFuseNode, setVFuseNode] = useState(null)

    const [workflowId, setWorkflowId] = useState(props.workflowId ? props.workflowId : (props.location && props.location.params && props.location.params.workflowId) ? props.location.params.workflowId : "QmZtVKYKXXqL6QmqRjvVmvR17AVEVMTZsMR3auvYWQgmsR")

    const [code, setCode] = useState(
        `import numpy as np 
a = [[2, 0], [0, 2]]
b = [[4, 1], [2, 2]]
c = np.dot(a, b)
print(c)`
    );


    useEffect(() => {
        let node = gStore.get("vFuseNode")
        if(node){
            setVFuseNode(node)
            setStatus(VFuse.Constants.NODE_STATE.RUNNING)
            setRunLocalLoading(false)
            setPublishNetworkLoading(false)
            setSaveWorkflowLoading(false)
        }
    },[])

    const loadWorkflow = async () => {

    }

    const saveWorkflow = async () => {
        setSaveWorkflowLoading(true)
        let wid = await vFuseNode.createWorkflow('Test')
        await vFuseNode.addJob(wid, code, null, [])
        setWorkflowId(wid)
        setSaveWorkflowLoading(false)
    }

    const publishWorkflow = async () => {
        setPublishNetworkLoading(true)
        await vFuseNode.publishWorkflow(workflowId)
        setPublishNetworkLoading(false)
    }

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="VFuse Notebook"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === VFuse.Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === VFuse.Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
                        ]}
                        extra={[
                            <Button key="3" type="primary" disabled={!vFuseNode} loading={runLocalLoading}>Run in Local</Button>,
                            <Button key="2" type="info" disabled={!vFuseNode} loading={saveWorkflowLoading} onClick={saveWorkflow}>Save workflow</Button>,
                            <Button key="1" type="danger" disabled={!vFuseNode && !workflowId} loading={publishNetworkLoading} onClick={publishWorkflow}>Publish on Network</Button>,
                        ]}
                        avatar={ <FontAwesomeIcon icon={faMagic} className={"anticon"} />}
                        /*breadcrumb={{ routes }}*/
                    >
                        <Layout.Content
                            extraContent={
                                <img
                                    src="https://gw.alipayobjects.com/zos/antfincdn/K%24NnlsB%26hz/pageHeader.svg"
                                    alt="content"
                                    width="100%"
                                />
                            }
                        >
                        </Layout.Content>
                    </PageHeader>
                    <Descriptions layout="vertical" bordered>
                        <Descriptions.Item label="Profile ID">{vFuseNode?.profile?.id}</Descriptions.Item>
                        <Descriptions.Item label="Workflows numbers">{vFuseNode?.profile?.workflows.length}</Descriptions.Item>
                        <Descriptions.Item label="Rewards">{vFuseNode?.profile?.rewards} ETH</Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{marginTop: "24px"}}>
                    <Descriptions  layout="vertical" bordered>
                        <Descriptions.Item label="Code Editor">
                           {/* <Editor
                                value={code}
                                onValueChange={(code) => setCode(code)}
                                highlight={code => highlight(code, languages.py)}
                                padding={10}
                                style={{
                                    height: "62vh",
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 14,
                                    overflow: "scroll"
                                }}
                            />*/}
                            <CodeEditor code={code} setCode={setCode} />
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>
        </div>
    )
}
