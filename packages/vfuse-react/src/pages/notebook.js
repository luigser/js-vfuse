import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row, notification} from "antd";
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

const javascriptCodeExample = "let input = \"VERY_BIG_TEXT\"\n" +
    "let input = VFuse.getData('http://GATEWAY/ipfs/CID', start, end, VFuse.DATA.Type.String)\n" +
    "\n" +
    "function map(data){\n" +
    "   let tokens = []\n" +
    "   data.split(/\\W+/).map(word => token.push({ word : word , count : 1 })\n" +
    "   return token\n" +
    "}\n" +
    "\n" +
    "function reduce(data){\n" +
    "   let reduced = new Map()\n" +
    "   data.map( entry => reduced.set(entry.word, reduced.has(entry.word) ? entry.get(entry.word) + 1 : 1))\n" +
    "   return reduced\n" +
    "}\n" +
    "\n" +
    "function combine(data){\n" +
    "   let result = new Map()\n" +
    "   data.map( entry => reduced.set(entry.word, result.has(entry.word) ? entry.get(entry.word) + 1 : 1))\n" +
    "   return result\n" +
    "}\n" +
    "\n" +
    "input.split(\"/n\").map(row => {\n" +
    "   let mapped = VFuse.addJob(map, row)\n" +
    "   VFuse.addJob(reduce, mapped, [map])//generate a reduce for each map\n" +
    "})\n" +
    "\n" +
    "VFuse.addJob(combine, null, [reduce])//wait for all reduce results and cal combine"

const pythonCodeExample = `import numpy as np 
a = [[2, 0], [0, 2]]
b = [[4, 1], [2, 2]]
c = np.dot(a, b)
print(c)`

export default function NotebookPage(props){
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [runLocalLoading, setRunLocalLoading] = useState(true)
    const [publishNetworkLoading, setPublishNetworkLoading] = useState(true)
    const [saveWorkflowLoading, setSaveWorkflowLoading] = useState(true)
    const [vFuseNode, setVFuseNode] = useState(null)
    const [workflowId, setWorkflowId] = useState(props.workflowId ? props.workflowId : (props.location && props.location.params && props.location.params.workflowId) ? props.location.params.workflowId : null)
    const [code, setCode] = useState(javascriptCodeExample);
    const [language, setLanguage] = useState(VFuse.Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT)
    const [name, setName] = useState(null)
    const [profile, setProfile] = useState(null)


    useEffect(() => {
        let node = gStore.get("vFuseNode")
        if(node){
            setVFuseNode(node)
            setStatus(VFuse.Constants.NODE_STATE.RUNNING)
            setRunLocalLoading(false)
            setPublishNetworkLoading(false)
            setSaveWorkflowLoading(false)
            setProfile(node.getProfile())

            if(workflowId){
                let workflow = node.getWorkflow(workflowId)
                setName(workflow.name)
                setCode(workflow.code)
            }
        }
    },[])

    const loadWorkflow = async () => {

    }

    const saveWorkflow = async () => {
        if(!name){
            notification.error({
                message : "Something went wrong",
                description : 'Give a title to you workflow please !!!'
            });
        }else{
            setSaveWorkflowLoading(true)
            let wid = await vFuseNode.saveWorkflow(workflowId, name, code, language)
            if(!wid){
                notification.error({
                    message : "Something went wrong",
                    description : 'Some problems occurred during saving workflow'
                });
            }else{
                notification.info({
                    message : "Info",
                    description : 'Your workflow was successfully saved'
                });
            }
            setWorkflowId(wid)
            setSaveWorkflowLoading(false)
        }
    }

    const publishWorkflow = async () => {
        setPublishNetworkLoading(true)
        await vFuseNode.publishWorkflow(workflowId)
        setPublishNetworkLoading(false)
    }

    const onChaneName = (e) => setName(e.target.value)

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
                        <Descriptions.Item label="IdentityManager ID">{profile?.id}</Descriptions.Item>
                        <Descriptions.Item label="Workflows numbers">{profile?.workflows.length}</Descriptions.Item>
                        <Descriptions.Item label="Rewards">{profile?.rewards} ETH</Descriptions.Item>
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
                            <Row style={{margin: 16}}>
                                <Col span={4}>
                                    <Typography.Text strong>Workflow Id : </Typography.Text>
                                </Col>
                                <Col span={20}>
                                    {workflowId}
                                </Col>
                            </Row>
                            <Row style={{margin: 16}}>
                                <Col span={4}>
                                    <Typography.Text strong>Workflow Title : </Typography.Text>
                                </Col>
                                <Col span={20}>
                                    <Input placeholder="Workflow title" onChange={onChaneName} value={name} />
                                </Col>
                            </Row>
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{height: "50vh", overflow: "scroll"}}>
                    <CodeEditor code={code} setCode={setCode} language={language} setLanguage={setLanguage}/>
                </Col>
            </Row>
        </div>
    )
}
