import React from 'react'
import { FormControlLabel, Switch } from '@material-ui/core'

export function ToggleSwitch(props: { 
  value: boolean
  classes: any
  toggle: () => void
  label: string
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom'
}) {
  const { classes, value, toggle, label, labelPlacement = 'bottom' } = props
  const toggleSwitch = <Switch checked={value} onChange={toggle} color="primary" />
  return (
    <div className={classes.switch}>
      <FormControlLabel 
        control={toggleSwitch} 
        label={<span style={{ whiteSpace: 'nowrap' }}>{label}</span>} 
        labelPlacement={labelPlacement} 
      />
    </div>
  )
}
