import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row} from "antd";
import {Constants} from "../constants/constants";

import {useVFuse} from "../hooks/useVFuse"

export default function ProfilePage(props){

    const [profile, setProfile] = useState(null)
    const [status, setStatus] = useState(Constants.NODE_STATE.STOP)
    const [profileId, setProfileId] = useState(null)
    const [startLoading, setStartLoading] = useState(false)
    const [stopLoading, setStopLoading] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const consoleRef = useRef(null);

    const {getNode} = useVFuse()

    useEffect(() => {

    },[])

    const onProfileIdChange = (e) =>{
        setProfileId(e.nativeEvent.target.value)
    }

    const onStartNode = async(mode) => {
        if(mode === "create") setCreateLoading(true)
        else setStartLoading(true)

        setStatus(Constants.NODE_STATE.INITIALIZING)

        let node = await getNode(profileId)

        setStatus(node ? Constants.NODE_STATE.RUNNING : Constants.NODE_STATE.STOP)

        setProfileId(node?.profile?.id)
        setProfile(node?.profile)

        if(mode === "create") setCreateLoading(false)
        else setStartLoading(false)


    }

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="VFuse Profile"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
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
        </div>
    )
}