import { faUserCircle, faMagic, faCodeBranch, faNetworkWired, faBars } from '@fortawesome/free-solid-svg-icons'
import ProfilePage from "../pages/profile";
import NotebookPage from "../pages/notebook";
import NetworkPage from "../pages/network";
import WorkflowsPage from "../pages/workflows";
import RunningWorkflowPage from "../pages/runningWorkflow";
import RunningNotebookPage from "../pages/runningNotebook";

export const globalMenu = [{
    type : "flat",
    icon : faMagic,
    name : "Profile",
    items : [
        {
            key  : 'profile-page',
            name : "Profile",
            path : "/profile",
            page : ProfilePage,
            icon: faUserCircle
        },
        {
            key  : 'workflows-page',
            name : "My Workflows",
            path : "/workflows",
            page : WorkflowsPage,
            icon: faCodeBranch
        },
        {
            key  : 'running-workflow-page',
            name : "Running Workflows",
            path : "/running-workflow",
            page : RunningWorkflowPage,
            icon: faBars
        },
        {
            key  : 'network-page',
            name : "Network",
            path : "/network",
            page : NetworkPage,
            icon: faNetworkWired
        }
    ]
}];

export const globalRoutes = [
    {
        key  : 'profile-page',
        name : "profile-page-menu",
        path : "/profile",
        page : ProfilePage
    },
    {
        key  : 'workflows-page',
        name : "Workflows",
        path : "/workflows",
        page : WorkflowsPage,
    },
    {
        key  : 'notebook-page',
        name : "Notebook",
        path : "/notebook",
        page : NotebookPage,
    },
    {
        key  : 'network-page',
        name : "network",
        path : "/network",
        page : NetworkPage
    },
    {
        key  : 'running-workflow-page',
        name : "Running Workflows",
        path : "/running-workflow",
        page : RunningWorkflowPage
    },
    {
        key  : 'running-notebook-page',
        name : "Running Notebook",
        path : "/running-notebook",
        page : RunningNotebookPage
    }
];
