import React, {useState, useEffect, useRef} from 'react';
import {
    PageHeader,
    Button,
    Layout,
    Typography,
    Tag,
    Descriptions,
    Input,
    Col,
    Row,
    notification,
    Divider,
    Tabs,
    Slider
} from "antd";
import VFuse from "vfuse-core";
import GaugeChart from 'react-gauge-chart'
import {useVFuse} from "../hooks/useVFuse"
import {gStore} from "../store";

export default function ProfilePage(props){
    const [vFuseNode, setVFuseNode] = useState(gStore.get("vFuseNode"))
    const [profile, setProfile] = useState(null)
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [profileId, setProfileId] = useState(null)
    const [startLoading, setStartLoading] = useState(false)
    const [stopLoading, setStopLoading] = useState(false)
    const [startDisabled, setStartDisabled] = useState(!!vFuseNode)
    const [stopDisabled, setStopDisabled] = useState(!vFuseNode)
    const [workflows, setWorkflows] = useState([])
    const [preferences, setPreferences] = useState(null)
    const [discoveryTimeout, setDiscoveryTimeout] = useState(0)
    const [workflowPublishingTimeout, setWorkflowPublishingTimeout] = useState(0)
    const [resultsPublishingTimeout, setResultsPublishingTimeout] = useState(0)
    const [executionCycleTimeout, setExecutionCycleTimeout] = useState(0)
    const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(0)
    const [usage, setUsage] = useState(0)

    const {getNode} = useVFuse()

    useEffect(() => {
        try {
            if (vFuseNode) {
                let profile = vFuseNode.getProfile()
                let workflows = vFuseNode.getWorkflows()
                setProfile(profile)
                setProfileId(profile?.id)
                setWorkflows(workflows)
                setPreferences(profile.preferences)
                setDiscoveryTimeout(profile.preferences.TIMEOUTS.DISCOVERY)
                setWorkflowPublishingTimeout(profile.preferences.TIMEOUTS.WORKFLOWS_PUBLISHING)
                setResultsPublishingTimeout(profile.preferences.TIMEOUTS.RESULTS_PUBLISHING)
                setExecutionCycleTimeout(profile.preferences.TIMEOUTS.EXECUTION_CYCLE)
                setMaxConcurrentJobs(profile.preferences.LIMITS.MAX_CONCURRENT_JOBS)
                setUsage(profile.preferences.CONSTANTS.CPU_USAGE)
                setStatus(VFuse.Constants.NODE_STATE.RUNNING)
                calculateUsage()
            }else if(vFuseNode && vFuseNode.error){
                setStatus(VFuse.Constants.NODE_STATE.STOP)
                notification.error({
                    message : "Something went wrong",
                    description : vFuseNode.error
                });
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
            setStartLoading(true)
            setStatus(VFuse.Constants.NODE_STATE.INITIALIZING)

            let node = await getNode(profileId)
            if(!node) {
                setStatus(VFuse.Constants.NODE_STATE.STOP)
                return
            }

            setVFuseNode(node)

            node.eventManager.addListener('VFuse.ready', async function(data){
                if(data.status){
                    setProfileId(data.profile.id)
                    setProfile(data.profile)
                    setPreferences(data.profile.preferences)
                    setDiscoveryTimeout(data.profile.preferences.TIMEOUTS.DISCOVERY)
                    setWorkflowPublishingTimeout(data.profile.preferences.TIMEOUTS.WORKFLOWS_PUBLISHING)
                    setResultsPublishingTimeout(data.profile.preferences.TIMEOUTS.RESULTS_PUBLISHING)
                    setExecutionCycleTimeout(data.profile.preferences.TIMEOUTS.EXECUTION_CYCLE)
                    setMaxConcurrentJobs(data.profile.preferences.LIMITS.MAX_CONCURRENT_JOBS)
                    setUsage(data.profile.preferences.CONSTANTS.CPU_USAGE)
                    setWorkflows(data.workflows)
                    setStartDisabled(true)
                    setStopDisabled(false)
                    setStatus(VFuse.Constants.NODE_STATE.RUNNING)
                    setStartLoading(false)
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

    const calculateUsage = () => {
        let cpuConstant = 0.2
        let discoveryTimeoutConstant = 15,
            workflowsPublishingTimeoutConstant = 60,
            resultsPublishingTimeoutConstant = 120,
            executionCycleTimeoutConstant = 1,
            maxConcurrentJobsConstant = 10,
            discoveryTimeoutWeight = 0.001,
            workflowsPublishingTimeoutWeight = 0.005,
            resultsPublishingTimeoutWeight = 0.005,
            executionCycleTimeoutWeight = 0.05,
            maxConcurrentJobsWeight = 0.06
        let usage = cpuConstant + (
            (((discoveryTimeoutConstant - discoveryTimeout) * discoveryTimeoutWeight)) +
            (((workflowsPublishingTimeoutConstant - workflowPublishingTimeout) * workflowsPublishingTimeoutWeight)) +
            (((resultsPublishingTimeoutConstant - resultsPublishingTimeout) * resultsPublishingTimeoutWeight)) +
            (((executionCycleTimeoutConstant - executionCycleTimeout) * executionCycleTimeoutWeight)) +
            (((maxConcurrentJobs - maxConcurrentJobsConstant) * maxConcurrentJobsWeight))
        )
        if(usage <= 0) usage = 0
        if(usage > 1)  usage = 1
        setUsage(usage)
    }

    const onPreferencesChange = (type, value) =>{
        let prefs = {...preferences}
        switch(type){
            case 'TIMEOUTS.DISCOVERY':
                setDiscoveryTimeout(value)
                prefs.TIMEOUTS.DISCOVERY = value
                break
            case 'TIMEOUTS.WORKFLOWS_PUBLISHING':
                setWorkflowPublishingTimeout(value)
                prefs.TIMEOUTS.WORKFLOWS_PUBLISHING = value
                break
            case 'TIMEOUTS.RESULTS_PUBLISHING':
                setResultsPublishingTimeout(value)
                prefs.TIMEOUTS.RESULTS_PUBLISHING = value
                break
            case 'TIMEOUTS.EXECUTION_CYCLE':
                setExecutionCycleTimeout(value)
                prefs.TIMEOUTS.EXECUTION_CYCLE = value
                break
            case 'LIMITS.MAX_CONCURRENT_JOBS':
                setMaxConcurrentJobs(value)
                prefs.LIMITS.MAX_CONCURRENT_JOBS = value
                break
        }
        calculateUsage()
        setPreferences(prefs)
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
                            status === VFuse.Constants.NODE_STATE.STOP && <Tag color="red">Stopped</Tag>,
                            status === VFuse.Constants.NODE_STATE.INITIALIZING && <Tag color="blue">Initializing</Tag>,
                            status === VFuse.Constants.NODE_STATE.RUNNING && <Tag color="green">Running</Tag>,
                        ]}
                        extra={[
                            <Button key="3" type="primary" disabled={startDisabled} loading={startLoading} onClick={() => onStartNode("start")}>Start</Button>,
                            <Button key="2" type="danger" disabled={stopDisabled} loading={stopLoading} onClick={onStop}>Stop</Button>
                        ]}
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
                                <Descriptions title="User Info" layout="vertical" bordered>
                                    <Descriptions.Item label="Profile ID">{profile?.id}</Descriptions.Item>
                                    <Descriptions.Item label="Workflows numbers">{workflows.length}</Descriptions.Item>
                                    <Descriptions.Item label="Rewards"><b>{profile && profile.rewards ? profile.rewards : '0.00'}</b> VFuseCoin</Descriptions.Item>
                                </Descriptions>
                                <Divider />
                                <Descriptions title="Preferences" layout="vertical" bordered>
                                    <Descriptions.Item label="">
                                        <Row>
                                            <Col span={2}>
                                                <Row>
                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{discoveryTimeout}s</Typography.Text>
                                                </Row>
                                                <Row style={{height: "30vh"}}>
                                                    <Slider vertical
                                                            max={360}
                                                            disabled={preferences === null}
                                                            step={1}
                                                            value={discoveryTimeout}
                                                            onChange={(value) => onPreferencesChange('TIMEOUTS.DISCOVERY', value)}
                                                    />
                                                </Row>
                                                <Row>
                                                    <Typography.Text style={{marginTop : 16}}>Discovery</Typography.Text>
                                                </Row>
                                            </Col>
                                            <Col span={2}>
                                                <Row>
                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{workflowPublishingTimeout}s</Typography.Text>
                                                </Row>
                                                <Row style={{height: "30vh"}}>
                                                    <Slider vertical
                                                            max={360}
                                                            disabled={preferences === null}
                                                            step={1}
                                                            value={workflowPublishingTimeout}
                                                            onChange={(value) => onPreferencesChange('TIMEOUTS.WORKFLOWS_PUBLISHING', value)}
                                                    />
                                                </Row>
                                                <Row>
                                                    <Typography.Text style={{marginTop : 16}}>Workflows Publishing</Typography.Text>
                                                </Row>
                                            </Col>
                                            <Col span={2}>
                                                <Row>
                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{resultsPublishingTimeout}s</Typography.Text>
                                                </Row>
                                                <Row style={{height: "30vh"}}>
                                                    <Slider vertical
                                                            max={360}
                                                            disabled={preferences === null}
                                                            step={1}
                                                            value={resultsPublishingTimeout}
                                                            onChange={(value) => onPreferencesChange('TIMEOUTS.RESULTS_PUBLISHING', value)}
                                                    />
                                                </Row>
                                                <Row>
                                                    <Typography.Text style={{marginTop : 16}}>Results Publishing</Typography.Text>
                                                </Row>
                                            </Col>
                                            <Col span={2}>
                                                <Row>
                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{executionCycleTimeout}s</Typography.Text>
                                                </Row>
                                                <Row style={{height: "30vh"}}>
                                                    <Slider vertical
                                                            max={10}
                                                            disabled={preferences === null}
                                                            step={1}
                                                            value={executionCycleTimeout}
                                                            onChange={(value) => onPreferencesChange('TIMEOUTS.EXECUTION_CYCLE', value)}
                                                    />
                                                </Row>
                                                <Row>
                                                    <Typography.Text style={{marginTop : 16}}>Execution Cycle</Typography.Text>
                                                </Row>
                                            </Col>
                                            <Col span={2}>
                                                <Row>
                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{maxConcurrentJobs}</Typography.Text>
                                                </Row>
                                                <Row style={{height: "30vh"}}>
                                                    <Slider vertical
                                                            max={100}
                                                            disabled={preferences === null}
                                                            step={1}
                                                            value={maxConcurrentJobs}
                                                            onChange={(value) => onPreferencesChange('LIMITS.MAX_CONCURRENT_JOBS', value)}
                                                    />
                                                </Row>
                                                <Row>
                                                    <Typography.Text style={{marginTop : 16}}>Max Concurrent Jobs</Typography.Text>
                                                </Row>
                                            </Col>
                                            <Col span={8} style={{paddingTop : '10%'}}>
                                                <Row>
                                                    <Typography.Text style={{marginTop : 16, fontSize: 24, fontWeight: 800, width:'100%', textAlign:'center'}}>Usage</Typography.Text>
                                                </Row>
                                                <Row>
                                                    <GaugeChart id="usage-gauge-chart"
                                                                nrOfLevels={20}
                                                                percent={usage}
                                                                textColor={'#000000'}
                                                    />
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Descriptions.Item>
                                </Descriptions>
                            </>
                        </Layout.Content>
                    </PageHeader>
                </Col>
            </Row>
        </div>
    )
}
