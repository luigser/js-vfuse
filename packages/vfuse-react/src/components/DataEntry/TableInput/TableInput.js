import React, { useState, useEffect } from 'react';
import {Form, Popconfirm, Table} from 'antd';
import { PlusOutlined, EditOutlined, CopyOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import "./css/AntTableInput.css"

// todo remove inline css if possible
// todo compaibility all items

export function TableInput({value, onChange, field, items, formReferences}) {

    const [form] = Form.useForm();
    const [_data, setData] = useState([]);
    const [_columns, setColumns] = useState(null);
    const [_currentPage, _setCurrentPage] = useState(1);
    const [editingKey, setEditingKey] = useState('');

    useEffect(() => {
        if(!value)
            return;
        // console.log('value CHANGED');
        let data = [];
        for (let i=0; i<value.length; i++) {
            let row = {key:i};
            Object.keys(value[i]).forEach(key => {
                row[key] = value[i][key];
            });
            data.push(row);
        }

        setEditingKey('');
        setData(data);
    }, [value]);

    useEffect(() => {
        if(!field || !_data || editingKey === undefined)
            return;

        // console.log('CHANGED');

        // set columns
        let columns = [];
        Object.keys(field.columns).forEach(key => {
            columns.push({
                title: field.columns[key].name,
                dataIndex: field.columns[key].key,
                key: field.columns[key].key,
                type: field.columns[key].type,
                editable: true
            });
        });

        const isEditing = record => record.key === editingKey;
        columns.push({
            // title: t('label-actions'),
            title: <PlusOutlined className={editingKey !== '' ? 'actions-disabled' : ''} onClick={() => {if(editingKey === '') add()}} style={{fontSize: '24px', color: '#1890ff'}}/>,
            key: 'action',
            align: 'center',
            width: field.mobileLayout ? 24+16+1 : 136+2,
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ?
                    (<div>
                        <CheckOutlined onClick={() => save(record.key)} style={{fontSize: '24px', marginRight: 24, color: '#1890ff'}}/>
                        <CloseOutlined onClick={() => setEditingKey('')} style={{fontSize: '24px', color: '#f5222d'}}/>
                    </div>) :
                    (<div className={editingKey !== '' ? 'actions-disabled' : ''}>
                        <EditOutlined onClick={() => {if(editingKey === '') edit(record)}} style={{fontSize: '24px', marginRight: 24, color: '#1890ff'}}/>
                        <CopyOutlined onClick={() => {if(editingKey === '') duplicate(record)}} style={{fontSize: '24px', marginRight: 24, color: '#1890ff'}}/>
                         <Popconfirm disabled={editingKey !== ''} onConfirm={() => {if(editingKey === '') remove(record)}} title={t('label-sure_to')} okText={t('button-ok')} cancelText={t('button-no')} >
                            <DeleteOutlined style={{fontSize: '24px', color: '#f5222d'}}/>
                        </Popconfirm>
                    </div>);
            }
        });

        setColumns(columns.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    inputType: col.type,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: isEditing(record),
                }),
            };
        }));
    }, [field, _data, editingKey]);

    const add = () => {
        let row = {key:_data.length};
        Object.keys(items).forEach(key => {
            row[key] = undefined;
        });
        setData(_data => {
            let data = cloneDeep(_data);
            data.push(row);
            return data;
        });
        setEditingKey(_data.length);
        let defaultPageSize = 10;//todo _defaultPageSize?
        _setCurrentPage(parseInt(_data.length/defaultPageSize)+1);

        let fieldsValue = {};
        Object.keys(field.columns).forEach(key => {
            fieldsValue[field.columns[key].key] = field.columns[key].default;
        });

        form.setFieldsValue(fieldsValue);
    };

    const duplicate = record => {
        let newValue = [];

        for (let i=0; i<_data.length; i++) {
            let v = {};
            Object.keys(_data[i]).forEach(key => {
                if (key !== 'key')
                    v[key] = _data[i][key];
            });
            newValue.push(v);
            if(_data[i].key === record.key)
                newValue.push(v);
        }

        onChange(newValue);
    };

    const edit = record => {
        /*Object.keys(record).forEach(key => {
            if (key === 'schedule-time')//todo BUG --> do not use key
                record[key] = moment(record[key], field.columns.find(o=>o.key===key).format)
        });*/
        form.setFieldsValue({...record});
        setEditingKey(record.key);
    };

    const remove = record => {
        let newValue = [];

        for (let i=0; i<_data.length; i++) {
            if(_data[i].key === record.key)
                continue;
            let v = {};
            Object.keys(_data[i]).forEach(key => {
                if (key !== 'key')
                    v[key] = _data[i][key];
            });
            newValue.push(v);
        }

        onChange(newValue);
    };

    const save = async key => {
        const row = await form.validateFields();
        const newData = cloneDeep(_data);
        const index = newData.findIndex(item => key === item.key);

        const item = newData[index];
        newData.splice(index, 1, {...item, ...row});

        let newValue = [];

        for (let i=0; i<newData.length; i++) {
            let v = {};
            Object.keys(newData[i]).forEach(key => {
                if (key !== 'key')
                    if(moment.isMoment(newData[i][key])) {
                        let format = field.columns.find(o=>o.key===key).format
                        v[key] = newData[i][key].format(format);
                    }
                    else
                        v[key] = newData[i][key];
            });
            newValue.push(v);
        }

        onChange(newValue);
    };

    const cancel = (page, pageSize) => {
        _setCurrentPage(page);
        setEditingKey('');
    };

    const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
        // console.log(children)
        if(!_columns)
            return (<td> </td>);
        // console.log('EditableCell: ' + inputType);
        let inputValue = children[1];
        if(!editing && inputType === 'AddOnNumber') {
            // console.log(  dataIndex, title, inputType, record, index, children, ...restProps);
            // console.log( children);
            // console.log( value);

            // children = children[1] + (value ? value[0].type : '');
            children = (children[1] + record.type).toString();
            // console.log( field.columns);
        }
        if(!editing && inputValue && field && formReferences && (inputType === 'Select' || inputType === 'Grid')) {
            // console.log('EditableCell: ' + inputType);
            let name = field.columns.find(o => o.key === dataIndex).options.name;
            let reference = field.columns.find(o => o.key === dataIndex).options.reference;
            if(Array.isArray(inputValue)) {
                let _children = [];
                if(!reference) {
                    for (let i = 0; i < inputValue.length; i++) {
                        _children.push(inputValue[i] + (i + 1 === inputValue.length ? '' : ', '));
                    }
                    children = _children;
                }
                else {
                   /* for (let i = 0; i < inputValue.length; i++) {
                        let child = formReferences[_path[reference]].find(o => o._id === inputValue[i]);
                        if (child)
                            _children.push(child.name + (i + 1 === inputValue.length ? '' : ', '));
                    }
                    children = _children;*/
                }
            } else {
                if(!reference) {
                    children = inputValue;
                }
                else {
                    /*if(Array.isArray(reference)) {
                        //todo find children in all references?
                        reference = reference[0];
                    }
                    let _children = formReferences[_path[reference]].find(o => o._id === inputValue);
                    children = _children ? _children[name] : '';*/
                }
            }
        }
        return (
            <td {...restProps}>
                {editing ? (
                    items[dataIndex]
                ) : (children)}
            </td>
        );
    };

    const EditableTable = () => {
        return (
            <Form form={form} size={'small'} component={false} initialValues={{type: "€"}}>
                <Table className={'custom-table-input'}
                    dataSource={_data}
                    columns={_columns}
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    rowClassName="editable-row"
                    pagination={{
                        defaultCurrent:_currentPage,
                        defaultPageSize: 10,
                        hideOnSinglePage:true,
                        onChange: cancel
                    }}
                    locale={{
                        // filterConfirm: 'Ok',
                        // filterReset: 'Reset',
                        emptyText: (<span style={{color:'rgba(0, 0, 0, 0.25)', height:26}}>{t('label-empty_table')}</span>)
                    }}
                />
            </Form>
        );
    };

    return (<EditableTable/>)
}
