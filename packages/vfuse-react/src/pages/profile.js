import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row, notification} from "antd";
import VFuse from "vfuse-core";

import {useVFuse} from "../hooks/useVFuse"
import {gStore} from "../store";
import CTable from "../components/DataVisualization/CTable/CTable";

export default function ProfilePage(props){
    const [vFuseNode, setVFuseNode] = useState(gStore.get("vFuseNode"))
    const [profile, setProfile] = useState(null)
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [profileId, setProfileId] = useState(null)
    const [startLoading, setStartLoading] = useState(false)
    const [stopLoading, setStopLoading] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)

    const [startDisabled, setStartDisabled] = useState(!!vFuseNode)
    const [stopDisabled, setStopDisabled] = useState(!vFuseNode)
    const [createDisabled, setCreateDisabled] = useState(!!vFuseNode)

    const [workflows, setWorkflows] = useState([])
    const [publishedWorkflows, setPublishedWorkflows] = useState([])

    const {getNode} = useVFuse()

    useEffect(() => {
        try {
            if (vFuseNode) {
                let profile = vFuseNode.getProfile()
                let workflows = vFuseNode.getWorkflows()
                setProfile(profile)
                setProfileId(profile?.id)
                setWorkflows(workflows)
                setStatus(VFuse.Constants.NODE_STATE.RUNNING)
            }
        }catch(e){
            console.log('Got some error during initialization: %O', e)
            notification.error({
                message : "Something went wrong",
                description : "Cannot establish connection to network"
            });
        }
    },[])


    const onProfileIdChange = (e) =>{
        setProfileId(e.nativeEvent.target.value)
    }

    const onStartNode = async(mode) => {
        try {
            if (mode === "create") setCreateLoading(true)
            else setStartLoading(true)

            setStatus(VFuse.Constants.NODE_STATE.INITIALIZING)

            let node = await getNode(profileId)
            if(!node) {
                setStatus(VFuse.Constants.NODE_STATE.STOP)
                return
            }

            setVFuseNode(node)

            node.eventManager.addListener('VFuse.ready', async function(data){
                if(data.status){
                    let publishedWorkflows = await node.getPublishedWorkflows();
                    console.log({publishedWorkflows})
                    setProfileId(data.profile.id)
                    setProfile(data.profile)
                    setWorkflows(data.workflows)
                    setCreateDisabled(true)
                    setStartDisabled(true)
                    setCreateDisabled(true)
                    setStopDisabled(false)
                    setStatus(VFuse.Constants.NODE_STATE.RUNNING)

                    if (mode === "create") setCreateLoading(false)
                    else setStartLoading(false)
                }else{
                    notification.error({
                        message : "Something went wrong",
                        description : data.error
                    });
                }
            }.bind(this))

        }catch (e) {
            setStartLoading(false)
            console.log('Got some error during initialization: %O', e)
            notification.error({
                message : "Something went wrong",
                description : "Cannot establish connection to network"
            });
        }
    }

    const onStop = async () => {
        try {
            setStopLoading(true)
            if (vFuseNode) {
                await vFuseNode.stop()
                setStopDisabled(true)
                setCreateDisabled(false)
                setStartDisabled(false)
                setProfile(null)
                setVFuseNode(null)
            }
            setStopLoading(false)
        }catch(e){
            notification.error({
                message : "Something went wrong",
                description : e.message
            });
            setStopLoading(true)
        }
    }

    const columns = [
        {
            title : "Name",
            dataIndex: "name",
            key: "name"
        },
        {
            title : "Published",
            dataIndex: "published",
            key: "published",
            render: (text, record, index) => publishedWorkflows.indexOf(record.id) >= 0 ? <Tag color="#0F9D58">Yes</Tag> : <Tag color="#DB4437">Not</Tag>
        },
        {
            title : "Action",
            dataIndex: "action",
            key: "action",
            render: (text, record, index) => <Button type="primary" onClick={() =>  props.history.replace({pathname: '/notebook', params: {workflowId : record.id} })}>Open</Button>
        }
    ]

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="VFuse IdentityManager"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === VFuse.Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === VFuse.Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
                        ]}
                        extra={[
                            <Button key="3" type="primary" disabled={startDisabled} loading={startLoading} onClick={() => onStartNode("start")}>Start</Button>,
                            <Button key="2" type="danger" disabled={stopDisabled} loading={stopLoading} onClick={onStop}>Stop</Button>,
                            /*<Button key="2" type="default" disabled={createDisabled} loading={createLoading} onClick={() => onStartNode("create")}>Create</Button>,*/
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
                                        <Input placeholder="Your IdentityManager ID here" onChange={onProfileIdChange} />
                                    </Col>
                                </Typography.Paragraph>
                                <Descriptions title="User Info" layout="vertical" bordered>
                                    <Descriptions.Item label="Profile ID">{profile?.id}</Descriptions.Item>
                                    <Descriptions.Item label="Workflows numbers">{workflows.length}</Descriptions.Item>
                                    <Descriptions.Item label="Rewards"><b>{profile && profile.reward ? profile.reward : '0.00'}</b> VFuseCoin</Descriptions.Item>
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
