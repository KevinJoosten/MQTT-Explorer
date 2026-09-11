/**
 * Sidebar layout tests
 *
 * The sidebar shows Details and Publish as two tabs by default. With the
 * "Combined Sidebar" setting enabled it stacks both in one scrollable column,
 * so a message can be composed while the selected topic keeps updating.
 */

import 'jsdom-global/register' // must precede the reducers, they read `window` at module scope
import React from 'react'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider as StylesThemeProvider } from '@mui/styles'
import { createTheme } from '@mui/material/styles'
import rootReducer from '../../reducers'
import { ActionTypes } from '../../reducers/Settings'
import Sidebar from './Sidebar'
import { renderWithProviders } from '../../utils/spec/testUtils'

function renderSidebar(combineDetailsAndPublish: boolean) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  })
  store.dispatch({ type: ActionTypes.SETTINGS_DID_LOAD_SETTINGS, settings: { combineDetailsAndPublish } })

  // withStyles comes from the legacy @mui/styles package, which reads its own theme context
  return renderWithProviders(
    <StylesThemeProvider theme={createTheme()}>
      <Sidebar />
    </StylesThemeProvider>,
    { store: store as any, withRedux: true }
  )
}

describe('Sidebar', () => {
  it('shows Details and Publish as separate tabs by default', () => {
    const { container } = renderSidebar(false)

    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist, 'expected a tab bar').to.exist
    expect(tablist?.textContent).to.contain('Details')
    expect(tablist?.textContent).to.contain('Publish')
  })

  it('stacks Details and Publish in one column when combined', () => {
    const { container } = renderSidebar(true)

    expect(container.querySelector('[role="tablist"]'), 'expected no tab bar').to.not.exist
    expect(container.querySelector('[data-testid="publish-tab"]'), 'expected the publish section').to.exist
  })

  it('keeps the footer at the very bottom, below Publish', () => {
    const { container, getByTestId, getByRole } = renderSidebar(true)

    const footer = getByTestId('sidebar-footer')
    expect(footer.contains(getByRole('button', { name: /About MQTT Explorer/i })), 'About sits in the footer').to.equal(
      true
    )

    const publish = container.querySelector('[data-testid="publish-tab"]')
    expect(publish, 'expected the publish section').to.exist
    // Node.DOCUMENT_POSITION_FOLLOWING: the footer comes after publish in the document
    // eslint-disable-next-line no-bitwise
    expect(Boolean(publish!.compareDocumentPosition(footer) & 4), 'footer follows publish').to.equal(true)
  })
})
