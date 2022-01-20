const Constants = {
    VFUSE_MODE:{
        PROACTIVE : "PROACTIVE",//give computation, give space if can be managed, work with workflow
        PASSIVE   : "PASSIVE",// just give computation
        GATEWAY   : "GATEWAY",//use as node gateway and http api,,
        PROACTIVE_GATEWAY: "PROACTIVE_GATEWAY", //be proactive and set gateway and api if configured
    },
    JOB_SATUS : {
        WAITING : 0,//due to dependencies
        READY: 1,//no dependences and ready to be executed
        COMPLETED: 2,//results are available
        ERROR: 3,//something wrong during the execution
        COLORS:{
            WAITING : '#F4B400',
            READY: '#0F9D58',
            COMPLETED: '#4285F4',
            ERROR: '#DB4437'
        }
    },
    WORKFLOW : {
        STATUS: {
            IDLE: 0,
            RUNNING: 1,
            COMPLETED: 2
        }
    },
    TOPICS: {
        VFUSE_PUBLISH_CHANNEL :{
            NAME : "vfuse_publish_channel",
            ACTIONS: {
                DISCOVERY : 'discovery',
                WORKFLOW : {
                    EXECUTION_REQUEST : 'workflow_execution_request',
                    EXECUTION_RESPONSE : 'workflow_execution_response',
                    UNPUBLISH : 'workflow_unpublish'
                },
                JOB:{
                    EXECUTION_REQUEST: 'job_execution_request',
                    EXECUTION_RESPONSE: 'job_execution_response'
                },
                RESULTS:{
                    RECEIVED: 'result_received'
                }
            }
        }
    },
    NODE_STATE: {
        STOP: 0,
        INITIALIZING: 1,
        RUNNING: 2
    },
    RUNTIME_TYPES:{
        WEB : 'web'
    },
    NETWORK_MANAGERS_TYPE: {
        IPFS_LIBP2P : "IPFS_LIBP2P"
    },
    PROGRAMMING_LANGUAGE:{
        JAVASCRIPT : 'javascript',
        PYTHON : 'python'
    },
    TIMEOUTS:{
        DISCOVERY : 15000,
        WORKFLOWS_PUBLISHING : 60000,
        JOBS_PUBLISHING : 15000,
        RESULTS_PUBLISHING: 120000,
        EXECUTION_CYCLE: 1000,
        JOB_EXECUTION : 60000
    },
    LIMITS: {
        MAX_CONCURRENT_JOBS : 5
    }
}

module.exports = Constants
