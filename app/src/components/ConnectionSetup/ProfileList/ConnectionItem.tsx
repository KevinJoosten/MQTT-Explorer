import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { ListItem, Typography } from '@mui/material'
import { toMqttConnection, ConnectionOptions } from '../../../model/ConnectionOptions'
import { withStyles } from '@mui/styles'
import { Theme } from '@mui/material/styles'
import { bindActionCreators } from 'redux'
import { connectionActions, connectionManagerActions } from '../../../actions'
import LockIcon from '@material-ui/icons/Lock'

export interface Props {
  connection: ConnectionOptions
  actions: {
    connection: any
    connectionManager: any
  }
  selected: boolean
  classes: any
  onConnectionDragStart?: () => void
  onConnectionDragEnd?: () => void
  onConnectionDrop?: () => void
}

const ConnectionItem = (props: Props) => {
  const connect = useCallback(() => {
    const mqttOptions = toMqttConnection(props.connection)
    if (mqttOptions) {
      props.actions.connection.connect(mqttOptions, props.connection.id)
    }
  }, [props.connection, props])

  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData('connectionId', props.connection.id)
    event.dataTransfer.effectAllowed = 'move'
    props.onConnectionDragStart?.()
  }, [props.connection.id, props.onConnectionDragStart])

  const handleDragEnd = useCallback(() => {
    props.onConnectionDragEnd?.()
  }, [props.onConnectionDragEnd])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    props.onConnectionDrop?.()
  }, [props.onConnectionDrop])

  const connection = props.connection.host && toMqttConnection(props.connection)
  return (
    <ListItem
      button={true}
      selected={props.selected}
      style={{ display: 'block' }}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => props.actions.connectionManager.selectConnection(props.connection.id)}
      onDoubleClick={() => {
        props.actions.connectionManager.selectConnection(props.connection.id)
        connect()
      }}
    >
      <Typography className={props.classes.name}>
        {props.connection.selfSignedCertificate && (
          <LockIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4, fontSize: '1em' }} />
        )}
        {props.connection.name || 'mqtt broker'}
      </Typography>
      <Typography className={props.classes.details}>{connection && connection.url}</Typography>
    </ListItem>
  )
}

export const mapDispatchToProps = (dispatch: any) => {
  return {
    actions: {
      connection: bindActionCreators(connectionActions, dispatch),
      connectionManager: bindActionCreators(connectionManagerActions, dispatch),
    },
  }
}
export const connectionItemStyle = (theme: Theme) => ({
  name: {
    width: '100%',
    textOverflow: 'ellipsis' as 'ellipsis',
    whiteSpace: 'nowrap' as 'nowrap',
    overflow: 'hidden' as 'hidden',
  },
  details: {
    width: '100%',
    textOverflow: 'ellipsis' as 'ellipsis',
    whiteSpace: 'nowrap' as 'nowrap',
    overflow: 'hidden' as 'hidden',
    color: theme.palette.text.secondary,
    fontSize: '0.7em',
  },
})

export default connect(null, mapDispatchToProps)(withStyles(connectionItemStyle)(ConnectionItem) as any)
