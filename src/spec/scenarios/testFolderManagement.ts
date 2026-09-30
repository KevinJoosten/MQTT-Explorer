import { Page } from 'playwright'
import { clickOn, sleep, setTextInInput } from '../util'
import { createFolder, verifyFolderExists } from './createFolder'
import { dragConnectionToFolder, verifyConnectionInFolder } from './dragConnectionToFolder'
import { searchConnections, clearSearch, verifySearchResults } from './searchConnections'
import { renameFolder, deleteFolder, verifyFolderNotExists } from './manageFolders'
import { expandFolder, collapseFolder } from './reorderFolders'

/**
 * Demonstration of folder management features for the demo video
 */
export async function testFolderManagement(browser: Page) {
  // This is now the first scene, so we start with connection setup already visible
  // No need to disconnect
  
  // Wait for the add button to be visible
  const addButton = await browser.locator('#addProfileButton button')
  await addButton.waitFor({ state: 'visible', timeout: 10000 })
  await sleep(500)

  // Step 1: Create folders to demonstrate the feature
  await createFolder('Production', browser)
  await sleep(500)
  
  let folderExists = await verifyFolderExists('Production', browser)
  if (!folderExists) {
    throw new Error('Failed to create Production folder')
  }

  await createFolder('Development', browser)
  await sleep(500)
  
  folderExists = await verifyFolderExists('Development', browser)
  if (!folderExists) {
    throw new Error('Failed to create Development folder')
  }

  await createFolder('Testing', browser)
  await sleep(500)
  
  folderExists = await verifyFolderExists('Testing', browser)
  if (!folderExists) {
    throw new Error('Failed to create Testing folder')
  }

  // Step 2: Create some test connections to demonstrate the feature
  // Create first connection
  const addButton2 = await browser.locator('#addProfileButton button')
  await clickOn(addButton2)
  await sleep(200)

  const newConnectionMenuItem = await browser.locator('//li[contains(., "New Connection")]')
  await clickOn(newConnectionMenuItem)
  await sleep(300)

  await setTextInInput('Name', 'Production MQTT', browser)
  await setTextInInput('Host', 'prod.example.com', browser)
  await sleep(200)

  const saveButton = await browser.locator('//button/span[contains(text(),"Save")]')
  await clickOn(saveButton)
  await sleep(800)

  // Create second connection
  const addButton3 = await browser.locator('#addProfileButton button')
  await clickOn(addButton3)
  await sleep(200)

  const newConnectionMenuItem2 = await browser.locator('//li[contains(., "New Connection")]')
  await clickOn(newConnectionMenuItem2)
  await sleep(300)

  await setTextInInput('Name', 'Dev MQTT', browser)
  await setTextInInput('Host', 'dev.example.com', browser)
  await sleep(200)

  const saveButton2 = await browser.locator('//button/span[contains(text(),"Save")]')
  await clickOn(saveButton2)
  await sleep(800)

  // Step 3: Demonstrate search functionality
  await searchConnections('prod', browser)
  await sleep(1500)
  
  await clearSearch(browser)
  await sleep(500)

  console.log('Folder management demonstration completed successfully!')
}
