import { AppState } from '../reducers'
import { clearLegacyConnectionOptions, loadLegacyConnectionOptions } from '../model/LegacyConnectionSettings'
import {
  ConnectionOptions,
  createEmptyConnection,
  makeDefaultConnections,
  CertificateParameters,
} from '../model/ConnectionOptions'
import { default as persistentStorage, StorageIdentifier } from '../utils/PersistentStorage'
import { Dispatch } from 'redux'
import { showError } from './Global'
import * as path from 'path'
import { ActionTypes, Action, SortOption } from '../reducers/ConnectionManager'
import { Subscription } from '../../../backend/src/DataSource/MqttSource'
import { connectionsMigrator } from './migrations/Connection'
import { rendererRpc, readFromFile } from '../eventBus'
import { makeOpenDialogRpc } from '../../../events/OpenDialogRequest'
import { v4 } from 'uuid'

export interface ConnectionDictionary {
  [s: string]: ConnectionOptions
}
const storedConnectionsIdentifier: StorageIdentifier<ConnectionDictionary> = {
  id: 'ConnectionManager_connections',
}

const lastSelectedConnectionIdentifier: StorageIdentifier<string> = {
  id: 'ConnectionManager_lastSelected',
}

export const loadConnectionSettings = () => async (dispatch: Dispatch<any>, getState: () => AppState) => {
  let connections
  try {
    await ensureConnectionsHaveBeenInitialized()
    connections = await persistentStorage.load(storedConnectionsIdentifier)

    // Apply migrations
    if (connections && connectionsMigrator.isMigrationNecessary(connections)) {
      connections = connectionsMigrator.applyMigrations(connections)
      await persistentStorage.store(storedConnectionsIdentifier, connections)
    }
  } catch (error) {
    dispatch(showError(error))
  }

  if (!connections) {
    return
  }

  dispatch(setConnections(connections))
  const connectionIds = Object.keys(connections)
  if (connectionIds.length === 0) {
    // No connections exist - create a default one
    dispatch(createConnection())
    return
  }

  // Restore the last selected connection, falling back to the first
  let idToSelect = connectionIds[0]
  try {
    const lastSelected = await persistentStorage.load(lastSelectedConnectionIdentifier)
    if (lastSelected && connections[lastSelected]) {
      idToSelect = lastSelected
    }
  } catch {
    // ignore – fall back to first connection
  }
  dispatch(selectConnection(idToSelect))
}

export type CertificateTypes = 'selfSignedCertificate' | 'clientCertificate' | 'clientKey'
export const selectCertificate =
  (type: CertificateTypes, connectionId: string) => async (dispatch: Dispatch<any>, getState: () => AppState) => {
    try {
      const certificate = await openCertificate()
      dispatch(
        updateConnection(connectionId, {
          [type]: certificate,
        })
      )
    } catch (error) {
      dispatch(showError(error))
    }
  }

async function openCertificate(): Promise<CertificateParameters> {
  const rejectReasons = {
    noCertificateSelected: 'No certificate selected',
    certificateSizeDoesNotMatch: 'Certificate size larger/smaller then expected.',
  }

  const openDialogReturnValue = await rendererRpc.call(makeOpenDialogRpc(), {
    properties: ['openFile'],
    securityScopedBookmarks: true,
  })

  const selectedFile = openDialogReturnValue.filePaths && openDialogReturnValue.filePaths[0]
  if (!selectedFile) {
    throw rejectReasons.noCertificateSelected
  }

  const data = await rendererRpc.call(readFromFile, { filePath: selectedFile })
  // Electron IPC deserializes Buffers as Uint8Array in the renderer process.
  // Buffer.from() normalises either type before calling .toString('base64').
  // Without this, Uint8Array.toString('base64') ignores the argument and returns
  // comma-separated decimal bytes, producing garbage that causes NO_START_LINE.
  const buf = Buffer.from(data as any)
  if (buf.length > 16_384 || buf.length < 64) {
    throw rejectReasons.certificateSizeDoesNotMatch
  }

  return {
    data: buf.toString('base64'),
    name: path.basename(selectedFile),
  }
}

export const saveConnectionSettings = () => async (dispatch: Dispatch<any>, getState: () => AppState) => {
  try {
    console.log('store settings')
    await persistentStorage.store(storedConnectionsIdentifier, getState().connectionManager.connections)
  } catch (error) {
    dispatch(showError(error))
  }
}

export const saveConnectionAsCopy = () => async (dispatch: Dispatch<any>, getState: () => AppState) => {
  const state = getState()
  const selectedId = state.connectionManager.selected
  
  if (!selectedId) {
    return
  }
  
  const currentConnection = state.connectionManager.connections[selectedId]
  
  if (!currentConnection) {
    return
  }

  const newConnection: ConnectionOptions = {
    ...currentConnection,
    id: v4(),
    name: `${currentConnection.name} (Copy)`,
    createdAt: Date.now(),
  }

  dispatch(addConnection(newConnection))
  dispatch(selectConnection(newConnection.id))
  dispatch(saveConnectionSettings())
}

export const updateConnection = (connectionId: string, changeSet: Partial<ConnectionOptions>): Action => ({
  connectionId,
  changeSet,
  type: ActionTypes.CONNECTION_MANAGER_UPDATE_CONNECTION,
})

export const addSubscription = (subscription: Subscription, connectionId: string): Action => ({
  connectionId,
  subscription,
  type: ActionTypes.CONNECTION_MANAGER_ADD_SUBSCRIPTION,
})

export const deleteSubscription = (subscription: Subscription, connectionId: string): Action => ({
  connectionId,
  subscription,
  type: ActionTypes.CONNECTION_MANAGER_DELETE_SUBSCRIPTION,
})

export const createConnection = () => (dispatch: Dispatch<any>) => {
  const newConnection = createEmptyConnection()
  dispatch(addConnection(newConnection))
  dispatch(selectConnection(newConnection.id))
}

export const setConnections = (connections: { [s: string]: ConnectionOptions }): Action => ({
  connections,
  type: ActionTypes.CONNECTION_MANAGER_SET_CONNECTIONS,
})

const selectConnectionAction = (connectionId: string): Action => ({
  selected: connectionId,
  type: ActionTypes.CONNECTION_MANAGER_SELECT_CONNECTION,
})

export const selectConnection = (connectionId: string) => (dispatch: Dispatch<any>) => {
  persistentStorage.store(lastSelectedConnectionIdentifier, connectionId).catch(() => {/* ignore */})
  dispatch(selectConnectionAction(connectionId))
}

export const addConnection = (connection: ConnectionOptions): Action => ({
  connection,
  type: ActionTypes.CONNECTION_MANAGER_ADD_CONNECTION,
})

export const toggleAdvancedSettings = (): Action => ({
  type: ActionTypes.CONNECTION_MANAGER_TOGGLE_ADVANCED_SETTINGS,
})

export const toggleCertificateSettings = (): Action => ({
  type: ActionTypes.CONNECTION_MANAGER_TOGGLE_CERTIFICATE_SETTINGS,
})

export const setSortBy = (sortBy: SortOption): Action => ({
  type: ActionTypes.CONNECTION_MANAGER_SET_SORT_BY,
  sortBy,
})

export const toggleFolderCollapse = (folderName: string): Action => ({
  type: ActionTypes.CONNECTION_MANAGER_TOGGLE_FOLDER_COLLAPSE,
  folderName,
})

export const setFolderOrder = (folderOrder: string[]): Action => ({
  type: ActionTypes.CONNECTION_MANAGER_SET_FOLDER_ORDER,
  folderOrder,
})

export const setConnectionOrder = (folderName: string, connectionOrder: string[]): Action => ({
  type: ActionTypes.CONNECTION_MANAGER_SET_CONNECTION_ORDER,
  folderName,
  connectionOrder,
})

export const renameFolder = (oldName: string, newName: string) => (dispatch: Dispatch<any>, getState: () => AppState) => {
  const connections = getState().connectionManager.connections
  const updates: { [id: string]: Partial<ConnectionOptions> } = {}
  
  Object.entries(connections).forEach(([id, connection]) => {
    if (connection.folder === oldName) {
      updates[id] = { folder: newName }
    }
  })
  
  Object.entries(updates).forEach(([id, update]) => {
    dispatch(updateConnection(id, update))
  })
  
  dispatch(saveConnectionSettings())
}

export const deleteFolder = (folderName: string, deleteConnections: boolean) => (dispatch: Dispatch<any>, getState: () => AppState) => {
  const connections = getState().connectionManager.connections
  
  Object.entries(connections).forEach(([id, connection]) => {
    if (connection.folder === folderName) {
      if (deleteConnections) {
        dispatch(deleteConnection(id))
      } else {
        dispatch(updateConnection(id, { folder: undefined }))
      }
    }
  })
  
  if (!deleteConnections) {
    dispatch(saveConnectionSettings())
  }
}

export const deleteConnection = (connectionId: string) => (dispatch: Dispatch<any>, getState: () => AppState) => {
  const connectionIds = Object.keys(getState().connectionManager.connections)
  const connectionIdLocation = connectionIds.indexOf(connectionId)

  const remainingIds = connectionIds.filter(id => id !== connectionId)
  const nextSelectedConnectionIndex = Math.min(remainingIds.length - 1, connectionIdLocation)
  const nextSelectedConnection = remainingIds[nextSelectedConnectionIndex]

  dispatch({
    connectionId,
    type: ActionTypes.CONNECTION_MANAGER_DELETE_CONNECTION,
  })

  if (nextSelectedConnection) {
    dispatch(selectConnection(nextSelectedConnection))
  }
}

async function ensureConnectionsHaveBeenInitialized() {
  let connections = await persistentStorage.load(storedConnectionsIdentifier)
  const requiresInitialization = !connections
  if (requiresInitialization) {
    const migratedConnection = loadLegacyConnectionOptions()
    const defaultConnections = makeDefaultConnections()
    connections = {
      ...migratedConnection,
      ...defaultConnections,
    }
    await persistentStorage.store(storedConnectionsIdentifier, connections)

    clearLegacyConnectionOptions()
  }
}
