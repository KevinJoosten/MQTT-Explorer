import React from 'react'
import { ListSubheader, IconButton, Theme, Menu, MenuItem } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from '@material-ui/icons/Delete'

interface Props {
  folderName: string
  isCollapsed: boolean
  onToggle: (folderName: string) => void
  onDrop?: (folderName: string, connectionId: string) => void
  onRename?: (folderName: string) => void
  onDelete?: (folderName: string) => void
  onFolderDragStart?: (folderName: string) => void
  onFolderDragEnd?: () => void
  onFolderDrop?: (targetFolder: string) => void
  classes: any
}

interface State {
  isDragOver: boolean
  menuAnchor: null | HTMLElement
  isFolderDragOver: boolean
}

class FolderHeader extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isDragOver: false,
      menuAnchor: null,
      isFolderDragOver: false,
    }
  }

  private handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation()
    this.props.onToggle(this.props.folderName)
  }

  private handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    this.setState({ menuAnchor: event.currentTarget })
  }

  private handleMenuClose = () => {
    this.setState({ menuAnchor: null })
  }

  private handleRename = () => {
    this.handleMenuClose()
    if (this.props.onRename) {
      this.props.onRename(this.props.folderName)
    }
  }

  private handleDelete = () => {
    this.handleMenuClose()
    if (this.props.onDelete) {
      this.props.onDelete(this.props.folderName)
    }
  }

  private handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const dragType = event.dataTransfer.types[0]
    if (dragType === 'connectionid') {
      if (!this.state.isDragOver) {
        this.setState({ isDragOver: true })
      }
    } else if (dragType === 'folderid') {
      if (!this.state.isFolderDragOver) {
        this.setState({ isFolderDragOver: true })
      }
    }
  }

  private handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    this.setState({ isDragOver: false, isFolderDragOver: false })
  }

  private handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    this.setState({ isDragOver: false, isFolderDragOver: false })

    const connectionId = event.dataTransfer.getData('connectionId')
    if (connectionId && this.props.onDrop) {
      this.props.onDrop(this.props.folderName, connectionId)
      return
    }

    const folderId = event.dataTransfer.getData('folderId')
    if (folderId && this.props.onFolderDrop) {
      this.props.onFolderDrop(this.props.folderName)
    }
  }

  private handleFolderDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('folderId', this.props.folderName)
    event.dataTransfer.effectAllowed = 'move'
    if (this.props.onFolderDragStart) {
      this.props.onFolderDragStart(this.props.folderName)
    }
  }

  private handleFolderDragEnd = () => {
    if (this.props.onFolderDragEnd) {
      this.props.onFolderDragEnd()
    }
  }

  render() {
    const { folderName, isCollapsed, classes } = this.props
    const { isDragOver, isFolderDragOver, menuAnchor } = this.state
    const isUngrouped = folderName === 'Ungrouped'

    return (
      <ListSubheader
        className={`${classes.folderHeader} ${isDragOver || isFolderDragOver ? classes.dragOver : ''}`}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
        disableGutters
        draggable={true}
        onDragStart={this.handleFolderDragStart}
        onDragEnd={this.handleFolderDragEnd}
      >
        <div className={classes.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconButton size="small" onClick={this.handleToggle} className={classes.expandIcon}>
              {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <span>{folderName}</span>
          </div>
          {!isUngrouped && (
            <>
              <IconButton 
                size="small" 
                onClick={this.handleMenuOpen} 
                className={classes.menuButton}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={this.handleMenuClose}
              >
                <MenuItem onClick={this.handleRename}>
                  <EditIcon fontSize="small" style={{ marginRight: 8 }} />
                  Rename
                </MenuItem>
                <MenuItem onClick={this.handleDelete}>
                  <DeleteIcon fontSize="small" style={{ marginRight: 8 }} />
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </ListSubheader>
    )
  }
}

const styles = (theme: Theme) => ({
  folderHeader: {
    backgroundColor: theme.palette.background.paper,
    fontWeight: 'bold' as 'bold',
    fontSize: '0.9em',
    lineHeight: '32px',
    cursor: 'pointer',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    zIndex: 1,
    position: 'sticky' as 'sticky',
    top: 0,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    justifyContent: 'space-between',
    width: '100%',
  },
  expandIcon: {
    padding: theme.spacing(0.5),
  },
  menuButton: {
    padding: theme.spacing(0.5),
    marginLeft: 'auto',
  },
  dragOver: {
    backgroundColor: theme.palette.action.selected,
    borderLeft: `3px solid ${theme.palette.primary.main}`,
  },
})

export default withStyles(styles)(FolderHeader)
