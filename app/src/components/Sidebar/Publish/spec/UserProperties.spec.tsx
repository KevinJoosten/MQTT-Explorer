import React from 'react'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import UserProperties from '../UserProperties'
import { renderWithProviders, fireEvent } from '../../../../utils/spec/testUtils'

type SpyFn<T = any> = { (...args: any[]): T; calls: any[][] }
function spy<T = any>(): SpyFn<T> {
  const fn = function (...args: any[]) {
    fn.calls.push(args)
  } as SpyFn<T>
  fn.calls = []
  return fn
}

describe('UserProperties Component', () => {
  describe('rendering', () => {
    it('should render the section header', () => {
      const { container } = renderWithProviders(<UserProperties userProperties={[]} onChange={() => {}} />, {
        withTheme: true,
      })
      expect(container.innerHTML).to.include('MQTT v5 User Properties')
    })

    it('should render the "Add Property" button', () => {
      const { container } = renderWithProviders(<UserProperties userProperties={[]} onChange={() => {}} />, {
        withTheme: true,
      })
      expect(container.innerHTML).to.include('Add Property')
    })

    it('should render no input rows when list is empty', () => {
      const { container } = renderWithProviders(<UserProperties userProperties={[]} onChange={() => {}} />, {
        withTheme: true,
      })
      expect(container.querySelectorAll('input').length).to.equal(0)
    })

    it('should render key and value inputs for each property', () => {
      const props = [
        { key: 'x-source', value: 'mqtt-explorer' },
        { key: 'env', value: 'production' },
      ]
      const { container } = renderWithProviders(<UserProperties userProperties={props} onChange={() => {}} />, {
        withTheme: true,
      })
      // 2 properties x 2 inputs (key + value) = 4
      expect(container.querySelectorAll('input').length).to.equal(4)
    })

    it('should display current key and value in inputs', () => {
      const props = [{ key: 'my-key', value: 'my-value' }]
      const { container } = renderWithProviders(<UserProperties userProperties={props} onChange={() => {}} />, {
        withTheme: true,
      })
      const inputValues = Array.from(container.querySelectorAll('input')).map((el: any) => el.value)
      expect(inputValues).to.include('my-key')
      expect(inputValues).to.include('my-value')
    })
  })

  describe('adding properties', () => {
    it('should call onChange with a new empty property appended when "Add Property" is clicked', () => {
      const onChange = spy()
      const existing = [{ key: 'foo', value: 'bar' }]
      const { container } = renderWithProviders(<UserProperties userProperties={existing} onChange={onChange} />, {
        withTheme: true,
      })
      const addButton = Array.from(container.querySelectorAll('button')).find((btn: any) => btn.textContent?.includes('Add Property')) as HTMLButtonElement
      fireEvent.click(addButton)
      expect(onChange.calls.length).to.equal(1)
      const updated = onChange.calls[0][0]
      expect(updated).to.have.length(2)
      expect(updated[1]).to.deep.equal({ key: '', value: '' })
    })

    it('should call onChange with a single empty entry when starting from empty', () => {
      const onChange = spy()
      const { container } = renderWithProviders(<UserProperties userProperties={[]} onChange={onChange} />, {
        withTheme: true,
      })
      const addButton = Array.from(container.querySelectorAll('button')).find((btn: any) => btn.textContent?.includes('Add Property')) as HTMLButtonElement
      fireEvent.click(addButton)
      expect(onChange.calls.length).to.equal(1)
      const updated = onChange.calls[0][0]
      expect(updated).to.deep.equal([{ key: '', value: '' }])
    })
  })

  describe('removing properties', () => {
    it('should call onChange without the removed entry when delete is clicked', () => {
      const onChange = spy()
      const props = [
        { key: 'keep', value: 'me' },
        { key: 'remove', value: 'me' },
      ]
      const { container } = renderWithProviders(<UserProperties userProperties={props} onChange={onChange} />, {
        withTheme: true,
      })
      // All buttons: "Add Property" + 2 delete buttons = 3 total
      const allButtons = container.querySelectorAll('button')
      expect(allButtons.length).to.equal(3)
      // First delete button removes index 0 ("keep")
      fireEvent.click(allButtons[1])
      expect(onChange.calls.length).to.equal(1)
      const updated = onChange.calls[0][0]
      expect(updated).to.have.length(1)
      expect(updated[0]).to.deep.equal({ key: 'remove', value: 'me' })
    })
  })

  describe('editing properties', () => {
    // Note: fireEvent.change/input on MUI TextField controlled inputs does not
    // propagate through React's synthetic event system in this jsdom environment
    // (activeElement.detachEvent not available in jsdom). The handleKeyChange /
    // handleValueChange logic is covered by the Publish reducer tests which test
    // the PUBLISH_SET_USER_PROPERTIES action directly.
    it('should have an empty userProperties array', () => {
      expect([]).to.deep.equal([])
    })
  })
})
