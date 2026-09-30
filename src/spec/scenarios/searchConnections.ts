import { Page } from 'playwright'
import { clickOn, sleep, setInputText } from '../util'

export async function searchConnections(searchTerm: string, browser: Page) {
  // Find the search input at the bottom of the connections list
  const searchInput = await browser.locator('//input[@placeholder="Search"]')
  await setInputText(searchInput, searchTerm, browser)
  await sleep(500)
}

export async function clearSearch(browser: Page) {
  // Find the clear button (X icon) in the search input
  const clearButton = await browser.locator('//input[@placeholder="Search"]/following-sibling::div//button')
  
  try {
    await clickOn(clearButton)
    await sleep(300)
  } catch {
    // Clear button might not be visible if search is empty
    const searchInput = await browser.locator('//input[@placeholder="Search"]')
    await setInputText(searchInput, '', browser)
    await sleep(300)
  }
}

export async function verifyConnectionVisible(connectionName: string, browser: Page): Promise<boolean> {
  try {
    const connection = await browser.locator(`//span[contains(text(), "${connectionName}")]`)
    await connection.waitFor({ timeout: 2000, state: 'visible' })
    return true
  } catch {
    return false
  }
}

export async function verifyConnectionHidden(connectionName: string, browser: Page): Promise<boolean> {
  try {
    const connection = await browser.locator(`//span[contains(text(), "${connectionName}")]`)
    await connection.waitFor({ timeout: 1000, state: 'hidden' })
    return true
  } catch {
    // If element not found or still visible
    const isVisible = await verifyConnectionVisible(connectionName, browser)
    return !isVisible
  }
}

export async function verifySearchResults(
  searchTerm: string,
  expectedConnections: string[],
  hiddenConnections: string[],
  browser: Page
): Promise<boolean> {
  // Search for the term
  await searchConnections(searchTerm, browser)

  // Verify expected connections are visible
  for (const connectionName of expectedConnections) {
    const isVisible = await verifyConnectionVisible(connectionName, browser)
    if (!isVisible) {
      console.log(`Expected connection "${connectionName}" not visible`)
      return false
    }
  }

  // Verify other connections are hidden
  for (const connectionName of hiddenConnections) {
    const isHidden = await verifyConnectionHidden(connectionName, browser)
    if (!isHidden) {
      console.log(`Expected connection "${connectionName}" to be hidden`)
      return false
    }
  }

  return true
}
