import * as q from '../../../../../backend/src/Model'
import React, { useMemo } from 'react'
import CodeDiff from '../CodeDiff'
import { AppState } from '../../../reducers'
import { connect } from 'react-redux'
import { ValueRendererDisplayMode } from '../../../reducers/Settings'
import { Fade } from '@mui/material'
import { Decoder } from '../../../../../backend/src/Model/Decoder'
import { useDecoder } from '../../hooks/useDecoder'
import { TopicViewModel } from '../../../model/TopicViewModel'
import * as Prism from 'prismjs'
import 'prismjs/components/prism-json'
import { withStyles } from '@mui/styles'
import { style } from '../CodeDiff/style'

interface Props {
  message: q.Message
  treeNode: q.TreeNode<any>
  compareWith?: q.Message
  renderMode: ValueRendererDisplayMode
  classes: any
}

type Language = 'json'

function renderSimpleCode(content: string | undefined, language?: Language, classes?: any) {
  if (!content) {
    return null
  }

  const highlighted = language === 'json' 
    ? Prism.highlight(content, Prism.languages.json, 'json')
    : content

  const lines = highlighted.split('\n')

  return (
    <div style={{ marginTop: '8px' }}>
      <div className={classes?.codeWrapper}>
        <pre className={classes?.codeBlock} style={{ width: '100%' }}>
          {lines.map((line, idx) => (
            <div key={idx} className={classes?.line}>
              <span dangerouslySetInnerHTML={{ __html: line || ' ' }} />
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}

function renderDiff(
  treeNode: q.TreeNode<TopicViewModel>,
  compareWithPreviousMessage: boolean,
  current: string = '',
  previous: string = '',
  title?: string,
  language?: Language
) {
  return (
    <CodeDiff
      treeNode={treeNode}
      previous={previous}
      current={current}
      title={title}
      language={language}
      nameOfCompareMessage={compareWithPreviousMessage ? 'selected' : 'previous'}
    />
  )
}

function renderDiffMode(
  treeNode: q.TreeNode<TopicViewModel>,
  currentStr: string | undefined,
  compareStr: string | undefined,
  currentType: Language | undefined,
  compareType: Language | undefined,
  compareWithPreviousMessage: boolean
) {
  const language = currentType === compareType && compareType === 'json' ? 'json' : undefined

  return <div>{renderDiff(treeNode, compareWithPreviousMessage, currentStr, compareStr, undefined, language)}</div>
}

function renderRawMode(
  treeNode: q.TreeNode<TopicViewModel>,
  currentStr: string | undefined,
  compareStr: string | undefined,
  currentType: Language | undefined,
  compareType: Language | undefined,
  compareWithPreviousMessage: boolean,
  classes?: any
) {
  // When no comparison is active, just show the raw current value without diff UI
  console.log('renderRawMode - compareStr:', compareStr ? 'HAS VALUE' : 'undefined')
  if (!compareStr) {
    console.log('→ Rendering simple code (no comparison)')
    return renderSimpleCode(currentStr, currentType, classes)
  }
  
  console.log('→ Rendering with comparison UI')
  // When comparing, show both current and selected messages with diff UI
  return (
    <div>
      {renderDiff(treeNode, compareWithPreviousMessage, currentStr, currentStr, undefined, currentType)}
      <Fade in={Boolean(compareStr)} timeout={400}>
        <div>
          {renderDiff(treeNode, compareWithPreviousMessage, compareStr, compareStr, 'selected', compareType)}
        </div>
      </Fade>
    </div>
  )
}

export const ValueRenderer: React.FC<Props> = ({ treeNode, compareWith: compare, message, renderMode, classes }) => {
  const decodeMessage = useDecoder(treeNode)
  const decodedMessage = useMemo(() => decodeMessage(message), [decodeMessage, message])

  const previousMessages = treeNode.messageHistory.toArray()
  const previousMessage = previousMessages[previousMessages.length - 2]
  // Only set compareMessage when explicitly comparing with a historic message
  const compareMessage = compare
  const compareWithPreviousMessage = !!compare

  // Force raw mode when not comparing - diff mode only makes sense when comparing
  const effectiveRenderMode = compareMessage ? renderMode : 'raw'

  // DEBUG LOGGING
  console.log('=== ValueRenderer Debug ===')
  console.log('Topic path:', treeNode.path())
  console.log('renderMode:', renderMode, '→ effective:', effectiveRenderMode)
  console.log('compareWith prop:', compare ? 'SET' : 'undefined')
  console.log('compareMessage:', compareMessage ? 'SET' : 'undefined')
  console.log('previousMessage:', previousMessage ? 'EXISTS' : 'undefined')
  console.log('Message history length:', previousMessages.length)

  const [currentStr, currentType] = useMemo(
    () => decodedMessage?.message?.format(treeNode.type) ?? [],
    [decodedMessage, treeNode.type]
  )
  const [compareStr, compareType] = useMemo(
    () => {
      const result = compareMessage ? decodeMessage(compareMessage)?.message?.format(treeNode.type) ?? [] : [undefined, undefined]
      console.log('compareStr:', result[0] ? `"${result[0].substring(0, 50)}..."` : 'undefined')
      console.log('currentStr:', currentStr ? `"${currentStr.substring(0, 50)}..."` : 'undefined')
      return result
    },
    [compareMessage, decodeMessage, treeNode.type, currentStr]
  )

  function renderValue(
    treeNode: q.TreeNode<TopicViewModel>,
    currentStr: string | undefined,
    compareStr: string | undefined,
    currentType: Language | undefined,
    compareType: Language | undefined,
    renderMode: string,
    compareWithPreviousMessage: boolean,
    classes: any
  ) {
    if (!decodedMessage) {
      return null
    }

    switch (renderMode) {
      case 'diff':
        return renderDiffMode(treeNode, currentStr, compareStr, currentType, compareType, compareWithPreviousMessage)
      default:
        return renderRawMode(treeNode, currentStr, compareStr, currentType, compareType, compareWithPreviousMessage, classes)
    }
  }

  const renderedValue = useMemo(
    () =>
      renderValue(treeNode, currentStr, compareStr, currentType, compareType, effectiveRenderMode, compareWithPreviousMessage, classes),
    [treeNode, currentStr, compareStr, currentType, compareType, effectiveRenderMode, compareWithPreviousMessage, classes]
  )

  return (
    <div style={{ padding: '0px 0px 8px 0px', width: '100%' }}>
      {decodedMessage?.decoder === Decoder.SPARKPLUG && 'Decoded SparkplugB'}
      {renderedValue}
    </div>
  )
}

const mapStateToProps = (state: AppState) => {
  return {
    renderMode: state.settings.get('valueRendererDisplayMode'),
  }
}

export default connect(mapStateToProps)(withStyles(style)(ValueRenderer))
