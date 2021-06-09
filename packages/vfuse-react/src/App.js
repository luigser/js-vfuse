import React, {useState, useEffect} from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import {Row, Col, Space, Typography, Button, Input} from "antd";
//import 'prismjs/components/prism-clike';
//import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import VFuse from "vfuse-core";
import PythonWorker from'vfuse-python-worker'
import cloneDeep from 'lodash/cloneDeep';
import CTable from "./components/DataVisualization/CTable/CTable";

import './theme.css'
import './App.css'

function App() {
    const [profileId, setProfileId] = useState(null)
  const [code, setCode] = useState(
      `import numpy as np 
a = [[2, 0], [0, 2]]
b = [[4, 1], [2, 2]]
c = np.dot(a, b)
print(c)`
  );

  const [result, setResult] = useState("")
  const [vFuseNode, setVFuseNode] = useState(null);
  const [peers, setPeers] = useState([]);

  const discoverCallback = async (peerId) => {
      console.log(`Found peer ${peerId.toB58String()}`)
  }

  const connectionCallback = async (peer) => {
      let ps = cloneDeep(peers)
      ps.push({ peer : peer})
      setPeers(ps);
  }

  const getMessageFromProtocolCallback = async (payload) => {
      //console.log(payload)
      setResult(payload);
  }

  const onSend = async (node) => {
      console.log( node);
      await vFuseNode.sendMessage(node, code);
  }

  const columns = [
      {
          title : "Peer",
          dataIndex: "peer",
          key: "peer",
          render: (text, record, index) => (
              <Row className="box" style={{ marginTop: "24px"}}>
                  <Col span={12} >
                      {vFuseNode &&
                         <Button type="primary" onClick={() => onSend(text)}>Execute Code on node</Button>
                      }
                  </Col>
                  <Col span={12} >{text}</Col>
              </Row>
          )
      }
  ]

    const localRun = () => {
      vFuseNode.runCode(code, getMessageFromProtocolCallback)
    }

    const start = async() => {
      /*
      QmSTnyfp5mpd49hxkvS5RAKgRCwvr3zcZBZri8X8aWtiMF - AllinOne
      Qmf21v2gUok1wuNn2apGnkcSQaRrQdt1xe79XyNFvttm6q - AllInOne
      */
          const options = {
              profileId : profileId,
              worker : PythonWorker.getWebWorker(),
              discoveryCallback : () => {},
              connectionCallback: () => {},
              getMessageFromProtocolCallback : () => {},
              bootstrapNodes : null,
              packages: []
          }

          let node = await VFuse.create(options)
          console.log("Profile ID: %s",node.profile.id)

          console.log('VFuse NODE')
          console.log({node})
          //await node.createWorkflow()
          await node.addJob(
            node.getWorkflows()[0],
            `import numpy as np 
a = [[2, 0], [0, 2]]
b = [[4, 1], [2, 2]]
c = np.dot(a, b)
print(c)`,
            [],
            []
        )
    }

    const onProfileIdChange = (e) =>{
      setProfileId(e.nativeEvent.target.value)
    }


    return (
        <div className="App">
            <Row>
                <Col span={10}>
                    <Space
                        direction='vertical'
                        size='small'
                        style={{ textAlign : "left", width: '100%', fontSize: "18px"}}
                    >
                        <Typography.Title level={1} style={{ fontSize : "28px"}}>VFuse Notepad</Typography.Title>
                        <Typography.Paragraph>Type yor code here</Typography.Paragraph>
                    </Space>
                </Col>
                <Col span={6} >
                    <Input placeholder="Your Profile ID here" onChange={onProfileIdChange} />
                </Col>
                <Col span={4} >
                    <Button type="primary" onClick={start}>Start</Button>
                </Col>
                <Col span={4} >
                    <Button type="primary" onClick={localRun}>Run</Button>
                </Col>
            </Row>
            <Row className="box">
                <Col span={24} style={{overflow: "scroll"}}>
                    <Editor
                        value={code}
                        onValueChange={(code) => setCode(code)}
                        highlight={code => highlight(code, languages.py)}
                        padding={10}
                        style={{
                          height: "45vh",
                          fontFamily: '"Fira code", "Fira Mono", monospace',
                          fontSize: 12,
                        }}
                    />
                </Col>
            </Row>
            {/*<Row className="box" style={{ marginTop: "24px"}}>
                <Col span={12} >
                    <Button type="primary" onClick={onSend}>Send Code</Button>
                </Col>
                <Col span={12} >
                    <Input
                        onChange={v => setNodeToSend(v.target.value)}
                        allowClear
                    />
                </Col>
            </Row>*/}
            {/*<Row style={{marginTop: "24px"}}>
                <Col span={24}>
                    <Space
                        direction='vertical'
                        size='small'
                        style={{ textAlign : "left", width: '100%', fontSize: "18px"}}
                    >
                        <Typography.Title level={1} style={{ fontSize : "28px"}}>Node</Typography.Title>
                        <Typography.Paragraph>Here the node information and actions</Typography.Paragraph>
                    </Space>
                </Col>
            </Row>
            <Row className="box" style={{marginTop: "24px"}}>
                <Col span={12}>
                    <div className="label">PeerId</div>
                </Col>
                <Col span={12}>
                    {vFuseNode?.node?.libp2p.peerId.toB58String()}
                </Col>
            </Row>
            <Row className="box" style={{marginTop: "24px"}}>
                <Col span={24}>
                    <CTable
                        dataSource={peers}
                        api={{}}
                        columns={columns}
                    />

                </Col>
            </Row>*/}
            <Row style={{marginTop: "24px"}}>
                <Col span={24}>
                    <Space
                        direction='vertical'
                        size='small'
                        style={{ textAlign : "left", width: '100%', fontSize: "18px"}}
                    >
                        <Typography.Title level={1} style={{ fontSize : "28px"}}>Results</Typography.Title>
                    </Space>
                </Col>
            </Row>
            <Row className="box">
                <Col span={24}>
                    <code>{result}</code>
                    <pre
                        className="console"
                        style={{
                            color: "#ffffff",
                            fontFamily: "monospace",
                            "background": "black",
                            textAlign: "left",
                            fontSize: "12px",
                            overflow: "scroll"
                        }}
                    >{result}
                    </pre>
                </Col>
            </Row>

        </div>
    );
}

export default App;
