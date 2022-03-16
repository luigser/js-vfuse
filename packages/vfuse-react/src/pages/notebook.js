import React, {useState, useEffect} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row, notification, Select, Tabs, Divider} from "antd";
import VFuse from "vfuse-core";
import {gStore} from "../store";
import VFuseCodeEditor from "../components/CodeEditor/vFuseCodeEditor";
import DAGVis from "../components/DAGVis/DAGVis";
import CTable from "../components/DataVisualization/CTable/CTable";
import NodeModal from "../components/modals/nodeModal";

/*
//import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs/components/prism-core";
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-funky.css'*/

const javascriptCodeExample = "let input = await VFuse.getDataFromUrl(\"https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt\")\n" +
    "\n" +
    "function map(data){\n" +
    "    let mapped = new Map()\n" +
    "    data.map(d => d.split(/\\W+/).map(word => mapped.set(word, mapped.has(word) ? mapped.get(word) + 1 : 1)))\n" +
    "    return mapped\n" +
    "}\n" +
    "\n" +
    "function reduce(data){\n" +
    "    let result = new Map()\n" +
    "    for(let d of data)\n" +
    "        result.set(d.key, result.has(d.key) ? result.get(d.key) + d.value : d.value)\n" +
    "    return result\n" +
    "}\n" +
    "\n" +
    "function getMaxOccurenceWord(data){\n" +
    "    let max = data[0]\n" +
    "    for(let entry of data){\n" +
    "        if(entry.value > max.value)\n" +
    "            max = entry\n" +
    "    }\n" +
    "    return max\n" +
    "}\n" +
    "\n" +
    "input = input.toString().split(\"\\n\")\n" +
    "let chunck = Math.floor(input.length / 10), r = 0\n" +
    "for (; r < input.length; r += chunck){\n" +
    "    await VFuse.addJob(map, [], input.slice(r, r + chunck), 'map_group')\n" +
    "}\n" +
    "\n" +
    "let diff = input.length - r\n" +
    "if( diff > 0){\n" +
    "    await VFuse.addJob(map, [], input.slice(r, r + diff), 'map_group')\n" +
    "}\n" +
    "\n" +
    "\n" +
    "let combine_job_id = await VFuse.addJob(reduce, ['^map_'])//wait for all reduce results and call combine\n" +
    "await VFuse.addJob(getMaxOccurenceWord, [combine_job_id])\n"

const pythonCodeExample = `import math
input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt")

def map(data):
    result = {}
    for row in data:
        for word in row.split(' '):
            if word in result:
                result[word] = result[word] + 1
            else:
                result[word] = 1
    return result

def reduce(data):
    result = {}
    for d in data:
        if d['key'] in result:
            result[d['key']] = result[d['key']] + d['value']
        else:
            result[d['key']] = d['value']
    return result

def getMaxWordOccurence(data):
    max = data[0]
    for d in data:
        if d['value'] > max['value']:
            max = d
    return max

input = input.splitlines()
chunk = math.floor(len(input) / 10)
i = 0

while i < len(input):
    map_job_id = await VFuse.addJob(map, [], input[i:i + chunk], 'map')
    i = i + chunk

diff = len(input) - i
if diff > 0:
    map_job_id = await VFuse.addJob(map, [], input[i:i + diff], 'map')

reduce_job_id = await VFuse.addJob(reduce,['map'])
await VFuse.addJob(getMaxWordOccurence, [reduce_job_id])
`

export default function NotebookPage(props){
    const [vFuseNode, setVFuseNode] = useState(null)
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [publishNetworkLoading, setPublishNetworkLoading] = useState(false)
    const [stopNetworkLoading, setStopNetworkLoading] = useState(false)
    const [saveWorkflowLoading, setSaveWorkflowLoading] = useState(false)
    const [testLocallyLoading, setTestLocallyLoading] = useState(false)
    const [workflowId, setWorkflowId] = useState(props.workflowId ? props.workflowId : (props.location && props.location.params && props.location.params.workflowId) ? props.location.params.workflowId : null)
    const [code, setCode] = useState(javascriptCodeExample);
    const [language, setLanguage] = useState(VFuse.Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT)
    const [name, setName] = useState(null)
    const [dag, setDag] = useState(null)
    const [fontSize, setFontSize] = useState(14)
    const [isPublished, setIsPublished] = useState(false)
    const [results, setResults] = useState([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [currentNode, setCurrentNode] = useState(null)


    useEffect(() => {
        const init = async() =>
        {
            let node = gStore.get("vFuseNode")
            if (node) {
                setVFuseNode(node)
                setStatus(VFuse.Constants.NODE_STATE.RUNNING)
                setPublishNetworkLoading(false)
                setSaveWorkflowLoading(false)
                node.addListener(VFuse.Constants.EVENTS.WORKFLOW_UPDATE, updateWorkflowCallback)

                if (workflowId) {
                    let workflow = await node.getWorkflow(workflowId)
                    setName(workflow.name)
                    setCode(workflow.code)
                    setDag(workflow.jobsDAG)
                    setLanguage(workflow.language)
                    setIsPublished(workflow.published)
                    setResults(node.getWorkflowResults(workflowId))
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
            setResults(vFuseNode.getWorkflowResults(workflowId))
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

    const submitWorkflow = async () => {
        try {
            setPublishNetworkLoading(true)
            let result = await vFuseNode.submitWorkflow(workflowId)
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

    const unsubmitWorkflow = async () => {
        setStopNetworkLoading(true)
        let result = await vFuseNode.unsubmitWorkflow(workflowId)
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
        setStopNetworkLoading(false)
    }

    const onChaneName = (e) => setName(e.target.value)

    const onClear = () => {
        setCode('')
        setWorkflowId(null)
        setName('')
    }

    const handleChangeLanguage = (value) => setLanguage(value)

    const handleChangeFontSize = (value) => setFontSize(parseInt(value))

    const testLocally = async () => {
        setTestLocallyLoading(true)
        let workflow = await vFuseNode.testWorkflow(code, language)
        setTestLocallyLoading(false)
        if(workflow && workflow.error){
            notification.error({
                message : "Something went wrong",
                description : workflow.error.message
            });
        }else{
            let dag = workflow.jobsDAG
            setDag(dag)

            notification.info({
                message : "Info",
                description : 'Local Run completed'
            });
        }
    }

    const columns = [
        {
            title : "Name",
            key: "name",
            render: (text, record, index) => record.job.name
        },
        {
            title : "Execution Time",
            key: "executionTime",
            render: (text, record, index) => record.job.executionTime
        },
        {
            title : "Executor",
            key: "executorPeerId",
            render: (text, record, index) => record.job.executorPeerId
        },
        {
            title : "Reward",
            dataIndex: "reward",
            key: "reward",
            render: (text, record, index) => record.job.reward
        },
        {
            title : "Action",
            dataIndex: "action",
            key: "action",
            render: (text, record, index) => <>
                <Button type="primary" onClick={() => {
                    setCurrentNode(record)
                    setIsModalVisible(true)
                }}>Show</Button>
            </>
        }
    ]

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="Notebook"
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
                            <Button key="1" type="info" disabled={!vFuseNode || isPublished} loading={saveWorkflowLoading} onClick={saveWorkflow}>Build & Save</Button>,
                            <Button key="2" type="primary" disabled={!vFuseNode && !workflowId || isPublished } loading={publishNetworkLoading} onClick={submitWorkflow}>Submit</Button>,
                            <Button key="3" danger disabled={!vFuseNode && !workflowId || !isPublished} loading={stopNetworkLoading} onClick={unsubmitWorkflow}>Stop</Button>,
                            <><Divider type="vertical"/><Button disabled={!vFuseNode ||  isPublished} type="primary" key="4" loading={testLocallyLoading} onClick={testLocally}>Test Locally</Button></>,
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
                            <Button key="4" type="secondary" onClick={onClear}>Clear</Button>
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
                    <Tabs.TabPane tab="Results" key="3">
                        <Col span={24} style={{height: "50vh"}}>
                            <CTable
                                dataSource={results}
                                api={{}}
                                columns={columns}
                            />
                        </Col>
                    </Tabs.TabPane>
                </Tabs>
            </Row>
            <NodeModal setVisible={setIsModalVisible} node={currentNode} isVisible={isModalVisible}/>
        </div>
    )
}
