import React, {useState, useEffect} from 'react';
import {Col, Layout, PageHeader, Row, Tag} from "antd";
import VFuse from "vfuse-core";
import {gStore} from "../store";
import { Hook, Console, Unhook, Decode } from 'console-feed'

export default function ConsolePage(props){

    const [logs, setLogs] = useState([])
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)

    useEffect(() => {
        let node = gStore.get("vFuseNode")
        if(node){
            setStatus(node.status)
            node.addListener(VFuse.Constants.EVENTS.CONSOLE_MESSAGE, logsCallback)
        }
    },[])

    const logsCallback = (logs) => {
        setLogs(logs)
    }

    useEffect(() => {
        Hook(
            window.console,
            (log) => setLogs((currLogs) => [...currLogs, log]),
            false
        )
        return () => Unhook(window.console)
    }, [])

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="VFuse Console"
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
                <Col span={24} style={{ backgroundColor: '#242424', height: '80vh', overflowY: 'scroll' }}>
                    <Console logs={logs} variant="dark" />
                </Col>
            </Row>
        </div>
    )
}


