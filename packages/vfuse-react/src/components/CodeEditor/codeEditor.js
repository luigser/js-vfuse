import React, { Fragment } from 'react'
import Editor from 'react-simple-code-editor'
import Highlight, { defaultProps } from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/vsLight'

const styles = {
    root: {
        boxSizing: 'border-box',
        fontFamily: '"Dank Mono", "Fira Code", monospace',
        ...theme.plain
    }
}

export default function CodeEditor(props) {

    const onValueChange = code => {
        props.setCode(code)
    }
    const highlight = code => (
        <Highlight {...defaultProps} theme={theme} code={code} language="jsx">
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
    )

    return (
        <Editor
            value={props.code}
            onValueChange={onValueChange}
            highlight={highlight}
            padding={10}
            style={styles.root}
        />
    )

}
