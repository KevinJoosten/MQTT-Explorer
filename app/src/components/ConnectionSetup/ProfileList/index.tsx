import ConnectionItem from './ConnectionItem'
import FolderHeader from './FolderHeader'
import React from 'react'
import { AddButton } from './AddButton'
import { AppState } from '../../../reducers'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectionManagerActions } from '../../../actions'
import { ConnectionOptions, createEmptyConnection } from '../../../model/ConnectionOptions'
import { KeyCodes } from '../../../utils/KeyCodes'
import {
  List,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  DialogContentText,
} from '@material-ui/core'
import { Theme, withStyles } from '@material-ui/core/styles'
import { useGlobalKeyEventHandler } from '../../../effects/useGlobalKeyEventHandler'
import { SortOption } from '../../../reducers/ConnectionManager'
import SearchIcon from '@material-ui/icons/Search'
import ClearIcon from '@material-ui/icons/Clear'

const UNGROUPED_FOLDER_NAME = 'Ungrouped'

interface Props {
  classes: any
  selected?: string
  connections: { [s: string]: ConnectionOptions }
  actions: typeof connectionManagerActions
  sortBy: SortOption
  collapsedFolders: { [folderName: string]: boolean }
  folderOrder: string[]
  connectionOrder: { [folderName: string]: string[] }
}

function ProfileList(props: Props) {
  const { actions, classes, connections, selected, sortBy, collapsedFolders, folderOrder, connectionOrder } = props
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState('')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = React.useState(false)
  const [renameFolderOldName, setRenameFolderOldName] = React.useState('')
  const [renameFolderNewName, setRenameFolderNewName] = React.useState('')
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = React.useState(false)
  const [deleteFolderName, setDeleteFolderName] = React.useState('')
  const [deleteFolderAction, setDeleteFolderAction] = React.useState<'unassign' | 'delete'>('unassign')
  const [draggingFolder, setDraggingFolder] = React.useState<string | null>(null)
  const [draggingConnection, setDraggingConnection] = React.useState<{ id: string; folder: string } | null>(null)

  const sortedConnections = React.useMemo(() => {
    const connectionArray = Object.values(connections)

    // Filter by search term first
    const filteredArray = searchTerm.trim()
      ? connectionArray.filter(connection => {
          const searchLower = searchTerm.toLowerCase()
          return (
            connection.name.toLowerCase().includes(searchLower) ||
            (connection.folder && connection.folder.toLowerCase().includes(searchLower)) ||
            (connection.host && connection.host.toLowerCase().includes(searchLower))
          )
        })
      : connectionArray

    switch (sortBy) {
      case 'name':
        return filteredArray.sort((a, b) => a.name.localeCompare(b.name))
      case 'createdAt':
        return filteredArray.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      case 'folder':
        return filteredArray.sort((a, b) => {
          const folderA = a.folder || ''
          const folderB = b.folder || ''
          if (folderA !== folderB) {
            return folderA.localeCompare(folderB)
          }
          return a.name.localeCompare(b.name)
        })
      default:
        return filteredArray
    }
  }, [connections, sortBy, searchTerm])

  const groupedConnections = React.useMemo(() => {
    if (sortBy !== 'folder') {
      return { '': sortedConnections }
    }

    const groups: { [folder: string]: ConnectionOptions[] } = {}
    sortedConnections.forEach(connection => {
      const folder = connection.folder || UNGROUPED_FOLDER_NAME
      if (!groups[folder]) {
        groups[folder] = []
      }
      groups[folder].push(connection)
    })
    
    // Apply connection order within each folder
    Object.keys(groups).forEach(folderName => {
      const order = connectionOrder[folderName]
      if (order && order.length > 0) {
        const ordered = order.filter(id => groups[folderName].some(c => c.id === id)).map(id => groups[folderName].find(c => c.id === id)!)
        const remaining = groups[folderName].filter(c => !order.includes(c.id))
        groups[folderName] = [...ordered, ...remaining]
      }
    })
    
    return groups
  }, [sortedConnections, sortBy, connectionOrder])

  const orderedFolders = React.useMemo(() => {
    const folders = Object.keys(groupedConnections)
    if (sortBy !== 'folder') {
      return folders
    }
    
    // Apply custom order, then alphabetically sort remaining folders
    const ordered = folderOrder.filter(f => folders.includes(f))
    const remaining = folders.filter(f => !folderOrder.includes(f)).sort()
    return [...ordered, ...remaining]
  }, [groupedConnections, folderOrder, sortBy])

  const selectConnection = (dir: 'next' | 'previous') => (event: KeyboardEvent) => {
    // Don't handle if any dialog is open
    if (folderDialogOpen || renameFolderDialogOpen || deleteFolderDialogOpen) {
      return
    }
    if (!selected) {
      return
    }
    const indexDirection = dir === 'next' ? 1 : -1
    const selectedIndex = sortedConnections.map(connection => connection.id).indexOf(selected)
    const nextConnection = sortedConnections[selectedIndex + indexDirection]
    if (nextConnection) {
      actions.selectConnection(nextConnection.id)
    }
    event.preventDefault()
  }

  useGlobalKeyEventHandler(KeyCodes.arrow_down, selectConnection('next'), [folderDialogOpen, renameFolderDialogOpen, deleteFolderDialogOpen, selected, sortedConnections])
  useGlobalKeyEventHandler(KeyCodes.arrow_up, selectConnection('previous'), [folderDialogOpen, renameFolderDialogOpen, deleteFolderDialogOpen, selected, sortedConnections])

  const handleFolderToggle = React.useCallback(
    (folderName: string) => {
      actions.toggleFolderCollapse(folderName)
    },
    [actions]
  )

  const handleConnectionDropOnFolder = React.useCallback(
    (folderName: string, connectionId: string) => {
      // Don't update if dropping on the same folder
      const connection = connections[connectionId]
      const currentFolder = connection.folder || UNGROUPED_FOLDER_NAME
      if (currentFolder === folderName) {
        return
      }

      // Update the connection's folder
      const newFolder = folderName === UNGROUPED_FOLDER_NAME ? undefined : folderName
      actions.updateConnection(connectionId, { folder: newFolder })
      actions.saveConnectionSettings()
    },
    [connections, actions]
  )

  const handleCreateFolder = React.useCallback(() => {
    setFolderDialogOpen(true)
  }, [])

  const handleFolderDialogClose = () => {
    setFolderDialogOpen(false)
    setNewFolderName('')
  }

  const handleFolderDialogConfirm = () => {
    if (newFolderName.trim()) {
      // Create a new empty connection directly assigned to this folder
      const newConnection = createEmptyConnection()
      newConnection.folder = newFolderName.trim()
      actions.addConnection(newConnection)
      actions.selectConnection(newConnection.id)
      actions.saveConnectionSettings()
    }
    handleFolderDialogClose()
  }

  const handleRenameFolder = React.useCallback((folderName: string) => {
    setRenameFolderOldName(folderName)
    setRenameFolderNewName(folderName)
    setRenameFolderDialogOpen(true)
  }, [])

  const handleRenameFolderConfirm = () => {
    if (renameFolderNewName.trim() && renameFolderNewName !== renameFolderOldName) {
      actions.renameFolder(renameFolderOldName, renameFolderNewName.trim())
    }
    setRenameFolderDialogOpen(false)
    setRenameFolderOldName('')
    setRenameFolderNewName('')
  }

  const handleDeleteFolder = React.useCallback((folderName: string) => {
    setDeleteFolderName(folderName)
    setDeleteFolderAction('unassign')
    setDeleteFolderDialogOpen(true)
  }, [])

  const handleDeleteFolderConfirm = () => {
    actions.deleteFolder(deleteFolderName, deleteFolderAction === 'delete')
    setDeleteFolderDialogOpen(false)
    setDeleteFolderName('')
    setDeleteFolderAction('unassign')
  }

  const handleFolderDragStart = React.useCallback((folderName: string) => {
    setDraggingFolder(folderName)
  }, [])

  const handleFolderDragEnd = React.useCallback(() => {
    setDraggingFolder(null)
  }, [])

  const handleFolderDrop = React.useCallback((targetFolder: string) => {
    if (!draggingFolder || draggingFolder === targetFolder) {
      return
    }

    const currentOrder = orderedFolders
    const dragIndex = currentOrder.indexOf(draggingFolder)
    const dropIndex = currentOrder.indexOf(targetFolder)

    if (dragIndex === -1 || dropIndex === -1) {
      return
    }

    const newOrder = [...currentOrder]
    newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, draggingFolder)

    actions.setFolderOrder(newOrder)
    actions.saveConnectionSettings()
    setDraggingFolder(null)
  }, [draggingFolder, orderedFolders, actions])

  const handleConnectionDragStart = React.useCallback((connectionId: string, folderName: string) => {
    setDraggingConnection({ id: connectionId, folder: folderName })
  }, [])

  const handleConnectionDragEnd = React.useCallback(() => {
    setDraggingConnection(null)
  }, [])

  const handleConnectionReorder = React.useCallback((targetConnectionId: string, targetFolder: string) => {
    if (!draggingConnection || draggingConnection.id === targetConnectionId) {
      return
    }

    // Only allow reordering within the same folder
    if (draggingConnection.folder !== targetFolder) {
      return
    }

    const folderConnections = groupedConnections[targetFolder]
    const currentOrder = connectionOrder[targetFolder] || folderConnections.map(c => c.id)
    
    const dragIndex = currentOrder.indexOf(draggingConnection.id)
    const dropIndex = currentOrder.indexOf(targetConnectionId)

    if (dragIndex === -1 || dropIndex === -1) {
      return
    }

    const newOrder = [...currentOrder]
    newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, draggingConnection.id)

    actions.setConnectionOrder(targetFolder, newOrder)
    actions.saveConnectionSettings()
    setDraggingConnection(null)
  }, [draggingConnection, groupedConnections, connectionOrder, actions])

  const createConnectionButton = (
    <div style={{ padding: '8px 16px' }}>
      <AddButton onCreateConnection={actions.createConnection} onCreateFolder={handleCreateFolder} />
      Connections
    </div>
  )

  return (
    <>
      <div className={classes.container}>
        <List style={{ flex: 1, overflowY: 'auto' }} component="nav" subheader={createConnectionButton}>
          <div className={classes.list}>
            {sortBy === 'folder'
              ? orderedFolders.map((folder) => {
                  const connections = groupedConnections[folder]
                  const isCollapsed = collapsedFolders[folder] || false
                  return (
                    <div key={folder}>
                      <FolderHeader
                        folderName={folder}
                        isCollapsed={isCollapsed}
                        onToggle={handleFolderToggle}
                        onDrop={handleConnectionDropOnFolder}
                        onRename={handleRenameFolder}
                        onDelete={handleDeleteFolder}
                        onFolderDragStart={handleFolderDragStart}
                        onFolderDragEnd={handleFolderDragEnd}
                        onFolderDrop={handleFolderDrop}
                      />
                      <Collapse in={!isCollapsed}>
                        {connections.map(connection => (
                          <ConnectionItem
                            connection={connection}
                            key={connection.id}
                            selected={selected === connection.id}
                            onConnectionDragStart={() => handleConnectionDragStart(connection.id, folder)}
                            onConnectionDragEnd={handleConnectionDragEnd}
                            onConnectionDrop={() => handleConnectionReorder(connection.id, folder)}
                          />
                        ))}
                      </Collapse>
                    </div>
                  )
                })
              : sortedConnections.map(connection => (
                  <ConnectionItem 
                    connection={connection} 
                    key={connection.id} 
                    selected={selected === connection.id}
                    onConnectionDragStart={() => handleConnectionDragStart(connection.id, 'Ungrouped')}
                    onConnectionDragEnd={handleConnectionDragEnd}
                    onConnectionDrop={() => handleConnectionReorder(connection.id, 'Ungrouped')}
                  />
                ))}
          </div>
        </List>
        <div className={classes.searchContainer}>
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>
      </div>
      <Dialog open={folderDialogOpen} onClose={handleFolderDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                handleFolderDialogConfirm()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFolderDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleFolderDialogConfirm} color="primary" variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={renameFolderDialogOpen} onClose={() => setRenameFolderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Folder Name"
            type="text"
            fullWidth
            value={renameFolderNewName}
            onChange={(e) => setRenameFolderNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                handleRenameFolderConfirm()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameFolderDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRenameFolderConfirm} color="primary" variant="contained">
            Rename
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteFolderDialogOpen} onClose={() => setDeleteFolderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <DialogContentText>
            What should happen to the connections in "{deleteFolderName}"?
          </DialogContentText>
          <RadioGroup
            value={deleteFolderAction}
            onChange={(e) => setDeleteFolderAction(e.target.value as 'unassign' | 'delete')}
          >
            <FormControlLabel
              value="unassign"
              control={<Radio color="primary" />}
              label="Move connections to Ungrouped"
            />
            <FormControlLabel
              value="delete"
              control={<Radio color="primary" />}
              label="Delete all connections in this folder"
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFolderDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteFolderConfirm} color="secondary" variant="contained">
            Delete Folder
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const styles = (theme: Theme) => ({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  list: {
    marginTop: theme.spacing(1),
  },
  searchContainer: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
})

const mapDispatchToProps = (dispatch: any) => {
  return {
    actions: bindActionCreators(connectionManagerActions, dispatch),
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    connections: state.connectionManager.connections,
    selected: state.connectionManager.selected,
    sortBy: state.connectionManager.sortBy,
    collapsedFolders: state.connectionManager.collapsedFolders,
    folderOrder: state.connectionManager.folderOrder,
    connectionOrder: state.connectionManager.connectionOrder,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ProfileList))
