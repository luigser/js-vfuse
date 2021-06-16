import React, {useState, useEffect, useRef} from 'react';
import {PageHeader, Button, Layout, Typography, Tag, Descriptions, Input, Col, Row} from "antd";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs/components/prism-core";
import 'prismjs/components/prism-python';

import {Constants} from "../constants/constants";
import {useVFuse} from "../hooks/useVFuse"
import {gStore} from "../store";

export default function NotebookPage(props){

    const [profile, setProfile] = useState(null)
    const [status, setStatus] = useState(Constants.NODE_STATE.STOP)
    const [vFuseNode, setVFuseNode] = useState(null)
    const [code, setCode] = useState(
        `import numpy as np 
a = [[2, 0], [0, 2]]
b = [[4, 1], [2, 2]]
c = np.dot(a, b)
print(c)`
    );


    const {getNode} = useVFuse()

    useEffect(() => {
        let node = gStore.get("vFuseNode")
        if(node){
            setVFuseNode(node)
            setProfile(node.profile)
        }

    },[])

    return(
        <div>
            <Row>
                <Col span={24}>
                    <PageHeader
                        title="VFuse Notebook"
                        className="site-page-header"
                        subTitle="Node status"
                        tags={[
                            status === Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
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
                            <Descriptions title="User Info" layout="vertical" bordered>
                                <Descriptions.Item label="Profile ID">{profile?.id}</Descriptions.Item>
                                <Descriptions.Item label="Workflows numbers">{profile?.workflows.length}</Descriptions.Item>
                                <Descriptions.Item label="Rewards">{profile?.rewards} ETH</Descriptions.Item>
                            </Descriptions>
                        </Layout.Content>
                    </PageHeader>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <Col span={24} style={{overflow: "scroll"}}>
                        <Editor
                            value={code}
                            onValueChange={(code) => setCode(code)}
                            highlight={code => highlight(code, languages.py)}
                            padding={10}
                            style={{
                                height: "68vh",
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 12,
                            }}
                        />
                    </Col>

                </Col>
            </Row>
        </div>
    )
}