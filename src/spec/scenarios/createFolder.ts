import { Page } from 'playwright'
import { clickOn, sleep, setInputText } from '../util'

export async function createFolder(folderName: string, browser: Page) {
  // Click the add button to open the menu
  const addButton = await browser.locator('#addProfileButton button')
  await clickOn(addButton)
  await sleep(500)

  // Click "New Folder" menu item
  const newFolderMenuItem = await browser.locator('//li[contains(., "New Folder")]')
  await clickOn(newFolderMenuItem)
  await sleep(800)

  // Wait for dialog to appear
  const folderNameInput = await browser.locator('//label[contains(text(), "Folder Name")]/..//input')
  await folderNameInput.waitFor({ timeout: 5000 })
  
  // Fill in the folder name
  await setInputText(folderNameInput, folderName, browser)
  await sleep(300)

  // Click Create button
  const createButton = await browser.locator('//button/span[contains(text(),"Create")]')
  await clickOn(createButton)
  await sleep(1000)
}

export async function verifyFolderExists(folderName: string, browser: Page): Promise<boolean> {
  try {
    // Look for ListSubheader containing the folder name
    const folderHeader = await browser.locator(`//li[contains(@class, "MuiListSubheader")]/div/div/span[text()="${folderName}"]`)
    await folderHeader.waitFor({ timeout: 5000 })
    return true
  } catch (e) {
    console.error('Folder not found:', folderName, e)
    return false
  }
}
