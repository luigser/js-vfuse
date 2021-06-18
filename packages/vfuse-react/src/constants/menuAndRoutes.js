import { faUserCircle, faMagic, faCodeBranch } from '@fortawesome/free-solid-svg-icons'
import ProfilePage from "../pages/profile";
import NotebookPage from "../pages/notebook";

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
    }
];