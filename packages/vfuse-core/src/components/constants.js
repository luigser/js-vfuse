const Constants = {
    VFUSE_MODE:{
        PROACTIVE : "PROACTIVE",//give computation, give space if can be managed, work with workflow
        PASSIVE   : "PASSIVE",// just give computation
        GATEWAY   : "GATEWAY",//use as node gateway and http api,,
        PROACTIVE_GATEWAY: "PROACTIVE_GATEWAY", //be proactive and set gateway and api if configured
    },
    JOB:{
        TYPE:{
            OUTPUT : 'OUTPUT',
            EXECUTOR : 'EXECUTOR'
            //STREAM?
        },
        RETURN_TYPES:{
            ARRAY: 'ARRAY',
            INTEGER: 'INTEGER',
            OBJECT : 'OBJECT'
        },
        STATUS:{
            WAITING : 0,//due to dependencies
            READY: 1,//no dependences and ready to be executed
            COMPLETED: 2,//results are available
            ERROR: 3,//something wrong during the execution
            ENDLESS: 4,
            COLORS:{
                WAITING : '#F4B400',
                READY: '#0F9D58',
                COMPLETED: '#4285F4',
                ERROR: '#DB4437',
                ENDLESS : '#32586E'
            },
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
                    STOP_EXECUTION : 'workflow_stop_execution',
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
    EVENTS:{
        PROFILE_STATUS: 'PROFILE_STATUS',
        PROFILE_UPDATED: 'PROFILE_UPDATED',
        PREFERENCES_UPDATED: 'PREFERENCES_UPDATED',
        NODE_STATUS: 'NODE_STATUS',
        WORKFLOW_UPDATE: 'WORKFLOW_UPDATE',
        RUNNING_WORKFLOW_UPDATE: 'RUNNING_WORKFLOW_UPDATE',
        NETWORK_DISCOVERY_PEERS: 'NETWORK_DISCOVERY_PEERS',
        CONSOLE_MESSAGE : 'CONSOLE_MESSAGE',
        RUNNING_WORKFLOWS_UPDATE : 'RUNNING_WORKFLOWS_UPDATES'

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
        EXECUTION_CYCLE: 10,
        JOB_EXECUTION : 300000
    },
    LIMITS: {
        MAX_CONCURRENT_JOBS : 2,
        MAX_MANAGED_WORKFLOWS : 100
    }
}

module.exports = Constants
