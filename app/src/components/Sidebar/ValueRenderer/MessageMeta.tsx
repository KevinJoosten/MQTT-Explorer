import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Chip, Tooltip, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export function RetainedIndicator(props: { retain: boolean; wasRetained: boolean }) {
  if (props.retain) {
    return (
      <Tooltip title="This message was delivered with the retain flag set.">
        <Chip label="Retained" size="small" variant="outlined" color="primary" />
      </Tooltip>
    )
  }
  if (props.wasRetained) {
    return (
      <Tooltip title="This topic has a retained value on the broker, but the message shown is a live update whose retain flag was not set (see MQTT retain semantics).">
        <Chip label="was retained" size="small" variant="outlined" sx={{ opacity: 0.65, borderStyle: 'dashed' }} />
      </Tooltip>
    )
  }
  return null
}

export function MessageProperties(props: { properties?: { [key: string]: any } }) {
  const { properties } = props
  if (!properties || Object.keys(properties).length === 0) {
    return null
  }

  // userProperties is a nested object; show its entries alongside the other properties
  const entries = Object.entries(properties).flatMap(([key, value]) =>
    key === 'userProperties' && typeof value === 'object' && value !== null ? Object.entries(value) : [[key, value]]
  )

  return (
    <Accordion defaultExpanded={false} disableGutters={true} style={{ marginTop: 8 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="caption">MQTT v5 Properties</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {entries.map(([key, value]) => (
          <Typography key={key} variant="caption" component="div" style={{ wordBreak: 'break-word' }}>
            <b>{key}:</b>
            {String(value)}
          </Typography>
        ))}
      </AccordionDetails>
    </Accordion>
  )
}
