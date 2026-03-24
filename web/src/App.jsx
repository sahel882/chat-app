import './App.css'
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react'

function App() {
  
  return (
    <>
      <h1>Hello world</h1>

      <SignedOut>
        <SignInButton mode='modal'/>
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  )
}

export default App
