import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Modern3DUMAP from './Modern3DUMAP'
import './index.css'

// We will create this component in the next step
import CollabChat from './CollabChat'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Modern3DUMAP />} />
        <Route path="/collab-chat/:sessionId/:currentUserEmail" element={<CollabChat />} />
      </Routes>
    </Router>
  </React.StrictMode>,
) 