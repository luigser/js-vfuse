import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row, notification, Select, Tabs} from "antd";
import VFuse from "vfuse-core";
import {gStore} from "../store";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagic} from "@fortawesome/free-solid-svg-icons";
//import CodeEditor from "../components/CodeEditor/codeEditor";
import VFuseCodeEditor from "../components/CodeEditor/vFuseCodeEditor";
import DAGVis from "../components/DAGVis/DAGVis";

/*
//import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs/components/prism-core";
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-funky.css'*/

const javascriptCodeExample = "let input = \"VERY_BIG_TEXT\"\n" +
    "function map(data){\n" +
    "   let tokens = []\n" +
    "   data.split(/\\W+/).map(word => tokens.push({ word : word , count : 1 }))\n" +
    "   return tokens\n" +
    "}\n" +
    "\n" +
    "function reduce(data){\n" +
    "   let reduced = new Map()\n" +
    "   data.map( entry => reduced.set(entry.word, reduced.has(entry.word) ? reduced.get(entry.word) + 1 : 1))\n" +
    "   return reduced\n" +
    "}\n" +
    "\n" +
    "function combine(data){\n" +
    "   let result = new Map()\n" +
    "   for(let key of data.keys())\n" +
    "      result.set(key, result.has(key) ? result.get(key) + 1 : 1)\n" +
    "   return result\n" +
    "}\n" +
    "\n" +
    "input = input.split(\"\\n\")\n" +
    "let reduced_results = []\n" +
    "for (let row in input){\n" +
    "   let mapped = await VFuse.addJob(map, [], input[row])\n" +
    "   let reduced = await VFuse.addJob(reduce, [mapped])\n" +
    "   reduced_results.push(mapped)\n" +
    "}\n" +
    "let result = await VFuse.addJob(combine, ['reduce'])//wait for all reduce results and call combine"

const pythonCodeExample = `input = """I'm learning Python.
I refer to TechBeamers.com tutorials.
It is the most popular site for Python programmers."""

def map(data):
    return data
    
for x in input.splitlines():
   VFuse.addJob(map, [], x)`

export default function NotebookPage(props){
    const [vFuseNode, setVFuseNode] = useState(null)
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [runLocalLoading, setRunLocalLoading] = useState(false)
    const [publishNetworkLoading, setPublishNetworkLoading] = useState(false)
    const [unpublishNetworkLoading, setUnpublishNetworkLoading] = useState(false)
    const [saveWorkflowLoading, setSaveWorkflowLoading] = useState(false)
    const [workflowId, setWorkflowId] = useState(props.workflowId ? props.workflowId : (props.location && props.location.params && props.location.params.workflowId) ? props.location.params.workflowId : null)
    const [code, setCode] = useState(javascriptCodeExample);
    const [language, setLanguage] = useState(VFuse.Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT)
    const [name, setName] = useState(null)
    const [profile, setProfile] = useState(null)
    const [dag, setDag] = useState(null)
    const [fontSize, setFontSize] = useState(14)
    const [isPublished, setIsPublished] = useState(false)


    useEffect(() => {
        const init = async() =>
        {
            let node = gStore.get("vFuseNode")
            if (node) {
                setVFuseNode(node)
                setStatus(VFuse.Constants.NODE_STATE.RUNNING)
                setRunLocalLoading(false)
                setPublishNetworkLoading(false)
                setSaveWorkflowLoading(false)
                setProfile(node.getProfile())
                node.registerCallbacks(null, updateWorkflowCallback)

                if (workflowId) {
                    let workflow = await node.getWorkflow(workflowId)
                    setName(workflow.name)
                    setCode(workflow.code)
                    setDag(workflow.jobsDAG)
                    setLanguage(workflow.language)
                    setIsPublished(workflow.published)
                }
            }
        }

        init()
    },[])

    const updateWorkflowCallback = (workflow) => {
        if(workflow.id === workflowId) {
            let dag = workflow.jobsDAG
            setDag({nodes: [], edges: []})
            setDag(dag)
        }
    }

    const saveWorkflow = async () => {
        if(!name){
            notification.error({
                message : "Something went wrong",
                description : 'Give a title to you workflow please !!!'
            });
        }else{
            setSaveWorkflowLoading(true)
            let workflow = await vFuseNode.saveWorkflow(workflowId, name, code, language)
            if(workflow.error){
                notification.error({
                    message : "Something went wrong",
                    description : workflow.error.message ? workflow.error.message : workflow.error.toString()
                });
            }else{
                setDag(workflow.jobsDAG)
                setWorkflowId(workflow.id)
                notification.info({
                    message : "Info",
                    description : 'Your workflow was successfully saved'
                });
            }
            setSaveWorkflowLoading(false)
        }
    }

    const publishWorkflow = async () => {
        try {
            setPublishNetworkLoading(true)
            let result = await vFuseNode.publishWorkflow(workflowId)
            if(!result.error){
                setIsPublished(true)
                notification.info({
                    message : "Info",
                    description : 'Your workflow was successfully published'
                });
            }else{
                notification.error({
                    message : "Something went wrong",
                    description : result.error.toString()
                });
            }
            setPublishNetworkLoading(false)
        }catch (e) {
        }
    }

    const unpublishWorkflow = async () => {
        setUnpublishNetworkLoading(true)
        let result = await vFuseNode.unpublishWorkflow(workflowId)
        if(!result.error){
            setIsPublished(false)
            notification.info({
                message : "Info",
                description : 'Your workflow was successfully unpublished'
            });
        }else{
            notification.error({
                message : "Something went wrong",
                description : result.error.toString()
            });
        }
        setUnpublishNetworkLoading(false)
    }

    const onChaneName = (e) => setName(e.target.value)

    const onNew = () => {
        setCode('')
        setWorkflowId(null)
        setName('')
    }

    const handleChangeLanguage = (value) => setLanguage(value)

    const handleChangeFontSize = (value) => setFontSize(parseInt(value))

    const onRunLocal = async () => {
        setRunLocalLoading(true)
        let result = await vFuseNode.checkWorkflow(code)
        let dag = result.workflow.jobsDAG.toJSON()
        setDag(dag)
        setRunLocalLoading(false)

        if(result && result.error){
            notification.error({
                message : "Something went wrong",
                description : result.error.message
            });
        }else{
            notification.info({
                message : "Info",
                description : 'Run completed'
            });
        }
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
                            isPublished ? <Tag color="#0F9D58">Current workflow is Published</Tag> : <Tag color="#DB4437">Current workflow is not Published</Tag>
                        ]}
                        extra={[
                            /*<Button key="3" type="secondary" disabled={!vFuseNode || !workflowId} loading={runLocalLoading} onClick={onRunLocal}>Build</Button>,*/
                            <Button key="2" type="info" disabled={!vFuseNode || isPublished} loading={saveWorkflowLoading} onClick={saveWorkflow}>Build & Save</Button>,
                            <Button key="1" type="primary" disabled={!vFuseNode && !workflowId || isPublished } loading={publishNetworkLoading} onClick={publishWorkflow}>Submit</Button>,
                            <Button key="1" danger disabled={!vFuseNode && !workflowId || !isPublished} loading={unpublishNetworkLoading} onClick={unpublishWorkflow}>Stop</Button>,
                        ]}
                        //avatar={ <FontAwesomeIcon icon={faMagic} className={"anticon"} />}
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
                    {/*<Descriptions layout="vertical" bordered>
                        <Descriptions.Item label="IdentityManager ID">{profile?.id}</Descriptions.Item>
                        <Descriptions.Item label="Workflows numbers">{profile?.workflows.length}</Descriptions.Item>
                        <Descriptions.Item label="Rewards">{profile?.rewards} ETH</Descriptions.Item>
                    </Descriptions>*/}
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{marginTop: "24px"}}>
                    <Descriptions layout="vertical" bordered extra={[
                        /*<Select defaultValue="javascript" style={{ width: 120, float: "right" }} onChange={handleChangeLanguage}>
                            <Select.Option value="javascript">Javascript</Select.Option>
                            <Select.Option value="python">Python</Select.Option>
                        </Select>,
                        <Button key="4" type="secondary" onClick={onNew}>New workflow</Button>*/
                    ]}>
                        <Descriptions.Item label="Workflow Info" span={4}>
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
                        </Descriptions.Item >
                        <Descriptions.Item span={1} label="Actions" >
                            <Select value={language} style={{ width: 120, float: "right" }} onChange={handleChangeLanguage}>
                                <Select.Option value="javascript">Javascript</Select.Option>
                                <Select.Option value="python">Python</Select.Option>
                            </Select>
                            <Select defaultValue="14" style={{ width: 120, float: "right" }} onChange={handleChangeFontSize}>
                                <Select.Option value="10">10pt</Select.Option>
                                <Select.Option value="12">12pt</Select.Option>
                                <Select.Option value="14">14pt</Select.Option>
                                <Select.Option value="16">16pt</Select.Option>
                                <Select.Option value="20">20pt</Select.Option>
                                <Select.Option value="24">24pt</Select.Option>
                            </Select>
                            <Button key="4" type="secondary" onClick={onNew}>New workflow</Button>
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>
            <Row>
                <Tabs defaultActiveKey="1" style={{width: "100%"}}>
                    <Tabs.TabPane tab="Code Editor" key="1">
                        <Col span={24} style={{height: "50vh"}}>
                            <VFuseCodeEditor code={code} setCode={setCode} language={language} setLanguage={setLanguage} fontSize={fontSize}/>
                        </Col>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Jobs DAG" key="2">
                        <Col span={24} style={{height: "50vh"}}>
                           <DAGVis jobsDAG={dag} />
                        </Col>
                    </Tabs.TabPane>
                </Tabs>
            </Row>
        </div>
    )
}
