import React, { useCallback } from 'react'
import { Box, IconButton, TextField, Typography, Button } from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Theme } from '@mui/material/styles'
import { withStyles } from '@mui/styles'

interface Props {
  userProperties: Array<{ key: string; value: string }>
  onChange: (userProperties: Array<{ key: string; value: string }>) => void
  classes: any
}

function UserProperties(props: Props) {
  const { classes, userProperties, onChange } = props

  const handleAdd = useCallback(() => {
    onChange([...userProperties, { key: '', value: '' }])
  }, [userProperties, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      const newProps = userProperties.filter((_, i) => i !== index)
      onChange(newProps)
    },
    [userProperties, onChange]
  )

  const handleKeyChange = useCallback(
    (index: number, key: string) => {
      const newProps = [...userProperties]
      newProps[index] = { ...newProps[index], key }
      onChange(newProps)
    },
    [userProperties, onChange]
  )

  const handleValueChange = useCallback(
    (index: number, value: string) => {
      const newProps = [...userProperties]
      newProps[index] = { ...newProps[index], value }
      onChange(newProps)
    },
    [userProperties, onChange]
  )

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Typography variant="caption" color="textSecondary">
          MQTT v5 User Properties
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          className={classes.addButton}
          data-testid="user-property-add-button"
        >
          Add Property
        </Button>
      </Box>

      {userProperties.map((prop, index) => (
        <Box key={index} className={classes.propertyRow}>
          <TextField
            size="small"
            placeholder="Key"
            value={prop.key}
            onChange={(e) => handleKeyChange(index, e.target.value)}
            className={classes.keyField}
            variant="outlined"
            inputProps={{ 'data-testid': `user-property-key-${index}` }}
          />
          <TextField
            size="small"
            placeholder="Value"
            value={prop.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            className={classes.valueField}
            variant="outlined"
            inputProps={{ 'data-testid': `user-property-value-${index}` }}
          />
          <IconButton
            size="small"
            onClick={() => handleRemove(index)}
            className={classes.deleteButton}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Box>
  )
}

const styles = (theme: Theme) => ({
  root: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  addButton: {
    textTransform: 'none' as 'none',
    fontSize: '0.75rem',
  },
  propertyRow: {
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    alignItems: 'center',
  },
  keyField: {
    flex: '0 0 35%',
  },
  valueField: {
    flex: 1,
  },
  deleteButton: {
    flex: '0 0 auto',
  },
})

export default withStyles(styles)(UserProperties)
