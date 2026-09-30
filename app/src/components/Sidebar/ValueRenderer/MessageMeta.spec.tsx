import React from 'react'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { renderWithProviders } from '../../../utils/spec/testUtils'
import { RetainedIndicator, MessageProperties } from './MessageMeta'

// MUI injects <style> tags into the container, so read the chip label only
const chipLabel = (c: HTMLElement) => c.querySelector('.MuiChip-label')?.textContent ?? ''

describe('RetainedIndicator', () => {
  it('shows "Retained" when the message carries the retain flag', () => {
    const { container } = renderWithProviders(<RetainedIndicator retain={true} wasRetained={true} />)
    expect(chipLabel(container)).to.equal('Retained')
  })

  it('shows "was retained" for a live update on a topic that has a retained value', () => {
    const { container } = renderWithProviders(<RetainedIndicator retain={false} wasRetained={true} />)
    expect(chipLabel(container)).to.equal('was retained')
  })

  it('shows nothing for a topic that was never retained', () => {
    const { container } = renderWithProviders(<RetainedIndicator retain={false} wasRetained={false} />)
    expect(container.querySelector('.MuiChip-root')).to.equal(null)
  })
})

describe('MessageProperties', () => {
  it('lists MQTT v5 properties with user properties flattened in', () => {
    const { container } = renderWithProviders(
      <MessageProperties properties={{ contentType: 'application/json', userProperties: { site: 'north' } }} />
    )
    expect(container.textContent).to.contain('MQTT v5 Properties')
    expect(container.textContent).to.contain('contentType:application/json')
    expect(container.textContent).to.contain('site:north')
  })

  it('renders nothing when the message has no properties', () => {
    expect(renderWithProviders(<MessageProperties properties={undefined} />).container.textContent).to.equal('')
    expect(renderWithProviders(<MessageProperties properties={{}} />).container.textContent).to.equal('')
  })
})
