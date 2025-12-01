import { Page, Locator } from 'playwright'
import { clickOn, sleep } from '../util'

export async function dragConnectionToFolder(
  connectionName: string,
  folderName: string,
  browser: Page
) {
  // Wait for connection to appear in the list
  const connectionItem = await browser.locator(
    `//div[@role="button"][.//span[contains(text(), "${connectionName}")]]`
  )
  await connectionItem.waitFor({ timeout: 5000 })
  
  // Find the folder header (ListSubheader element)
  const folderHeader = await browser.locator(
    `//li[contains(@class, "MuiListSubheader")]/div/div/span[text()="${folderName}"]`
  )
  await folderHeader.waitFor({ timeout: 5000 })

  // Get bounding boxes
  const connectionBox = await connectionItem.boundingBox()
  const folderBox = await folderHeader.boundingBox()

  if (!connectionBox || !folderBox) {
    throw new Error('Could not find connection or folder elements')
  }

  // Perform drag and drop
  await browser.mouse.move(
    connectionBox.x + connectionBox.width / 2,
    connectionBox.y + connectionBox.height / 2
  )
  await browser.mouse.down()
  await sleep(200)

  await browser.mouse.move(
    folderBox.x + folderBox.width / 2,
    folderBox.y + folderBox.height / 2,
    { steps: 10 }
  )
  await sleep(300)

  await browser.mouse.up()
  await sleep(500)
}

export async function verifyConnectionInFolder(
  connectionName: string,
  folderName: string,
  browser: Page
): Promise<boolean> {
  try {
    // Expand the folder if collapsed - use ListSubheader
    const folderHeader = await browser.locator(
      `//li[contains(@class, "MuiListSubheader")]/div/div/span[text()="${folderName}"]`
    )
    await folderHeader.waitFor({ timeout: 3000 })
    
    const chevronRight = await folderHeader.locator('/ancestor::li//*[contains(@data-testid, "ChevronRightIcon") or name()="svg"]')
    
    try {
      await chevronRight.click({ timeout: 1000 })
      await sleep(300)
    } catch {
      // Folder might already be expanded
    }

    // Look for the connection under the folder
    const connectionInFolder = await browser.locator(
      `//li[contains(@class, "MuiListSubheader")]//span[text()="${folderName}"]/ancestor::li/following-sibling::li//span[contains(text(), "${connectionName}")]`
    )
    await connectionInFolder.waitFor({ timeout: 3000 })
    return true
  } catch (e) {
    console.error('Connection not found in folder:', e)
    return false
  }
}
