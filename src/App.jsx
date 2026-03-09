import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import React from 'react'
// This line connects the file to the main app
import JqBeerWeekend from './jq-beer-weekend'

function App() {
  return (
    <div>
      {/* This "renders" your component on the screen */}
      <JqBeerWeekend />
    </div>
  )
}

export default App
