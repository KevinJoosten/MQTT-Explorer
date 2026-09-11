/**
 * AboutDialog tests
 *
 * These assert what a user can observe: the dialog renders the required
 * attribution, and the About button actually opens it. The one exception is the
 * LICENSE NOTICE source comment, which by nature exists only in the source and
 * is therefore the only thing here checked by reading the file.
 */

import 'jsdom-global/register' // must precede the reducers, they read `window` at module scope
import * as fs from 'fs'
import * as path from 'path'
import React from 'react'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider as StylesThemeProvider } from '@mui/styles'
import { createTheme } from '@mui/material/styles'
import { AboutDialog } from './AboutDialog'
import SidebarFooter from './Sidebar/SidebarFooter'
import rootReducer from '../reducers'
import { renderWithProviders, fireEvent } from '../utils/spec/testUtils'

function renderAboutDialog(open: boolean = true) {
  return renderWithProviders(<AboutDialog open={open} onClose={() => undefined} />)
}

describe('AboutDialog', () => {
  it('credits the author, as CC-BY-ND-4.0 attribution requires', () => {
    const { getByTestId } = renderAboutDialog()

    expect(getByTestId('about-author').textContent).to.contain('Thomas Nordquist')
  })

  it('displays the CC-BY-ND-4.0 license', () => {
    const { getByTestId } = renderAboutDialog()

    expect(getByTestId('about-license').textContent).to.contain('CC-BY-ND-4.0')
  })

  it('shows nothing until opened', () => {
    const { queryByTestId } = renderAboutDialog(false)

    expect(queryByTestId('about-author')).to.equal(null)
  })

  it('keeps the LICENSE NOTICE comment in the source', () => {
    // Not observable at runtime: a comment is the artifact being protected here.
    const source = fs.readFileSync(path.join(__dirname, 'AboutDialog.tsx'), 'utf-8')

    expect(source).to.contain('LICENSE NOTICE')
    expect(source).to.contain('CC-BY-ND-4.0')
  })
})

describe('About button', () => {
  it('opens the about dialog when clicked', () => {
    const store = configureStore({
      reducer: rootReducer,
      middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    })

    const { getByRole } = renderWithProviders(
      <StylesThemeProvider theme={createTheme()}>
        <SidebarFooter />
      </StylesThemeProvider>,
      { store: store as any, withRedux: true }
    )

    expect(store.getState().globalState.get('aboutDialogVisible')).to.equal(false)

    fireEvent.click(getByRole('button', { name: /About MQTT Explorer/i }))

    expect(store.getState().globalState.get('aboutDialogVisible')).to.equal(true)
  })
})
