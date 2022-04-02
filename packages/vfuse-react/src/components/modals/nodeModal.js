import React, { useState, useEffect } from 'react'
import { Descriptions, Modal, Tag} from 'antd'
import ReactJson from 'react-json-view'

export default function NodeModal(props) {

    const [isModalVisible, setIsModalVisible] = useState(props.isVisible);
    const [node, setNode] = useState(props.node);


    useEffect(() => {
        try {
            setIsModalVisible(props.isVisible)
            setNode(props.node)

        }catch (e) {
            console.log(e)
        }
    }, [props.isVisible, props.node])


    const handleOk = () => {
        setIsModalVisible(false);
        props.setVisible(false)
    };

    return (
        <Modal title="Workflow Jobs DAG Node" visible={isModalVisible} onOk={handleOk} cancelButtonProps={{ style: { display: 'none' } }} closable={true} onCancel={handleOk} width={'80vW'}>
                { node &&
                <Descriptions layout="horizontal" bordered extra={[
                ]}>
                    <Descriptions.Item label="Name" span={4}>
                        <b>{node.label}</b>
                    </Descriptions.Item>
                        <Descriptions.Item label="ID" span={4}>
                        <b>{node.id}</b>
                        </Descriptions.Item >
                        <Descriptions.Item label="Status" span={4}>
                            {node.job.status === 0 && <Tag color="#F4B400">WAITING</Tag>}
                            {node.job.status === 1 && <Tag color="#0F9D58">READY</Tag>}
                            {node.job.status === 2 && <Tag color="#4285F4">COMPLETED</Tag>}
                            {node.job.status === 3 && <Tag color="#DB4437">ERROR</Tag>}
                            {node.job.status === 4 && <Tag color="#32586E">ENDLESS</Tag>}
                        </Descriptions.Item >
                    <Descriptions.Item label="Data" span={4}>
                        {
                            typeof node.job.data === 'string' || typeof node.job.data === 'number' && <i>{node.job.data}</i>
                        }
                        {
                            typeof node.job.data !== 'string' && typeof node.job.data !== 'number' && !(node.job.data instanceof Map) && <ReactJson src={node.job.data} collapsed={true}/>
                        }
                        {
                            (node.job.data instanceof Map) && <ReactJson src={Array.from(props.node.job.data, ([key, value]) => ({ key, value }))} collapsed={true}/>
                        }
                    </Descriptions.Item >
                    <Descriptions.Item label="Results" span={4}>
                        {
                            typeof node.job.results === 'string' || typeof node.job.results === 'number' && <i>{node.job.results}</i>
                        }
                        {
                            typeof node.job.results !== 'string' && typeof node.job.results !== 'number' && !(node.job.results instanceof Map) && <ReactJson src={node.job.results} collapsed={true}/>
                        }
                        {
                            (node.job.results instanceof Map) && <ReactJson src={Array.from(props.node.job.results, ([key, value]) => ({ key, value }))} collapsed={true}/>
                        }
                    </Descriptions.Item >
                    <Descriptions.Item label="Executor PeerId" span={4}>
                        <i>{node.job.executorPeerId}</i>
                    </Descriptions.Item >
                    <Descriptions.Item label="Execution Time" span={4}>
                        <i>{node.job.executionTime}</i>
                    </Descriptions.Item >
                </Descriptions>
                }

        </Modal>
    )

}
