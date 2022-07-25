import React, {useState, useEffect} from 'react';
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
    Slider,
} from "antd";
import VFuse from "vfuse-core";
import GaugeChart from 'react-gauge-chart'
import {useVFuse} from "../hooks/useVFuse"
import {gStore} from "../store";

export default function ProfilePage(props){
    const [vFuseNode, setVFuseNode] = useState(gStore.get("vFuseNode"))
    const [profile, setProfile] = useState(null)
    const [status, setStatus] = useState(VFuse.Constants.NODE_STATE.STOP)
    const [startLoading, setStartLoading] = useState(false)
    const [stopLoading, setStopLoading] = useState(false)
    const [startDisabled, setStartDisabled] = useState(!!vFuseNode)
    const [stopDisabled, setStopDisabled] = useState(!vFuseNode)
    const [workflows, setWorkflows] = useState([])
    const [preferences, setPreferences] = useState(null)
    const [discoveryTimeout, setDiscoveryTimeout] = useState(0)
    const [workflowPublishingTimeout, setWorkflowPublishingTimeout] = useState(0)
    const [resultsPublishingTimeout, setResultsPublishingTimeout] = useState(0)
    const [maxManagedWorkflows, setMaxManagedWorkflows] = useState(0)
    const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(0)
    const [jobExecutionTimeout, setJobExecutionTimeout] = useState(0)
    const [usage, setUsage] = useState(0)
    const [signalServer, setSignalServer] = useState(/*''*/'/dns4/172.16.149.150/tcp/2002/wss/p2p-webrtc-star/')
    const [delegateNode, setDelegateNode] = useState('')
    const [pinningServerProtocol, setPinningServerProtocol] = useState('https')
    const [pinningServerHost, setPinningServerHost] = useState(/*'193.205.161.5'*/'172.16.149.159')
    const [pinningServerPort, setPinningServerPort] = useState('9097')
    const [bootstraps, setBootstraps] = useState([/*'/dns4/localhost/tcp/4002/wss/p2p/12D3KooWRHLrRxJZh9MbVr4m8mheAvSbx9iZXjyeXZC1bxtyDFQW'*/'/dns4/172.16.149.150/tcp/4002/wss/p2p/12D3KooWS8x3JoxZazS8K1zDQGKGFoWQ1JX5u7enEPAeTM84YiDY'])
    const [bootstrapsString, setBootstrapString] = useState(/*'/dns4/localhost/tcp/4002/wss/p2p/12D3KooWRHLrRxJZh9MbVr4m8mheAvSbx9iZXjyeXZC1bxtyDFQW'*/'/dns4/172.16.149.150/tcp/4002/wss/p2p/12D3KooWS8x3JoxZazS8K1zDQGKGFoWQ1JX5u7enEPAeTM84YiDY')
    const [savePreferencesLoading, setSavePreferencesLoading] = useState(false)
    const [savePreferencesDisabled, setSavePreferencesDisabled] = useState(!vFuseNode)


    const {getNode} = useVFuse()

    useEffect( () => {
        let ls_signalServer = localStorage.getItem('signalServer')
        let ls_bootstraps = localStorage.getItem('bootstraps')
        let ls_pinningServerProtocol = localStorage.getItem('pinningServerProtocol')
        let ls_pinningServerHost = localStorage.getItem('pinningServerHost')
        let ls_pinningServerPort = localStorage.getItem('pinningServerPort')
        let ls_delegateNode = localStorage.getItem('delegateNode')

        if(ls_signalServer){
            setSignalServer(ls_signalServer)
        }else{
            localStorage.setItem('signalServer', signalServer)
        }

        if(ls_bootstraps){
            let bs = JSON.parse(ls_bootstraps)
            setBootstraps(bs)
            setBootstrapString(bs.map(b => b + '\n'))
        }else{
            localStorage.setItem('bootstraps', JSON.stringify(bootstraps))
        }

        if(ls_pinningServerProtocol && ls_pinningServerHost && ls_pinningServerPort){
            setPinningServerProtocol(ls_pinningServerProtocol)
            setPinningServerHost(ls_pinningServerHost)
            setPinningServerPort(ls_pinningServerPort)
        }else{
            localStorage.setItem('pinningServerProtocol', pinningServerProtocol)
            localStorage.setItem('pinningServerHost', pinningServerHost)
            localStorage.setItem('pinningServerPort', pinningServerPort)
        }

        if(ls_delegateNode) {
            setDelegateNode(ls_delegateNode)
        }else {
            localStorage.setItem('delegateNode', delegateNode)
        }

    }, [])

    useEffect(() => {
        try {
            if (vFuseNode) {
                let profile = vFuseNode.getProfile()
                let workflows = vFuseNode.getWorkflows()
                setProfile(profile)
                setWorkflows(workflows)
                setPreferences(profile.preferences)
                setDiscoveryTimeout(profile.preferences.TIMEOUTS.DISCOVERY)
                setWorkflowPublishingTimeout(profile.preferences.TIMEOUTS.WORKFLOWS_PUBLISHING)
                setResultsPublishingTimeout(profile.preferences.TIMEOUTS.RESULTS_PUBLISHING)
                setMaxManagedWorkflows(profile.preferences.LIMITS.MAX_MANAGED_WORKFLOWS)
                setMaxConcurrentJobs(profile.preferences.LIMITS.MAX_CONCURRENT_JOBS)
                setUsage(profile.preferences.CONSTANTS.CPU_USAGE)
                setJobExecutionTimeout(profile.preferences.TIMEOUTS.JOB_EXECUTION)
                setSignalServer(profile.preferences.ENDPOINTS.SIGNAL_SERVER)
                setBootstraps(profile.preferences.ENDPOINTS.BOOTSTRAPS)
                setBootstrapString(profile.preferences.ENDPOINTS.BOOTSTRAPS.map(b => b + '\n'))
                setPinningServerProtocol(profile.preferences.ENDPOINTS.PINNING_SERVER.PROTOCOL)
                setPinningServerHost(profile.preferences.ENDPOINTS.PINNING_SERVER.HOST)
                setPinningServerPort(profile.preferences.ENDPOINTS.PINNING_SERVER.PORT)
                setDelegateNode(profile.preferences.ENDPOINTS.DELEGATE_NODE)
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

    const onStartNode = async(mode) => {
        try {
            setStartLoading(true)
            setStatus(VFuse.Constants.NODE_STATE.INITIALIZING)

            let pinningServer = { protocol : pinningServerProtocol, host : pinningServerHost, port : pinningServerPort}
            let node = await getNode(signalServer, bootstraps, pinningServer, delegateNode)
            if(node.error) {
                setStatus(VFuse.Constants.NODE_STATE.STOP)
                setStartLoading(false)
                notification.error({
                    message : "Something went wrong",
                    description : node.error
                });
                return
            }

            setVFuseNode(node)

            node.addListener(VFuse.Constants.EVENTS.NODE_STATUS, function(data){
                if(data.status){
                    setProfile(data.profile)
                    setPreferences(data.profile.preferences)
                    setDiscoveryTimeout(data.profile.preferences.TIMEOUTS.DISCOVERY)
                    setWorkflowPublishingTimeout(data.profile.preferences.TIMEOUTS.WORKFLOWS_PUBLISHING)
                    setResultsPublishingTimeout(data.profile.preferences.TIMEOUTS.RESULTS_PUBLISHING)
                    setMaxManagedWorkflows(data.profile.preferences.LIMITS.MAX_MANAGED_WORKFLOWS)
                    setMaxConcurrentJobs(data.profile.preferences.LIMITS.MAX_CONCURRENT_JOBS)
                    setUsage(data.profile.preferences.CONSTANTS.CPU_USAGE)
                    setJobExecutionTimeout(data.profile.preferences.TIMEOUTS.JOB_EXECUTION)
                    setSignalServer(data.profile.preferences.ENDPOINTS.SIGNAL_SERVER === '' ? signalServer : data.profile.preferences.ENDPOINTS.SIGNAL_SERVER)
                    setBootstraps(data.profile.preferences.ENDPOINTS.BOOTSTRAPS.length === 0 ? bootstraps : data.profile.preferences.ENDPOINTS.BOOTSTRAPS.length)
                    setBootstrapString(data.profile.preferences.ENDPOINTS.BOOTSTRAPS.length === 0 ? bootstrapsString : data.profile.preferences.ENDPOINTS.BOOTSTRAPS.map(b => b + '\n'))
                    setPinningServerProtocol(data.profile.preferences.ENDPOINTS.PINNING_SERVER.PROTOCOL === '' ? pinningServerProtocol : data.profile.preferences.ENDPOINTS.PINNING_SERVER.PROTOCOL)
                    setPinningServerHost(data.profile.preferences.ENDPOINTS.PINNING_SERVER.HOST === '' ? pinningServerProtocol : data.profile.preferences.ENDPOINTS.PINNING_SERVER.HOST)
                    setPinningServerPort(data.profile.preferences.ENDPOINTS.PINNING_SERVER.PORT === '' ? pinningServerProtocol : data.profile.preferences.ENDPOINTS.PINNING_SERVER.PORT)
                    setDelegateNode(data.profile.preferences.ENDPOINTS.DELEGATE_NODE === '' ? delegateNode : data.profile.preferences.ENDPOINTS.DELEGATE_NODE)
                    setWorkflows(data.workflows)
                    setStartDisabled(true)
                    setStopDisabled(false)
                    setSavePreferencesDisabled(false)
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
                gStore.set({vFuseNode: null})
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
            (((executionCycleTimeoutConstant - maxManagedWorkflows) * executionCycleTimeoutWeight)) +
            (((maxConcurrentJobs - maxConcurrentJobsConstant) * maxConcurrentJobsWeight))
        )
        if(usage <= 0) usage = 0
        if(usage > 1)  usage = 1
        setUsage(usage)
    }

    const onPreferencesChange = (type, value) =>{
        try {
            let prefs = {...preferences}
            switch (type) {
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
                case 'LIMITS.MAX_MANAGED_WORKFLOWS':
                    setMaxManagedWorkflows(value)
                    prefs.LIMITS.MAX_MANAGED_WORKFLOWS = value
                    break
                case 'TIMEOUTS.JOB_EXECUTION':
                    setJobExecutionTimeout(value)
                    prefs.TIMEOUTS.JOB_EXECUTION = value
                    break
                case 'LIMITS.MAX_CONCURRENT_JOBS':
                    setMaxConcurrentJobs(value)
                    prefs.LIMITS.MAX_CONCURRENT_JOBS = value
                    break
                case 'ENDPOINTS.SIGNAL_SERVER':
                    localStorage.setItem('signalServer', value)
                    setSignalServer(value)
                    if (vFuseNode)
                        prefs.ENDPOINTS.SIGNAL_SERVER = value
                    break
                case 'ENDPOINTS.BOOTSTRAPS':
                    setBootstrapString(value)
                    let bts = value.split('\n')
                    setBootstraps(value.split(bts))
                    localStorage.setItem('bootstraps', JSON.stringify(bts))
                    if (vFuseNode)
                        prefs.ENDPOINTS.BOOTSTRAPS = value.split('\n')
                    break
                case 'ENDPOINTS.PINNING_SERVER.PROTOCOL':
                    localStorage.setItem('pinningServerProtocol', value)
                    setPinningServerProtocol(value)
                    if (vFuseNode)
                        prefs.ENDPOINTS.PINNING_SERVER.PROTOCOL = value
                    break
                case 'ENDPOINTS.PINNING_SERVER.HOST':
                    localStorage.setItem('pinningServerHost', value)
                    setPinningServerHost(value)
                    if (vFuseNode)
                        prefs.ENDPOINTS.PINNING_SERVER.HOST = value
                    break
                case 'ENDPOINTS.PINNING_SERVER.PORT':
                    localStorage.setItem('pinningServerPost', value)
                    setPinningServerPort(value)
                    if (vFuseNode)
                        prefs.ENDPOINTS.PINNING_SERVER.PORT = value
                    break
                case 'ENDPOINTS.DELEGATE_NODE':
                    localStorage.setItem('delegateNode', value)
                    setDelegateNode(value)
                    if (vFuseNode)
                        prefs.ENDPOINTS.DELEGATE_NODE = value
                    break
            }
            calculateUsage()
            setPreferences(prefs)
        }catch (e) {
            notification.error({
                message: "It is not possible to save preferences\nPlease check provided values",
            });
        }
    }

    const savePreferences = async () => {
        setSavePreferencesLoading(true)
        let result = await vFuseNode.savePreferences(preferences)
        if(!result) {
            notification.error({
                message: "Something went wrong",
            });
        }else{
            notification.success({
                message : "Preferences successfully saved",
            });
        }
        setSavePreferencesLoading(false)
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
                            <Button id="start_node" key="3" type="primary" disabled={startDisabled} loading={startLoading} onClick={() => onStartNode("start")}>Start</Button>,
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
                                <Row>
                                    <Tabs defaultActiveKey="2" style={{width: "100%"}}>
                                        <Tabs.TabPane tab="Timeouts and Limits" key="1">
                                            <Col span={24}>
                                                <Descriptions
                                                    title="Preferences"
                                                    layout="vertical"
                                                    bordered
                                                    extra={<Button disabled={savePreferencesDisabled} loading={savePreferencesLoading} type="primary" onClick={savePreferences}>Save</Button>}>
                                                    <Descriptions.Item label="Use sliders to set values">
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
                                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{maxManagedWorkflows}</Typography.Text>
                                                                </Row>
                                                                <Row style={{height: "30vh"}}>
                                                                    <Slider vertical
                                                                            max={500}
                                                                            disabled={preferences === null}
                                                                            step={1}
                                                                            value={maxManagedWorkflows}
                                                                            onChange={(value) => onPreferencesChange('LIMITS.MAX_MANAGED_WORKFLOWS', value)}
                                                                    />
                                                                </Row>
                                                                <Row>
                                                                    <Typography.Text style={{marginTop : 16}}>Max Managed Workflows</Typography.Text>
                                                                </Row>
                                                            </Col>
                                                            <Col span={2}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{maxConcurrentJobs}</Typography.Text>
                                                                </Row>
                                                                <Row style={{height: "30vh"}}>
                                                                    <Slider vertical
                                                                            max={window.navigator.hardwareConcurrency - 1}
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
                                                            <Col span={2}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>{jobExecutionTimeout}</Typography.Text>
                                                                </Row>
                                                                <Row style={{height: "30vh"}}>
                                                                    <Slider vertical
                                                                            max={600}
                                                                            disabled={preferences === null}
                                                                            step={10}
                                                                            value={jobExecutionTimeout}
                                                                            onChange={(value) => onPreferencesChange('TIMEOUT.JOB_EXECUTION', value)}
                                                                    />
                                                                </Row>
                                                                <Row>
                                                                    <Typography.Text style={{marginTop : 16}}>Job Execution Timeout</Typography.Text>
                                                                </Row>
                                                            </Col>
                                                            <Col span={8} style={{paddingTop : '2%'}}>
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

                                            </Col>
                                        </Tabs.TabPane>
                                        <Tabs.TabPane tab="Endpoints" key="2">
                                            <Col span={24} style={{height: "60vh"}}>
                                                <Descriptions
                                                    title="Preferences"
                                                    layout="vertical"
                                                    bordered
                                                    extra={<Button disabled={savePreferencesDisabled} loading={savePreferencesLoading} type="primary" onClick={savePreferences}>Save</Button>}>
                                                    <Descriptions.Item label="Change endpoints before starting node if you want to use different a signal server or bootstraps">
                                                        <Row>
                                                            <Col span={24}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 16, textAlign: 'center'}}>Signal Server</Typography.Text>
                                                                </Row>
                                                                <Row>
                                                                    <Input
                                                                        id="signal_server"
                                                                        placeholder="/ip4/192.168.1.57/tcp/2000/ws/p2p-webrtc-star"
                                                                        onChange={(value) => onPreferencesChange('ENDPOINTS.SIGNAL_SERVER',value.currentTarget.value)}
                                                                        value={signalServer} />
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                        <Row style={{marginTop: 12}}>
                                                            <Col span={8}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 8, textAlign: 'center'}}>Pinning Server Protocol</Typography.Text>
                                                                </Row>
                                                                <Row>
                                                                    <Input
                                                                        id="pinner_protocol"
                                                                        placeholder='https'
                                                                        onChange={(value) => onPreferencesChange('ENDPOINTS.PINNING_SERVER.PROTOCOL',value.currentTarget.value)}
                                                                        value={pinningServerProtocol} />
                                                                </Row>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 8, textAlign: 'center'}}>Pinning Server IP</Typography.Text>
                                                                </Row>
                                                                <Row>
                                                                    <Input
                                                                        id="pinner_host"
                                                                        placeholder='193.205.161.5'
                                                                        onChange={(value) => onPreferencesChange('ENDPOINTS.PINNING_SERVER.HOST',value.currentTarget.value)}
                                                                        value={pinningServerHost} />
                                                                </Row>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 8, textAlign: 'center'}}>Pinning Server Port</Typography.Text>
                                                                </Row>
                                                                <Row>
                                                                    <Input
                                                                        id="pinner_port"
                                                                        placeholder='9097'
                                                                        onChange={(value) => onPreferencesChange('ENDPOINTS.PINNING_SERVER.PORT',value.currentTarget.value)}
                                                                        value={pinningServerPort} />
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                        <Row style={{marginTop: 12}}>
                                                            <Col span={24}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 8, textAlign: 'center'}}>Delegate Node</Typography.Text>
                                                                </Row>
                                                                <Row>
                                                                    <Input
                                                                        placeholder=''
                                                                        onChange={(value) => onPreferencesChange('ENDPOINTS.DELEGATE_NODE',value.currentTarget.value)}
                                                                        value={delegateNode} />
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                        <Row style={{marginTop: 12}}>
                                                            <Col span={24}>
                                                                <Row>
                                                                    <Typography.Text style={{marginBottom : 8, textAlign: 'center'}}>Bootstraps <b>(Separate bootstrap endpoints with newline. Remember to save preferences if you change this values)</b></Typography.Text>
                                                                </Row>
                                                                <Row>
                                                                    <Input.TextArea
                                                                        id="bootstrap"
                                                                        style={{height : '20vh'}}
                                                                        onChange={(value) =>  onPreferencesChange('ENDPOINTS.BOOTSTRAPS',value.currentTarget.value)}
                                                                        value={bootstrapsString}
                                                                        placeholder="/ip4/192.168.1.57/tcp/4003/ws/p2p/12D3KooWRKxogWN84v2d8zWUexowJ2v6iGQjkAL9qYXHuXrf9DLY"/>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            </Col>
                                        </Tabs.TabPane>
                                    </Tabs>
                                </Row>
                            </>
                        </Layout.Content>
                    </PageHeader>
                </Col>
            </Row>
        </div>
    )
}
