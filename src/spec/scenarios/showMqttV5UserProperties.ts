import { Page } from 'playwright'
import { clickOn, setInputText, sleep } from '../util'

/**
 * Demonstrates MQTT v5 User Properties:
 * 1. Disconnect and switch the connection to MQTT v5
 * 2. Reconnect
 * 3. Add custom key/value user properties in the Publish panel
 * 4. Publish a message with the attached properties
 */
export async function showMqttV5UserProperties(browser: Page) {
  // --- Disconnect ---
  const disconnectButton = browser.locator('[data-testid="disconnect-button"]')
  await clickOn(disconnectButton)
  await sleep(600)

  // --- Open Advanced Connection Settings ---
  const advancedButton = browser.locator('[data-testid="advanced-button"]')
  await clickOn(advancedButton)
  await sleep(500)

  // --- Set MQTT Version to v5 ---
  const versionCombobox = browser
    .locator('[data-testid="mqtt-version-wrapper"]')
    .locator('[role="combobox"]')
  await clickOn(versionCombobox)
  await sleep(300)

  const v5Option = browser.locator('[data-value="5"]')
  await clickOn(v5Option)
  await sleep(300)

  // --- Go back and reconnect ---
  const backButton = browser.locator('[data-testid="back-button"]').first()
  await clickOn(backButton)
  await sleep(300)

  const connectButton = browser.locator('[data-testid="connect-button"]')
  await clickOn(connectButton)
  await sleep(1500)

  // --- Add the first user property ---
  const addButton = browser.locator('[data-testid="user-property-add-button"]')
  await clickOn(addButton)
  await sleep(300)

  const keyInput0 = browser.locator('[data-testid="user-property-key-0"]')
  const valueInput0 = browser.locator('[data-testid="user-property-value-0"]')
  await setInputText(keyInput0, 'x-source', browser)
  await sleep(200)
  await setInputText(valueInput0, 'mqtt-explorer', browser)
  await sleep(300)

  // --- Add a second user property ---
  await clickOn(addButton)
  await sleep(300)

  const keyInput1 = browser.locator('[data-testid="user-property-key-1"]')
  const valueInput1 = browser.locator('[data-testid="user-property-value-1"]')
  await setInputText(keyInput1, 'env', browser)
  await sleep(200)
  await setInputText(valueInput1, 'production', browser)
  await sleep(500)

  // --- Publish the message ---
  const publishButton = browser.locator('#publish-button')
  await clickOn(publishButton)
  await sleep(1000)

  // --- Reset MQTT Version back to Auto for subsequent scenarios ---
  const disconnectButton2 = browser.locator('[data-testid="disconnect-button"]')
  await clickOn(disconnectButton2)
  await sleep(400)

  const advancedButton2 = browser.locator('[data-testid="advanced-button"]')
  await clickOn(advancedButton2)
  await sleep(400)

  const versionCombobox2 = browser
    .locator('[data-testid="mqtt-version-wrapper"]')
    .locator('[role="combobox"]')
  await clickOn(versionCombobox2)
  await sleep(300)

  const autoOption = browser.locator('[data-value="auto"]')
  await clickOn(autoOption)
  await sleep(300)

  const backButton2 = browser.locator('[data-testid="back-button"]').first()
  await clickOn(backButton2)
  await sleep(300)

  const connectButton2 = browser.locator('[data-testid="connect-button"]')
  await clickOn(connectButton2)
  await sleep(1200)
}
