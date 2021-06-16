import React, {useState} from 'react';
import {Layout, Row, Col} from "antd";
import {MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { Router } from 'react-router-dom';
import history from './libs/history';
import {Routes} from './libs/routes';
import {DrawerMenu} from "./components/toolbar/drawer-menu";
import {globalMenu, globalRoutes} from './constants/menuAndRoutes'

import './theme.css'
import './App.css'

function App() {
    const [collapsed, setCollapsed] = useState(true)

    return (
        <div className="core-main" key="main">
            <Router history={history}>
                <Layout style={{height:'100%'}}>
                    <Layout.Sider trigger={null} collapsible collapsed={collapsed}>
                        <div className="logo">V<span>Fuse</span></div>
                        {globalMenu.length > 0 ? <DrawerMenu menus={globalMenu} setSideCollapsed={setCollapsed} /> : null}
                    </Layout.Sider>
                    <Layout className="site-layout">
                        <Layout.Header className="site-layout-background" style={{padding:0, boxShadow:'0 2px 8px #f0f1f2' }}>
                            <Row>
                                <Col>
                                    {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                                        className: 'trigger',
                                        onClick: ()=>{setCollapsed(!collapsed)},
                                    })}
                                </Col>
                                <Col flex={"auto"}>
                                   <h3>Workbench</h3>
                                </Col>
                               {/* <Col flex={"168px"}>
                                    <Avatar key="avatar" alt="Rended" src="./img/avatars/ddr.jpeg" style={{marginRight:8}} />
                                    <span key="name">User</span>
                                    <CaretDownOutlined key="icon" />
                                </Col>*/}
                            </Row>
                        </Layout.Header>
                        <Layout.Content className="site-layout-background" style={{margin: '24px 16px', padding: 24}}>
                            <Routes routes={globalRoutes} />
                        </Layout.Content>
                    </Layout>
                </Layout>
            </Router>
        </div>
    )
}

export default App;
