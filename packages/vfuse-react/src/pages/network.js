import React, {useState, useEffect} from 'react';
import {Button, Col, Descriptions, Input, Layout, PageHeader, Row, Tag, Typography} from "antd";
import VFuse from "vfuse-core";
import CTable from "../components/DataVisualization/CTable/CTable";
import cloneDeep from 'lodash/cloneDeep';
import {gStore} from "../store";

export default function NetworkPage(props){

    const [peers, setPeers] = useState([])
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)

    useEffect(() => {
        let node = gStore.get("vFuseNode")
        if(node){
            setStatus(node.status)
            node.registerCallbacks(discoverCallback, null, null)
        }
    },[])

    const discoverCallback = async (discovered_peers) => {
        setPeers(discovered_peers);
    }

    const columns = [
        {
            title : "Peer",
            dataIndex: "peer",
            key: "peer",
            render: (text, record, index) => <b>{record.peer}</b>
        }
    ]

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="VFuse Network"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === VFuse.Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === VFuse.Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
                        ]}
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
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <CTable
                        dataSource={peers}
                        api={{}}
                        columns={columns}
                    />
                </Col>
            </Row>
        </div>
    )
}
