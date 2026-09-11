import * as q from '../../../../backend/src/Model'
import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { withStyles } from '@mui/styles'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { globalActions } from '../../actions'
import Info from '@mui/icons-material/Info'

interface Props {
  node?: q.TreeNode<any>
  classes: any
  globalActions: typeof globalActions
}

/**
 * Bottom strip of the sidebar: the selected topic's counters and the About
 * button. It lives here rather than inside DetailsTab so that it stays at the
 * very bottom in combined mode, below the publish editor.
 */
function SidebarFooter(props: Props) {
  const { node, classes } = props

  return (
    <Box className={classes.root} data-testid="sidebar-footer">
      {node && (
        <Box className={classes.statsGrid}>
          <Stat label="Messages" value={node.messages} classes={classes} />
          <Stat label="Subtopics" value={node.childTopicCount()} classes={classes} />
          <Stat label="Total" value={node.leafMessageCount()} classes={classes} />
        </Box>
      )}
      <Button
        variant="outlined"
        size="small"
        startIcon={<Info />}
        onClick={() => props.globalActions.toggleAboutDialogVisibility()}
        fullWidth
      >
        About MQTT Explorer
      </Button>
    </Box>
  )
}

function Stat(props: { label: string; value: number; classes: any }) {
  return (
    <Box className={props.classes.statItem}>
      <Typography variant="body2" color="textSecondary" className={props.classes.statLabel}>
        {props.label}
      </Typography>
      <Typography variant="h6" className={props.classes.statValue}>
        {props.value}
      </Typography>
    </Box>
  )
}

const styles = (theme: Theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(1.5),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(1),
    },
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    padding: theme.spacing(1.5, 1),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    gap: theme.spacing(0.5),
  },
  statLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase' as 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1,
  },
})

const mapDispatchToProps = (dispatch: any) => {
  return {
    globalActions: bindActionCreators(globalActions, dispatch),
  }
}

export default withStyles(styles)(connect(undefined, mapDispatchToProps)(SidebarFooter))
