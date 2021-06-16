import React from 'react';
import {Menu} from 'antd';
import {Link} from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next';

export const DrawerMenu = React.memo(({menus, setSideCollapsed}) =>
{
    // console.log('DrawerMenu');
    //const {t} = useTranslation();

    const renderMenu = (menu, key) => {

        if(menu.type && menu.type === 'dropdown')
        {
            return(
                <Menu.SubMenu
                    key={key}
                    title={
                        <span>
                          <FontAwesomeIcon icon={menu.icon} className={"anticon"} />
                          {/*<span>{t(menu.name)}</span>*/}
                          <span>{menu.name}</span>
                        </span>
                    }>
                    {
                        menu.items.map((item, index) =>
                            <Menu.Item key={`${key}_${index}`}>
                                <Link to={`${item.path}`} onClick={() => setSideCollapsed(item.sideCollapsed ? item.sideCollapsed : false)}>
                                   {/* {t(item.name)}*/}
                                    {item.name}
                                </Link>
                            </Menu.Item>
                        )
                    }
                </Menu.SubMenu>
            );
        } else {
            return menu.items.map(
                (item, index) =>
                    <Menu.Item key={`${key}_${index}`} icon={<FontAwesomeIcon icon={item.icon} className={"anticon"} />}>
                        <Link to={`${item.path}`} onClick={() => setSideCollapsed(item.sideCollapsed ? item.sideCollapsed : false)}>
                            {/*{t(item.name)}*/}
                            {item.name}
                        </Link>
                    </Menu.Item>
            )
        }
    };

    return (
        <Menu
            style={{width: '100%'}}
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            mode="inline"
            theme="dark"
        >
            {menus.map((menu, idx) => renderMenu(menu, idx))}
        </Menu>
    );
});
