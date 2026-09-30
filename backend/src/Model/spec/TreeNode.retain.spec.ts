import 'mocha'
import { expect } from 'chai'
import { TreeNode } from '../'
import { Base64Message } from '../Base64Message'

function message(retain: boolean, payload: string | null): any {
  return {
    payload: payload === null ? null : Base64Message.fromString(payload),
    qos: 0,
    retain,
    length: payload === null ? 0 : payload.length,
    received: new Date(0),
    messageNumber: 0,
  }
}

describe('TreeNode.wasRetained (sticky retained marker)', () => {
  it('is false before any message', () => {
    expect(new TreeNode().wasRetained).to.equal(false)
  })

  it('becomes true when a retained message is received', () => {
    const node = new TreeNode()
    node.setMessage(message(true, 'value'))
    expect(node.wasRetained).to.equal(true)
  })

  it('stays true when a later non-retained live message arrives', () => {
    const node = new TreeNode()
    node.setMessage(message(true, 'retained-value'))
    node.setMessage(message(false, 'live-update'))
    expect(node.wasRetained).to.equal(true)
    // ...but the current message is not itself retained
    expect(node.message!.retain).to.equal(false)
  })

  it('stays false for a topic that was never retained', () => {
    const node = new TreeNode()
    node.setMessage(message(false, 'a'))
    node.setMessage(message(false, 'b'))
    expect(node.wasRetained).to.equal(false)
  })

  it('resets to false when the value is cleared (empty payload)', () => {
    const node = new TreeNode()
    node.setMessage(message(true, 'value'))
    node.setMessage(message(false, null))
    expect(node.wasRetained).to.equal(false)
  })

  it('is preserved by unconnectedClone', () => {
    const node = new TreeNode()
    node.setMessage(message(true, 'value'))
    expect(node.unconnectedClone().wasRetained).to.equal(true)
  })
})
