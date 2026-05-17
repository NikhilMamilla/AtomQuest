const { db } = require('../db')
const jwt = require('jsonwebtoken')
require('dotenv').config()

async function main() {
  try {
    console.log('Generating token for Sreemouna...')
    const token = jwt.sign({ id: 3, role: 'employee' }, process.env.JWT_SECRET || 'your_super_secret_key_change_this')
    console.log('Token:', token)

    console.log('Sending request to optimize endpoint with BLANK fields...')
    const response = await fetch('http://localhost:5000/api/goals/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: '',
        description: '',
        thrust_area: 'Process Excellence'
      })
    })

    console.log('Status:', response.status)
    const data = await response.json()
    console.log('Response Data:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}

main()
