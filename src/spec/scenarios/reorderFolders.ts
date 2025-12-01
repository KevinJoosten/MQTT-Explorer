import { Page } from 'playwright'
import { clickOn, sleep } from '../util'

export async function reorderFolders(
  sourceFolderName: string,
  targetFolderName: string,
  browser: Page
) {
  // Find the source folder header
  const sourceFolder = await browser.locator(
    `//header[contains(., "${sourceFolderName}")]`
  )
  
  // Find the target folder header
  const targetFolder = await browser.locator(
    `//header[contains(., "${targetFolderName}")]`
  )

  // Get bounding boxes
  const sourceBox = await sourceFolder.boundingBox()
  const targetBox = await targetFolder.boundingBox()

  if (!sourceBox || !targetBox) {
    throw new Error('Could not find folder elements')
  }

  // Perform drag and drop to reorder
  await browser.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2
  )
  await browser.mouse.down()
  await sleep(200)

  await browser.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 10 }
  )
  await sleep(300)

  await browser.mouse.up()
  await sleep(500)
}

export async function verifyFolderOrder(
  expectedOrder: string[],
  browser: Page
): Promise<boolean> {
  try {
    // Get all folder headers
    const folders = await browser.locator('//header[contains(@class, "folderHeader")]').all()
    
    if (folders.length !== expectedOrder.length) {
      return false
    }

    for (let i = 0; i < expectedOrder.length; i++) {
      const folderText = await folders[i].textContent()
      if (!folderText || !folderText.includes(expectedOrder[i])) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

export async function collapseFolder(folderName: string, browser: Page) {
  const folderHeader = await browser.locator(`//header[contains(., "${folderName}")]`)
  
  // Look for the expand icon (ExpandMore means folder is open)
  const expandIcon = await folderHeader.locator('//*[contains(@data-testid, "ExpandMoreIcon") or name()="svg"]')
  
  try {
    await expandIcon.click({ timeout: 1000 })
    await sleep(300)
  } catch {
    // Folder might already be collapsed
  }
}

export async function expandFolder(folderName: string, browser: Page) {
  const folderHeader = await browser.locator(`//header[contains(., "${folderName}")]`)
  
  // Look for the chevron right icon (ChevronRight means folder is collapsed)
  const chevronIcon = await folderHeader.locator('//*[contains(@data-testid, "ChevronRightIcon") or name()="svg"]')
  
  try {
    await chevronIcon.click({ timeout: 1000 })
    await sleep(300)
  } catch {
    // Folder might already be expanded
  }
}
