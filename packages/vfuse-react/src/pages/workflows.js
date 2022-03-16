import React, {useState, useEffect} from 'react';
import {PageHeader, Button, Tag, Col, Row, notification, Divider} from "antd";
import VFuse from "vfuse-core";

import {useVFuse} from "../hooks/useVFuse"
import {gStore} from "../store";
import CTable from "../components/DataVisualization/CTable/CTable";

export default function WorkflowsPage(props){
    const [vFuseNode, setVFuseNode] = useState(gStore.get("vFuseNode"))
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [workflows, setWorkflows] = useState([])

    useEffect(() => {
        const init = async() =>
        {
            let node = gStore.get("vFuseNode")
            if (node) {
                setVFuseNode(node)
                let workflows = vFuseNode.getWorkflows()
                setWorkflows(workflows)
                setStatus(VFuse.Constants.NODE_STATE.RUNNING)
            }
        }

        init()
    },[])

    const onNew = () => props.history.replace({pathname: '/notebook'})

    const removeWorkflow = async (wid) => {
        try {
            let result = await vFuseNode.deleteWorkflow(wid)
            if(!result.error){
                setWorkflows(vFuseNode.getWorkflows())
                notification.info({
                    message : "Info",
                    description : 'Workflow removed'
                });
            }
        }catch(e){
            notification.error({
                message : "Something went wrong",
                description : e.message
            });
        }
    }

    const columns = [
        {
            title : "Name",
            dataIndex: "name",
            key: "name"
        },
        {
            title : "Language",
            dataIndex: "language",
            key: "language"
        },
        {
            title : "Published",
            dataIndex: "published",
            key: "published",
            render: (text, record, index) => record.published ? <Tag color="#0F9D58">Yes</Tag> : <Tag color="#DB4437">Not</Tag>
        },
        {
            title : "Action",
            dataIndex: "action",
            key: "action",
            render: (text, record, index) => <>
                <Button type="primary" onClick={() =>  props.history.replace({pathname: '/notebook', params: {workflowId : record.id} })}>Open</Button>
                <Divider type="vertical" />
                <Button type="danger" onClick={() => removeWorkflow(record.id) }>Remove</Button>
            </>
        }
    ]

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="Workflows"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === VFuse.Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === VFuse.Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
                        ]}
                        extra={[
                            <Button key="4" type="secondary" onClick={onNew}>New workflow</Button>
                        ]}
                    >
                    </PageHeader>
                </Col>
            </Row>
            <Row style={{margin: '24px'}}>
                <Col span={24}>
                    <CTable
                        dataSource={workflows}
                        api={{}}
                        columns={columns}
                    />
                </Col>
            </Row>
        </div>
    )
}
