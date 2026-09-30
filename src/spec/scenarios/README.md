# Folder Management Tests

This directory contains UI tests for the folder management features added to MQTT Explorer.

## Test Scenarios

### createFolder.ts

Tests the creation of new folders for organizing connections.

- **createFolder(folderName, browser)** - Creates a new folder via the UI
- **verifyFolderExists(folderName, browser)** - Verifies a folder was created successfully

### dragConnectionToFolder.ts

Tests drag-and-drop functionality for moving connections between folders.

- **dragConnectionToFolder(connectionName, folderName, browser)** - Drags a connection to a folder
- **verifyConnectionInFolder(connectionName, folderName, browser)** - Verifies a connection is in a specific folder

### reorderFolders.ts

Tests folder reordering and collapse/expand functionality.

- **reorderFolders(sourceFolderName, targetFolderName, browser)** - Reorders folders via drag-drop
- **verifyFolderOrder(expectedOrder, browser)** - Verifies the current folder order
- **collapseFolder(folderName, browser)** - Collapses a folder
- **expandFolder(folderName, browser)** - Expands a folder

### searchConnections.ts

Tests the connection search functionality.

- **searchConnections(searchTerm, browser)** - Searches for connections
- **clearSearch(browser)** - Clears the search input
- **verifyConnectionVisible(connectionName, browser)** - Verifies a connection is visible
- **verifyConnectionHidden(connectionName, browser)** - Verifies a connection is hidden
- **verifySearchResults(searchTerm, expectedConnections, hiddenConnections, browser)** - Comprehensive search verification

### manageFolders.ts

Tests folder rename and delete operations.

- **renameFolder(oldFolderName, newFolderName, browser)** - Renames a folder
- **deleteFolder(folderName, deleteConnections, browser)** - Deletes a folder with option to delete or move connections
- **verifyFolderNotExists(folderName, browser)** - Verifies a folder was deleted

### testFolderManagement.ts

Comprehensive integration test that combines all folder management features:

1. Creates a new connection
2. Creates a folder
3. Drags connection to folder
4. Tests search functionality
5. Renames folder
6. Tests collapse/expand
7. Deletes folder and verifies connections moved to Ungrouped

## Running Tests

The folder management tests are integrated into the main UI test suite in `demoVideo.ts`.

To run the tests:

```bash
# From the root directory
yarn ui-test
```

Or via npm scripts:

```bash
npm run ui-test
```

## Test Architecture

All tests use Playwright for browser automation and follow the existing test patterns:

- Tests interact with Material-UI components via XPath locators
- Tests use the utility functions from `src/spec/util/index.ts`
- Tests include appropriate delays for UI animations and state updates
- Tests verify both success and failure conditions

## Folder Management Features Tested

✅ Creating folders via the Add button menu
✅ Dragging connections into folders  
✅ Reordering folders via drag-drop
✅ Reordering connections within folders
✅ Searching across all connections (even in collapsed folders)
✅ Renaming folders via context menu
✅ Deleting folders with options to:

- Move connections to Ungrouped
- Delete all connections in folder
  ✅ Collapsing/expanding folders
  ✅ Lock icon display for connections with certificates

## Known Limitations

- Tests rely on Material-UI's data-testid attributes which may change between versions
- Drag-and-drop tests require precise timing and may be sensitive to system performance
- Tests assume default theme and window size
