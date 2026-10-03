import { useEffect, useState } from 'react'

export default function Typewriter({ text }) {
  const [out, setOut] = useState('')

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setOut(text.slice(0, i++))
      if (i > text.length) clearInterval(id)
    }, 40)

    return () => clearInterval(id)
  }, [text])

  return <span>{out}</span>
}

// Usage:
// <Typewriter text="Welcome to MercySoul Vision..." />
