import ConnectButton from './ConnectButton'
import React, { useCallback, useState } from 'react'
import Save from '@mui/icons-material/Save'
import FileCopy from '@mui/icons-material/FileCopy'
import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import Delete from '@mui/icons-material/Delete'
import Settings from '@mui/icons-material/Settings'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { AppState } from '../../reducers'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectionActions, connectionManagerActions } from '../../actions'
import { ConnectionOptions, toMqttConnection } from '../../model/ConnectionOptions'
import { KeyCodes } from '../../utils/KeyCodes'
import { Theme } from '@mui/material/styles'
import { withStyles } from '@mui/styles'
import { ToggleSwitch } from './ToggleSwitch'
import { useGlobalKeyEventHandler } from '../../effects/useGlobalKeyEventHandler'
import {
  Button,
  ButtonGroup,
  FormControl,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material'

interface Props {
  connection: ConnectionOptions
  classes: { [s: string]: string }
  actions: typeof connectionActions
  managerActions: typeof connectionManagerActions
  connected: boolean
  connecting: boolean
}

const protocols = ['mqtt', 'ws']

function ConnectionSettings(props: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<null | HTMLElement>(null)

  const toggleConnect = useCallback(() => {
    if (props.connecting) {
      props.actions.disconnect()
      return
    }

    if (!props.connection) {
      return
    }

    const mqttOptions = toMqttConnection(props.connection)
    if (mqttOptions && props.connection.host) {
      props.actions.connect(mqttOptions, props.connection.id)
    }
  }, [props.connection, props.connecting])

  useGlobalKeyEventHandler(KeyCodes.escape, props.actions.disconnect)
  useGlobalKeyEventHandler(KeyCodes.enter, toggleConnect, [props.connecting])

  const handleClickShowPassword = useCallback(() => {
    setShowPassword(!showPassword)
  }, [showPassword])

  function requiresBasePath() {
    return props.connection.protocol !== 'mqtt'
  }

  function renderBasePathInput() {
    return (
      <Grid item={true} xs={4}>
        <TextField
          label="Basepath"
          className={props.classes.textField}
          value={props.connection.basePath}
          onChange={handleChange('basePath')}
          margin="normal"
        />
      </Grid>
    )
  }

  const handleChange = (name: string) => (event: any) => {
    if (!props.connection) {
      return
    }

    let value = event.target.value
    
    // Handle MQTT version: 'auto' means undefined (auto-negotiation)
    if (name === 'protocolVersion') {
      value = value === 'auto' ? undefined : parseInt(value, 10)
    }

    updateConnection(name, value)
  }

  const updateConnection = (name: string, value: any) => {
    props.managerActions.updateConnection(props.connection.id, {
      [name]: value,
    })
  }

  const renderProtocols = () => {
    const { classes, connection } = props

    const protocolItems = protocols.map((value: string) => (
      <MenuItem key={value} value={value}>
        {value}://
      </MenuItem>
    ))

    return (
      <TextField
        select={true}
        label="Protocol"
        className={classes.textField}
        value={connection.protocol}
        onChange={updateProtocol}
        margin="normal"
      >
        {protocolItems}
      </TextField>
    )
  }

  const renderMqttVersion = () => {
    const { classes, connection } = props

    return (
      <TextField
        select={true}
        label="MQTT Version"
        className={classes.textField}
        value={connection.protocolVersion || 'auto'}
        onChange={handleChange('protocolVersion')}
        margin="normal"
      >
        <MenuItem value="auto">Auto</MenuItem>
        <MenuItem value={5}>v5.0</MenuItem>
        <MenuItem value={4}>v3.1.1</MenuItem>
        <MenuItem value={3}>v3.1</MenuItem>
      </TextField>
    )
  }

  const updateProtocol = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    updateConnection('protocol', value)
    if (event.target.value === 'mqtt') {
      updateConnection('basePath', undefined)
    } else {
      updateConnection('basePath', 'ws')
    }
  }

  const toggleCertValidation = () => {
    props.managerActions.updateConnection(props.connection.id, {
      certValidation: !props.connection.certValidation,
    })
  }

  const toggleTls = () => {
    props.managerActions.updateConnection(props.connection.id, {
      encryption: !props.connection.encryption,
    })
  }

  function PasswordVisibilityButton(props: { showPassword: boolean; toggle: () => void }) {
    return (
      <InputAdornment position="end">
        <IconButton aria-label="Toggle password visibility" onClick={props.toggle}>
          {props.showPassword ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      </InputAdornment>
    )
  }

  const { classes, connection } = props

  return (
    <div>
      <form className={classes.container} noValidate={true} autoComplete="off">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Row 1: Name + Toggles */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 60%' }}>
              <TextField
                autoFocus={true}
                label="Name"
                className={classes.textField}
                value={connection.name}
                onChange={handleChange('name')}
                margin="normal"
              />
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <ToggleSwitch
                label="Validate certificate"
                classes={classes}
                value={connection.certValidation}
                toggle={toggleCertValidation}
                labelPlacement="bottom"
              />
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <ToggleSwitch 
                label="Encryption (tls)" 
                classes={classes} 
                value={connection.encryption} 
                toggle={toggleTls}
                labelPlacement="bottom"
              />
            </div>
          </div>

          {/* Row 2: Protocol + Host + MQTT Version + Port */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: '0 0 120px' }}>
              {renderProtocols()}
            </div>
            <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
              <TextField
                label="Host"
                className={classes.textField}
                value={connection.host}
                onChange={handleChange('host')}
                margin="normal"
              />
            </div>
            <div style={{ flex: '0 0 180px' }}>
              {renderMqttVersion()}
            </div>
            <div style={{ flex: '0 0 100px' }}>
              <TextField
                label="Port"
                className={classes.textField}
                value={connection.port}
                onChange={handleChange('port')}
                margin="normal"
              />
            </div>
          </div>

          {/* Row 3: Username + Password (+ optional BasePath) */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {requiresBasePath() && (
              <div style={{ flex: '1 1 33%' }}>
                <TextField
                  label="Basepath"
                  className={classes.textField}
                  value={connection.basePath}
                  onChange={handleChange('basePath')}
                  margin="normal"
                />
              </div>
            )}
            <div style={{ flex: '1 1 50%' }}>
              <TextField
                label="Username"
                className={classes.textField}
                value={connection.username}
                onChange={handleChange('username')}
                margin="normal"
              />
            </div>
            <div style={{ flex: '1 1 50%' }}>
              <TextField
                label="Password"
                className={classes.textField}
                type={showPassword ? 'text' : 'password'}
                value={connection.password}
                onChange={handleChange('password')}
                margin="normal"
                InputProps={{
                  endAdornment: <PasswordVisibilityButton showPassword={showPassword} toggle={handleClickShowPassword} />,
                }}
              />
            </div>
          </div>
        </div>
        <br />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="contained"
              className={classes.button}
              onClick={() => props.managerActions.deleteConnection(props.connection.id)}
            >
              Delete <Delete />
            </Button>
            <Button
              variant="contained"
              className={classes.button}
              onClick={props.managerActions.toggleAdvancedSettings}
            >
              <Settings /> Advanced
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ButtonGroup variant="contained" color="secondary" className={classes.button}>
              <Button onClick={props.managerActions.saveConnectionSettings}>
                <Save /> Save
              </Button>
              <Button size="small" onClick={(e) => setSaveMenuAnchor(e.currentTarget)}>
                <ArrowDropDown />
              </Button>
            </ButtonGroup>
            <Menu
              anchorEl={saveMenuAnchor}
              open={Boolean(saveMenuAnchor)}
              onClose={() => setSaveMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  props.managerActions.saveConnectionAsCopy()
                  setSaveMenuAnchor(null)
                }}
              >
                <FileCopy fontSize="small" style={{ marginRight: 8 }} /> Save as Copy
              </MenuItem>
            </Menu>
            <ConnectButton toggle={toggleConnect} connecting={props.connecting} classes={classes} />
          </div>
        </div>
      </form>
    </div>
  )
}

const mapStateToProps = (state: AppState) => {
  return {
    connected: state.connection.connected,
    connecting: state.connection.connecting,
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    actions: bindActionCreators(connectionActions, dispatch),
    managerActions: bindActionCreators(connectionManagerActions, dispatch),
  }
}

const styles = (theme: Theme) => ({
  textField: {
    width: '100%',
  },
  switch: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    margin: theme.spacing(1),
  },
  inputFormControl: {
    marginTop: '16px',
  },
})

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ConnectionSettings))
