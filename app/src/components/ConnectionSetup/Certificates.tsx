import * as React from 'react'
import CertificateFileSelection from './CertificateFileSelection'
import BrowserCertificateFileSelection from './BrowserCertificateFileSelection'
import Undo from '@mui/icons-material/Undo'
import Archive from '@mui/icons-material/Archive'
import { bindActionCreators } from 'redux'
import { Button, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { connect } from 'react-redux'
import { connectionManagerActions } from '../../actions'
import { ConnectionOptions } from '../../model/ConnectionOptions'
import { Theme } from '@mui/material/styles'
import { withStyles } from '@mui/styles'
import { isBrowserMode } from '../../utils/browserMode'

// Use browser or desktop file selection based on mode
const CertSelector: any = isBrowserMode ? BrowserCertificateFileSelection : CertificateFileSelection

interface Props {
  connection: ConnectionOptions
  classes: any
  managerActions: typeof connectionManagerActions
}

interface State {
  subscription: string
}

class Certificates extends React.PureComponent<Props, State> {
  constructor(props: any) {
    super(props)
    this.state = { subscription: '' }
  }

  private handleChange = (name: string) => (event: any) => {
    this.props.managerActions.updateConnection(this.props.connection.id, {
      [name]: event.target.value,
    })
  }

  private renderCertificateInfo() {
    if (!this.props.connection.selfSignedCertificate) {
      return null
    }

    return <span />
  }

  public render() {
    const { classes, connection } = this.props
    return (
      <form noValidate={true} autoComplete="off" className={classes.container}>
        <Stack spacing={1.5}>
          {!isBrowserMode && (
            <div>
              <Tooltip
                title="Select a .zip containing the CA, client certificate and client key"
                placement="top"
              >
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Archive />}
                  className={classes.actionButton}
                  onClick={() => this.props.managerActions.selectCertificateBundle(connection.id)}
                >
                  Import bundle (.zip)
                </Button>
              </Tooltip>
              <Typography variant="caption" display="block" className={classes.hint}>
                Fills in the CA, client certificate and client key from a single zip archive.
              </Typography>
            </div>
          )}

          {!isBrowserMode && (
            <Divider textAlign="left" className={classes.divider}>
              <Typography variant="caption" color="textSecondary">
                or select files individually
              </Typography>
            </Divider>
          )}

          <div className={classes.certRow}>
            <CertSelector
              connection={connection}
              certificate={connection.selfSignedCertificate}
              title="Server Certificate (CA)"
              certificateType="selfSignedCertificate"
            />
          </div>
          <div className={classes.certRow}>
            <CertSelector
              connection={connection}
              certificate={connection.clientCertificate}
              title="Client Certificate"
              certificateType="clientCertificate"
            />
          </div>
          <div className={classes.certRow}>
            <CertSelector
              connection={connection}
              certificate={connection.clientKey}
              title="Client Key"
              certificateType="clientKey"
            />
          </div>

          <Divider />
          <div>
            <Button
              variant="outlined"
              startIcon={<Undo />}
              onClick={this.props.managerActions.toggleCertificateSettings}
            >
              Back
            </Button>
          </div>
        </Stack>
      </form>
    )
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    managerActions: bindActionCreators(connectionManagerActions, dispatch),
  }
}

const styles = (theme: Theme) => ({
  container: {
    padding: theme.spacing(1, 1.5, 2),
    maxWidth: 560,
  },
  actionButton: {
    textTransform: 'none' as 'none',
  },
  hint: {
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  },
  divider: {
    margin: theme.spacing(0.5, 0),
  },
  certRow: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 40,
    // The selector buttons carry a legacy top margin meant for the old grid layout;
    // neutralise it so the stacked rows line up evenly.
    '& button': {
      marginTop: 0,
    },
  },
})

export default connect(undefined, mapDispatchToProps)(withStyles(styles)(Certificates) as any)
