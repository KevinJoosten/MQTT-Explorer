import { Page } from 'playwright'
import { clickOn, sleep, setInputText } from '../util'

export async function renameFolder(
  oldFolderName: string,
  newFolderName: string,
  browser: Page
) {
  // Find the folder header
  const folderHeader = await browser.locator(`//header[contains(., "${oldFolderName}")]`)
  
  // Click the menu button (three dots)
  const menuButton = await folderHeader.locator('//button[.//*[contains(@data-testid, "MoreVertIcon")]]')
  await clickOn(menuButton)
  await sleep(200)

  // Click "Rename" menu item
  const renameMenuItem = await browser.locator('//li[contains(., "Rename")]')
  await clickOn(renameMenuItem)
  await sleep(300)

  // Fill in the new folder name
  const folderNameInput = await browser.locator('//label[contains(text(), "New Folder Name")]/..//input')
  await setInputText(folderNameInput, newFolderName, browser)
  await sleep(200)

  // Click Rename button
  const renameButton = await browser.locator('//button/span[contains(text(),"Rename")]')
  await clickOn(renameButton)
  await sleep(500)
}

export async function deleteFolder(
  folderName: string,
  deleteConnections: boolean,
  browser: Page
) {
  // Find the folder header
  const folderHeader = await browser.locator(`//header[contains(., "${folderName}")]`)
  
  // Click the menu button (three dots)
  const menuButton = await folderHeader.locator('//button[.//*[contains(@data-testid, "MoreVertIcon")]]')
  await clickOn(menuButton)
  await sleep(200)

  // Click "Delete" menu item
  const deleteMenuItem = await browser.locator('//li[contains(., "Delete")]')
  await clickOn(deleteMenuItem)
  await sleep(300)

  // Select the appropriate radio option
  if (deleteConnections) {
    const deleteAllRadio = await browser.locator('//input[@value="delete"]')
    await clickOn(deleteAllRadio)
  } else {
    const unassignRadio = await browser.locator('//input[@value="unassign"]')
    await clickOn(unassignRadio)
  }
  await sleep(200)

  // Click Delete Folder button
  const deleteFolderButton = await browser.locator('//button/span[contains(text(),"Delete Folder")]')
  await clickOn(deleteFolderButton)
  await sleep(500)
}

export async function verifyFolderNotExists(folderName: string, browser: Page): Promise<boolean> {
  try {
    const folderHeader = await browser.locator(`//header[contains(., "${folderName}")]`)
    await folderHeader.waitFor({ timeout: 1000, state: 'hidden' })
    return true
  } catch {
    // Check if it's still visible
    try {
      const folderHeader = await browser.locator(`//header[contains(., "${folderName}")]`)
      await folderHeader.waitFor({ timeout: 500, state: 'visible' })
      return false // Still exists
    } catch {
      return true // Doesn't exist
    }
  }
}
