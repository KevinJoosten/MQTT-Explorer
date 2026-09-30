import * as React from 'react'
import Add from '@mui/icons-material/Add'
import { Fab, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { withStyles } from '@mui/styles'
import FolderIcon from '@mui/icons-material/Folder'
import StorageIcon from '@mui/icons-material/Storage'

const styles = (theme: Theme) => ({
  addButton: {
    height: theme.spacing(4),
    width: theme.spacing(4),
    minHeight: '0',
  },
  addIcon: {
    height: theme.spacing(2),
  },
})

interface AddButtonProps {
  classes: any
  onCreateConnection: () => void
  onCreateFolder?: () => void
}

const AddButtonComponent = (props: AddButtonProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleCreateConnection = () => {
    props.onCreateConnection()
    handleClose()
  }

  const handleCreateFolder = () => {
    if (props.onCreateFolder) {
      props.onCreateFolder()
    }
    handleClose()
  }

  return (
    <span id="addProfileButton" style={{ marginRight: '12px' }}>
      <Fab
        size="small"
        color="secondary"
        aria-label="Add"
        className={props.classes.addButton}
        onClick={handleClick}
      >
        <Add className={props.classes.addIcon} />
      </Fab>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleCreateConnection}>
          <ListItemIcon>
            <StorageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="New Connection" />
        </MenuItem>
        {props.onCreateFolder && (
          <MenuItem onClick={handleCreateFolder}>
            <ListItemIcon>
              <FolderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="New Folder" />
          </MenuItem>
        )}
      </Menu>
    </span>
  )
}

export const AddButton = withStyles(styles)(AddButtonComponent)
