/**
 * Auto expand limits, shared by the settings drawer and the settings actions.
 * Kept out of the drawer component so importing it does not pull a React tree
 * (and webpack-only helpers such as require.context) into non-UI code.
 */
export const autoExpandLimitSet = [
  {
    limit: 0,
    name: 'Collapsed',
  },
  {
    limit: 2,
    name: 'Few',
  },
  {
    limit: 5,
    name: 'Some',
  },
  {
    limit: 15,
    name: 'Most',
  },
  {
    limit: 30,
    name: 'Most',
  },
  {
    limit: 1e6,
    name: 'All',
  },
]
