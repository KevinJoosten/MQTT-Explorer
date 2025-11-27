import ConnectionItem from './ConnectionItem'
import React from 'react'
import { AddButton } from './AddButton'
import { AppState } from '../../../reducers'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectionManagerActions } from '../../../actions'
import { ConnectionOptions } from '../../../model/ConnectionOptions'
import { KeyCodes } from '../../../utils/KeyCodes'
import { List, ListSubheader, IconButton, Menu, MenuItem } from '@material-ui/core'
import { Theme, withStyles } from '@material-ui/core/styles'
import { useGlobalKeyEventHandler } from '../../../effects/useGlobalKeyEventHandler'
import { SortOption } from '../../../reducers/ConnectionManager'
import SortIcon from '@material-ui/icons/Sort'

interface Props {
  classes: any
  selected?: string
  connections: { [s: string]: ConnectionOptions }
  actions: typeof connectionManagerActions
  sortBy: SortOption
}

function ProfileList(props: Props) {
  const { actions, classes, connections, selected, sortBy } = props
  const [sortMenuAnchor, setSortMenuAnchor] = React.useState<null | HTMLElement>(null)

  const sortedConnections = React.useMemo(() => {
    const connectionArray = Object.values(connections)

    switch (sortBy) {
      case 'name':
        return connectionArray.sort((a, b) => a.name.localeCompare(b.name))
      case 'createdAt':
        return connectionArray.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      case 'folder':
        return connectionArray.sort((a, b) => {
          const folderA = a.folder || ''
          const folderB = b.folder || ''
          if (folderA !== folderB) {
            return folderA.localeCompare(folderB)
          }
          return a.name.localeCompare(b.name)
        })
      default:
        return connectionArray
    }
  }, [connections, sortBy])

  const groupedConnections = React.useMemo(() => {
    if (sortBy !== 'folder') {
      return { '': sortedConnections }
    }

    const groups: { [folder: string]: ConnectionOptions[] } = {}
    sortedConnections.forEach(connection => {
      const folder = connection.folder || 'Ungrouped'
      if (!groups[folder]) {
        groups[folder] = []
      }
      groups[folder].push(connection)
    })
    return groups
  }, [sortedConnections, sortBy])

  const selectConnection = (dir: 'next' | 'previous') => (event: KeyboardEvent) => {
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

  useGlobalKeyEventHandler(KeyCodes.arrow_down, selectConnection('next'))
  useGlobalKeyEventHandler(KeyCodes.arrow_up, selectConnection('previous'))

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget)
  }

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null)
  }

  const handleSortChange = (sortOption: SortOption) => {
    actions.setSortBy(sortOption)
    handleSortMenuClose()
  }

  const createConnectionButton = (
    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <AddButton action={actions.createConnection} />
        Connections
      </div>
      <IconButton size="small" onClick={handleSortMenuOpen} title="Sort connections">
        <SortIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={sortMenuAnchor} open={Boolean(sortMenuAnchor)} onClose={handleSortMenuClose}>
        <MenuItem onClick={() => handleSortChange('name')} selected={sortBy === 'name'}>
          Sort by Name
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('createdAt')} selected={sortBy === 'createdAt'}>
          Sort by Date Created
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('folder')} selected={sortBy === 'folder'}>
          Group by Folder
        </MenuItem>
      </Menu>
    </div>
  )

  return (
    <List style={{ height: '100%' }} component="nav" subheader={createConnectionButton}>
      <div className={classes.list}>
        {sortBy === 'folder'
          ? Object.entries(groupedConnections).map(([folder, connections]) => (
              <div key={folder}>
                <ListSubheader className={classes.folderHeader}>{folder}</ListSubheader>
                {connections.map(connection => (
                  <ConnectionItem connection={connection} key={connection.id} selected={selected === connection.id} />
                ))}
              </div>
            ))
          : sortedConnections.map(connection => (
              <ConnectionItem connection={connection} key={connection.id} selected={selected === connection.id} />
            ))}
      </div>
    </List>
  )
}

const styles = (theme: Theme) => ({
  list: {
    marginTop: theme.spacing(1),
    height: `calc(100% - ${theme.spacing(6)})`,
    overflowY: 'auto' as 'auto',
  },
  folderHeader: {
    backgroundColor: theme.palette.background.default,
    fontWeight: 'bold' as 'bold',
    fontSize: '0.9em',
    lineHeight: '32px',
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
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ProfileList))
