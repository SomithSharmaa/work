import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PlaceIdFinder from './placefinder'

function App() {
  const [count, setCount] = useState(0)

  return (
    <PlaceIdFinder />
  )
}

export default App
