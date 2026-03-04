import { expect } from 'chai'
import 'mocha'
import { publishReducer, ActionTypes, PublishState } from '../Publish'

describe('Publish Reducer', () => {
  const initialState: PublishState = {
    editorMode: 'json',
    retain: false,
    qos: 0,
    userProperties: [],
  }

  describe('initial state', () => {
    it('should have an empty userProperties array', () => {
      const state = publishReducer(undefined as any, { type: '@@INIT' } as any)
      expect(state.userProperties).to.deep.equal([])
    })
  })

  describe('PUBLISH_SET_USER_PROPERTIES', () => {
    it('should set user properties', () => {
      const props = [{ key: 'x-source', value: 'mqtt-explorer' }]
      const state = publishReducer(initialState, {
        type: ActionTypes.PUBLISH_SET_USER_PROPERTIES,
        userProperties: props,
      })
      expect(state.userProperties).to.deep.equal(props)
    })

    it('should replace existing user properties entirely', () => {
      const existing: PublishState = {
        ...initialState,
        userProperties: [{ key: 'old-key', value: 'old-value' }],
      }
      const newProps = [
        { key: 'env', value: 'production' },
        { key: 'version', value: '2' },
      ]
      const state = publishReducer(existing, {
        type: ActionTypes.PUBLISH_SET_USER_PROPERTIES,
        userProperties: newProps,
      })
      expect(state.userProperties).to.deep.equal(newProps)
      expect(state.userProperties).to.have.length(2)
    })

    it('should support clearing user properties with an empty array', () => {
      const existing: PublishState = {
        ...initialState,
        userProperties: [{ key: 'foo', value: 'bar' }],
      }
      const state = publishReducer(existing, {
        type: ActionTypes.PUBLISH_SET_USER_PROPERTIES,
        userProperties: [],
      })
      expect(state.userProperties).to.deep.equal([])
    })

    it('should not mutate other state fields', () => {
      const existing: PublishState = {
        ...initialState,
        payload: 'hello',
        retain: true,
        qos: 1,
        editorMode: 'raw',
      }
      const state = publishReducer(existing, {
        type: ActionTypes.PUBLISH_SET_USER_PROPERTIES,
        userProperties: [{ key: 'k', value: 'v' }],
      })
      expect(state.payload).to.equal('hello')
      expect(state.retain).to.equal(true)
      expect(state.qos).to.equal(1)
      expect(state.editorMode).to.equal('raw')
    })
  })
})
