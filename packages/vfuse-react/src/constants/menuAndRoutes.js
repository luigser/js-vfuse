import { faUserCircle, faMagic, faCodeBranch, faNetworkWired } from '@fortawesome/free-solid-svg-icons'
import ProfilePage from "../pages/profile";
import NotebookPage from "../pages/notebook";
import NetworkPage from "../pages/network";

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
            key  : 'notebook-page',
            name : "Notebook",
            path : "/notebook",
            page : NotebookPage,
            icon: faCodeBranch
        },
        {
            key  : 'network-page',
            name : "network",
            path : "/network",
            page : NetworkPage,
            icon: faNetworkWired
        },
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
    }
];
