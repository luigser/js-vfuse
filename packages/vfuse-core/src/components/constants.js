const Constants = {
    VFUSE_MODE:{
        NORMAL : "normal",
        GATEWAY: "gateway"
    },
    JOB_SATUS : {
        WAITING : 0,//due to dependencies
        READY: 1,//no dependences and ready to be executed
        COMPLETED: 2,//results are available
        ERROR: 3//something wrong during the execution
    },
    WORKFLOW_STATUS : {
        IDLE : 0,
        RUNNING : 1,
        COMPLETED : 2
    },
    TOPICS: {
        VFUSE_PUBLISH_CHANNEL : "vfuse_publish_channel"
    }
}

module.exports = Constants