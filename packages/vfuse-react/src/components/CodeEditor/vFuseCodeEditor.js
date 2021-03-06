import React, { useState, useEffect } from 'react'
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/ext-searchbox";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/snippets/javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/snippets/python";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-tomorrow";
import {Row, Col, Select} from "antd";

export default function VFuseCodeEditor(props) {

    const [language, setLanguage] = useState(props.language)
    const [fontSize, setFontSize] = useState(14)
    const [theme, setTheme] = useState("github")

    useEffect(() => {
        setFontSize(props.fontSize)
        setLanguage(props.language)
        switch(props.language){
            case 'javascript':
                setTheme("tomorrow")
                break
            case 'python':
                setTheme("github")
                break
        }
    },[props.language, props.fontSize])

    const onValueChange = code => {
        props.setCode(code)
    }

    return (
        <>
            <Row>
                <Col span={24}>
                    <AceEditor
                        mode={language}
                        theme={theme}
                        onChange={onValueChange}
                        value={props.code}
                        name="VFuse_code_editor"
                        editorProps={{ $blockScrolling: true }}
                        highlightActiveLine={true}
                        fontSize={fontSize}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true
                        }}
                        style={{width: "100%", height:"50vh"}}
                    />
                </Col>
            </Row>
        </>
    )

}
