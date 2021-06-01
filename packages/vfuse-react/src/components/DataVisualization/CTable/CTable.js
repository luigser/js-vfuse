import React, { useState, useEffect, useRef } from 'react';
import { Button, Table, Input, Space, Row, Col, AutoComplete, Typography, ConfigProvider, DatePicker } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import {Constants} from './constants';
import "./CTable.css"

export default function CTable ({dataSource, columns, actions, api, selection={type: Constants.Selection.NONE}})
{
    const [_dataSource, setDataSource] = useState(dataSource);
    const [_columns, setColumns] = useState(columns);
    // const [_currentPage, _setCurrentPage] = useState(1);
    const [_size, setSize] = useState();
    const [_height, setHeight] = useState();
    const container = React.createRef();
    const [singleSelectedRowIdx, setSingleSelectedRowIdx] = useState(0);

    useEffect(() => {
        setDataSource(dataSource);
    }, [dataSource]);

    useEffect(() => {
        if (api.size)
            setSize(api.size);
        else if (window.screen.width <= 1280)
            setSize("small");
        else if (window.screen.width <= 1920)
            setSize("middle");
        else
            setSize("default");

        if (!api.pagination){
            api.pagination = false
        }
    }, [api]);

    useEffect(() => {
        if(!_size || !api || !container)
            return;

        let h = container.current.offsetHeight;

        if(_size === 'small') {
            h -= 97;
            if(api.pagination && api.pagination.hideOnSinglePage)
                h += 58;
        }
        else if(_size === 'middle') {
            h -= 105;
            if(api.pagination && api.pagination.hideOnSinglePage)
                h += 58;
        }
        else {//default
            h -= 120;
            if(api.pagination && api.pagination.hideOnSinglePage)
                h += 65;
        }
        setHeight(h);
    }, [actions, container, api, _size]);

    useEffect(() => {
        if(!_dataSource || _dataSource.length === 0)
            return;

        let columnsCopy = cloneDeep(columns);

        if(!columnsCopy) {
            columnsCopy = [];
            Object.keys(_dataSource[0]).forEach(key => {
                columnsCopy.push({
                    title: key,
                    dataIndex: key,
                    key: key,
                });
            });
        }

        if(actions && actions.items.length){
            actions.items.map((item, index) => {
                columnsCopy.push({
                    title: actions.title,
                    key: 'action' + index,
                    align: item.align,//'center',
                    width: item.width,
                    render: item.render
                })
            });
        }

        setColumns(columnsCopy);
        
    }, [_dataSource, columns, actions, _size]);

    const onClickRow = (record, index) => {
        switch(selection.type){
            case Constants.Selection.SINGLE:
                return {
                    onClick: event => {
                        event.preventDefault();
                        singleSelectedRowIdx === record.id ? setSingleSelectedRowIdx(null) : setSingleSelectedRowIdx(record.id);
                        selection.callback(record, index, event);
                    }
                };
            case Constants.Selection.MULTIPLE:
                api.rowSelection=true;
                break;
            case Constants.Selection.NONE:
                break;
        }

        return {};
    };

    const setRowClassName = (record, index) => {
        return record.id === singleSelectedRowIdx ? 'clickRowStyl' : '';
    }

    return (
        <div className={'ant-table-custom'} ref={container}>
            <Table
                dataSource={_dataSource}
                columns={_columns}
                onRow={onClickRow}
                rowClassName={setRowClassName}
                {...api}
                size={_size}
                scroll={{x: 'auto', y: _height}}
                showSorterTooltip={false}
            />
        </div>
    );
};