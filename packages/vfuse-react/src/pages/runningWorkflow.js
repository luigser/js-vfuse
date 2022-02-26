import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row, notification, Divider} from "antd";
import VFuse from "vfuse-core";

import {useVFuse} from "../hooks/useVFuse"
import {gStore} from "../store";
import CTable from "../components/DataVisualization/CTable/CTable";

export default function RunningWorkflowPage(props){
    const [vFuseNode, setVFuseNode] = useState(gStore.get("vFuseNode"))
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [workflows, setWorkflows] = useState([])
    const {getNode} = useVFuse()

    useEffect(() => {
        const init = async() =>
        {
            let node = gStore.get("vFuseNode")
            if (node) {
                setVFuseNode(node)
                let workflows = await vFuseNode.getRunningWorkflows()
                setWorkflows(workflows)
                setStatus(VFuse.Constants.NODE_STATE.RUNNING)
            }
        }

        init()
    },[])

    const removeWorkflow = async (id) =>{
        let result = await vFuseNode.removeRunningWorkflow(id)
        if(result && result.error){
            notification.error({
                message : "Something went wrong",
                description : result.error
            });
        }else{
            let workflows = await vFuseNode.getRunningWorkflows()
            setWorkflows(workflows)
            notification.info({
                message : "Info",
                description : 'Workflow was successfully removed'
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
            title : "Action",
            dataIndex: "action",
            key: "action",
            render: (text, record, index) => <>
                <Button type="primary" onClick={() =>  props.history.replace({pathname: '/running-notebook', params: {workflowId : record.id} })}>Open</Button>
                <Divider type="vertical" />
                <Button type="danger" onClick={async () => await removeWorkflow(record.id) }>Remove</Button>
            </>
        }
    ]

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="Running Workflows"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === VFuse.Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === VFuse.Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
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
