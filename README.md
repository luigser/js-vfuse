# Overview

**VFuse** is a multiplatform library that implements a p2p fully decentralized volunteer network for asynchronous computational workflow execution.
Its primary purpose is to enable users to access a robust and secure volunteer network without requiring the installation and configuration of any additional software. Users can define asynchronous workflows composed of functions (jobs or tasks) with possible temporal dependencies on their execution. Thanks to the asynchronous nature of \vfuse{}  workflows, users are free to leave the network while their required workflow is running and gather its results at any moment in the future.
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

