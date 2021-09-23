import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row} from "antd";
import VFuse from "vfuse-core";

import {useVFuse} from "../hooks/useVFuse"
import {gStore} from "../store";
import CTable from "../components/DataVisualization/CTable/CTable";

export default function ProfilePage(props){

    const [profile, setProfile] = useState(null)
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [profileId, setProfileId] = useState(null)
    const [startLoading, setStartLoading] = useState(false)
    const [stopLoading, setStopLoading] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [workflows, setWorkflows] = useState([])
    const [publishedWorkflows, setPublishedWorkflows] = useState([])
    const consoleRef = useRef(null);

    const {getNode} = useVFuse()

    useEffect(() => {
        let node = gStore.get("vFuseNode")
        if(node){
            setProfile(node.profile)
            setStatus(VFuse.Constants.NODE_STATE.RUNNING)
        }
    },[])


    const onProfileIdChange = (e) =>{
        setProfileId(e.nativeEvent.target.value)
    }

    const onStartNode = async(mode) => {
        if(mode === "create") setCreateLoading(true)
        else setStartLoading(true)

        setStatus(VFuse.Constants.NODE_STATE.INITIALIZING)

        let node = await getNode(profileId)
        let publishedWorkflows = await node.getPublishedWorkflows();
        setPublishedWorkflows(publishedWorkflows)
        console.log({publishedWorkflows})

        setStatus(node ? VFuse.Constants.NODE_STATE.RUNNING : VFuse.Constants.NODE_STATE.STOP)

        setProfileId(node?.profile?.id)
        setProfile(node?.profile)
        setWorkflows(node?.profile?.workflows)

        if(mode === "create") setCreateLoading(false)
        else setStartLoading(false)

    }

    const columns = [
        {
            title : "Name",
            dataIndex: "name",
            key: "name"
        },
        {
            title : "Id",
            dataIndex: "id",
            key: "id"
        },
        {
            title : "Jobs",
            dataIndex: "jobs",
            key: "jobs",
            render: (text, record, index) => <>{record.jobs.length}</>
        },
        {
            title : "Published",
            dataIndex: "published",
            key: "published",
            render: (text, record, index) => publishedWorkflows.indexOf(record.id) >= 0 ? <b>yes</b> : <b>no</b>
        }
    ]

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="VFuse Profile"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === VFuse.Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === VFuse.Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
                        ]}
                        extra={[
                            <Button key="3" type="primary" disabled={!profileId || profile} loading={startLoading} onClick={() => onStartNode("start")}>Start</Button>,
                            <Button key="2" type="danger" disabled={!profileId} loading={stopLoading}>Stop</Button>,
                            <Button key="2" type="default" disabled={profileId} loading={createLoading} onClick={() => onStartNode("create")}>Create</Button>,
                        ]}
                        avatar={{ src: 'https://avatars1.githubusercontent.com/u/8186664?s=460&v=4' }}
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
                            <>
                                <Typography.Paragraph>
                                    <Col span={12} >
                                        <Input placeholder="Your Profile ID here" onChange={onProfileIdChange} />
                                    </Col>
                                </Typography.Paragraph>
                                <Descriptions title="User Info" layout="vertical" bordered>
                                    <Descriptions.Item label="Profile ID">{profile?.id}</Descriptions.Item>
                                    <Descriptions.Item label="Workflows numbers">{profile?.workflows.length}</Descriptions.Item>
                                    <Descriptions.Item label="Rewards">{profile?.rewards} ETH</Descriptions.Item>
                                </Descriptions>
                            </>
                        </Layout.Content>
                    </PageHeader>
                </Col>
            </Row>
            <Row style={{margin: '24px'}}>
                <Col span={24}>
                    <Descriptions title="Workflows" layout="vertical" />
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
