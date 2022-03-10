import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row, notification, Select, Tabs, Divider} from "antd";
import VFuse from "vfuse-core";
import {gStore} from "../store";
import VFuseCodeEditor from "../components/CodeEditor/vFuseCodeEditor";
import DAGVis from "../components/DAGVis/DAGVis";
import CTable from "../components/DataVisualization/CTable/CTable";
import NodeModal from "../components/modals/nodeModal";

export default function RunningNotebookPage(props){
    const [vFuseNode, setVFuseNode] = useState(null)
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [saveWorkflowLoading, setSaveWorkflowLoading] = useState(false)
    const [workflowId, setWorkflowId] = useState(props.workflowId ? props.workflowId : (props.location && props.location.params && props.location.params.workflowId) ? props.location.params.workflowId : null)
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState(VFuse.Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT)
    const [name, setName] = useState(null)
    const [dag, setDag] = useState(null)
    const [fontSize, setFontSize] = useState(14)
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
                setSaveWorkflowLoading(false)
                node.addListener(VFuse.Constants.EVENTS.RUNNING_WORKFLOW_UPDATE, updateWorkflowCallback)

                if (workflowId) {
                    let workflow = await node.getRunningWorkflow(workflowId)
                    setName(workflow.name)
                    setCode(workflow.code)
                    setDag(workflow.jobsDAG)
                    setLanguage(workflow.language)
                    setResults(node.getRunningWorkflowResults(workflowId))
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
            setResults(vFuseNode.getRunningWorkflowResults(workflowId))
        }
    }

    const saveWorkflow = async () => {
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

    const handleChangeLanguage = (value) => setLanguage(value)

    const handleChangeFontSize = (value) => setFontSize(parseInt(value))

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
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>
                        ]}
                        extra={[
                            <Button key="1" type="primary" disabled={!vFuseNode} loading={saveWorkflowLoading} onClick={saveWorkflow}>Save in my private space</Button>,
                        ]}
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
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{marginTop: "24px"}}>
                    <Descriptions layout="vertical" bordered>
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
                                    <Input disabled placeholder="Workflow title" value={name} />
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
