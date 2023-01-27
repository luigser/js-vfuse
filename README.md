# Overview

**VFuse** is a multiplatform library that implements a p2p fully decentralized volunteer network for asynchronous computational workflow execution.
Its primary purpose is to enable users to access a robust and secure volunteer network without requiring the installation and configuration of any additional software. Users can define asynchronous workflows composed of functions (jobs or tasks) with possible temporal dependencies on their execution. Thanks to the asynchronous nature of VFuse  workflows, users are free to leave the network while their required workflow is running and gather its results at any moment in the future.
It provides a secure and trustworthy multi-language performing execution environment.

## Architecture

Each **VFuse** node runs the VFuse suite, made up of five software components. The whole suite relies on the storage technologies offered through the IPFS distributed file system, along with the communication protocols implemented by Libp2p for P2P architectures. A description of each component of the protocol suite follows.

- **Access Component**

  This component gives users access to the VFuse network, offering an interface of the system. It can be a web application, command line interface(CLI) or, in general, every application able to interact with the API to leverage the VFuse  core features. Its implementation strictly depends on the target environment. The Access Component allows VFuse  users to manage their profiles, create, define, submit and stop the execution of their and other users running workflows.

- **API Component**

  This component defines the synchronous and asynchronous function interfaces to let users access the VFuse platform. We can distinguish two levels of APIs. The former concerns the programming interface to define workflows(Programming API). It exposes asynchronous functions used in workflow listing to add a job, get data or manipulate the corresponding DAG. The latter allows programmers to build interfaces to the system. It provides synchronous and asynchronous functions to retrieve, save, submit or stop workflows and get current executions. It also exposes a set of event handlers for real-time interfaces, e.g. to visualize a running workflow progresses.

- **Events and Data Component**

  This component provides data and communication utilities across \vfuse{} architectural layers. It acts as a glue among system components abstracting the way to access data. It communicates to the Network Component to save workflows and results to the distributed network using IPFS. At the same time, it furnishes local compressed storage for web-based, with an optimized key/value pairs strategy, and desktop, server and embedded applications by using the file system. It also acts as an events manager to allow communication across system components and exposes real-time information about executions and network status.

- **Network Component**

  This component is responsible for providing the VFuse network communication protocol and distributed data management (decentralized storage) functionalities by exploiting Libp2p and IPFS over a secure channel. It further offers (i) a set of callbacks to get information on the nodes status, (ii) bootstrap operations, (iii) direct optimized communication channel , (iv) a setof proxies to HTTPS and WebSocket Secure Layer(WSS) and (v) an interface to the IPFS Cluster.

- **Engine Component**

  This is the core component of the VFuse architecture, which provides all computing, rewarding, and user-related functionalities. It is made up of four modules: (i) the Workflow Module handling the workflows lifecycle; (ii) the Computing Module managing job executions from specific workflows; (iii) the Identity Module administrating user access and preferences; and (iv) the Reward Module defining and managing the rewarding mechanism via a blockchain for securely storing user rewards.

## **Programming Model**

VFuse adopt the **workflow pattern**, allowing the design of the requested computation as a sequence of interdependent jobs (or tasks). In other words, the computation is divided into self-consistent jobs, whose execution may depend on the termination of other tasks. An application, in VFuse system, is a workflow represented by a pipeline of jobs modelled via a direct acyclic graph(DAG).
Each node of the DAG represents a job, and an edge denotes dependencies between jobs. A job is a computational task that receives an input and produces an output. Every peer of the distributed network can potentially execute the job. A dependency relation indicates that a given job must wait until the end of another job before starting computation and a workflow execution means running all DAG nodes respecting the dependencies' constraints.
To define the workflow and related DAG, VFuse uses *declarative concurrent programming*, where a *high-level function* describes what computation should perform(logic) without describing the control flow. It matches perfectly with the decentralization principle where, due to the dynamic nature of the volunteer network, it is unpredictable where and when computation takes place. In particular, the reference pattern hinges on the *functional programming paradigm*. *The high-level function(first-class)* represents the application entry point where populate the DAG.
To define a job, the programmer must define a pure function that only depends on its parameters, with no manipulation of external variables(side effects). A specific path that starts from a node to a leaf represents a *high-order function*.

**The VFuse API for developing workflows**

| **Function/Object**  | **Params**  | **Return**  | **Description**                                                                  |
| :------------------- | :---------- | :---------- | :------------------------------------------------------------------------------- |
| **VFuse**                | -           | -           | The VFuse object to access the API methods/functions: VFuse.api_name(parameters) |
| **getData**              | CID         | String      | Retrieve content from IPFS using the given unique identifier CID                 |
| **getDataFromUrl**       | URL, Start, End | String  | Retrieve content from a given URL address. This method also permits the partial request of data if the server support the property *Accept-Ranges: bytes* |
| **saveData**             | Data | CID |  Store data on IPFS and returns a new CID, which uniquely identifies the data on IPFS |
| **addJob** | Name, Input, Dependencies, Groups | JID |  Adds a new job to the workflow DAG.<br> - **Name**: string value that corresponds to the function name defining the job;<br>- **Input**: the data in input to the job - may also be \textit{null};<br>- **Dependencies**: an array of job dependencies - it contains job IDs or regular expressions identifying matching jobs or group names;<br>- **Groups**: an array of string values corresponding to the groups' names to which the job belongs.<br> It returns an integer value corresponding to the unique identifier of the job in a workflow (*JID*) |
| **addToGroup** | JID, Groups | Boolean | Assign a job to all groups defined by the given array of string |
| **setRepeating** | JID | Boolean |  Set a job as a repeating job, i.e., a job is (re)scheduled every time all its dependencies are satisfied|



