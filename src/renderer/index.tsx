import React from 'react'
import { createRoot } from 'react-dom/client'

import '../../style/global'

const App: React.FC = () => {
  return <p>Hello</p>
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />)
