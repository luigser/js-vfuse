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
        <Modal title="Workflow Jobs DAG Node" visible={isModalVisible} onOk={handleOk} cancelButtonProps={{ style: { display: 'none' } }} closable={false} width={'80vW'}>
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
                        </Descriptions.Item >
                    <Descriptions.Item label="Data" span={4}>
                        {
                            typeof node.job.data === 'string' && <i>{node.job.data}</i>
                        }
                        {
                            typeof node.job.data !== 'string' && <ReactJson src={node.job.data} collapsed={true}/>
                        }
                    </Descriptions.Item >
                    <Descriptions.Item label="Results" span={4}>
                        <ReactJson src={node.job.results} collapsed={true} />
                    </Descriptions.Item >
                </Descriptions>
                }

        </Modal>
    )

}