import React, { Fragment, useState } from 'react'
import Editor from 'react-simple-code-editor'
import Highlight, { defaultProps } from 'prism-react-renderer'
import pyTheme from 'prism-react-renderer/themes/vsLight'
import jsTheme from 'prism-react-renderer/themes/github'
import {Row, Col, Select} from "antd";

export default function CodeEditor(props) {

    const [language, setLanguage] = useState(props.language)
    const [theme, setTheme] = useState(jsTheme)

    const onValueChange = code => {
        props.setCode(code)
    }

    function handleChange(value) {
        setLanguage(value)
        props.setLanguage(value)
        switch(value){
            case 'javascript':
                setTheme(jsTheme)
                break
            case 'python':
                setTheme(pyTheme)
                break
        }
    }

    return (
        <>
            <Row>
                <Col span={24}>
                    <Select defaultValue="javascript" style={{ width: 120, float: "right" }} onChange={handleChange}>
                        <Select.Option value="javascript">Javascript</Select.Option>
                        <Select.Option value="python">Python</Select.Option>
                    </Select>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <Editor
                        value={props.code}
                        onValueChange={onValueChange}
                        highlight={ code => (
                            <Highlight {...defaultProps} theme={theme} code={code} language={language}>
                                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                                    <Fragment>
                                        {tokens.map((line, i) => (
                                            <div {...getLineProps({ line, key: i })}>
                                                {line.map((token, key) => <span {...getTokenProps({ token, key })} />)}
                                            </div>
                                        ))}
                                    </Fragment>
                                )}
                            </Highlight>
                        )}
                        padding={10}
                        style={{
                            boxSizing: 'border-box',
                            fontFamily: '"Dank Mono", "Fira Code", monospace',
                            ...theme.plain
                        }}
                    />
                </Col>
            </Row>
        </>
    )

}
