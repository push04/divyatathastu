import { NextRequest, NextResponse } from 'next/server'

// Famous mandirs dataset (free, no API needed)
const FAMOUS_MANDIRS = [
  { id: '1', name: 'Kashi Vishwanath Temple', city: 'Varanasi', state: 'Uttar Pradesh', deity: 'Lord Shiva', lat: 25.3109, lng: 83.0107, timing: '3:00 AM - 11:00 PM', specialPuja: 'Rudrabhishek', rating: 4.9, category: 'jyotirlinga' },
  { id: '2', name: 'Tirupati Balaji (Venkateswara)', city: 'Tirupati', state: 'Andhra Pradesh', deity: 'Lord Vishnu', lat: 13.6833, lng: 79.3476, timing: '2:30 AM - 9:00 PM', specialPuja: 'Suprabhatam', rating: 4.9, category: 'vishnu' },
  { id: '3', name: 'Shirdi Sai Baba Temple', city: 'Shirdi', state: 'Maharashtra', deity: 'Sai Baba', lat: 19.7686, lng: 74.4771, timing: '4:00 AM - 11:00 PM', specialPuja: 'Kakad Aarti', rating: 4.8, category: 'saints' },
  { id: '4', name: 'Vaishno Devi Temple', city: 'Katra', state: 'Jammu & Kashmir', deity: 'Goddess Durga', lat: 32.9931, lng: 74.9481, timing: 'Open 24 hours', specialPuja: 'Morning Aarti 4:30 AM', rating: 4.9, category: 'shakti' },
  { id: '5', name: 'Golden Temple (Sri Harmandir Sahib)', city: 'Amritsar', state: 'Punjab', deity: 'Guru Granth Sahib', lat: 31.6200, lng: 74.8765, timing: '24 hours', specialPuja: 'Amrit Vela 3:00 AM', rating: 4.9, category: 'sikh' },
  { id: '6', name: 'Meenakshi Amman Temple', city: 'Madurai', state: 'Tamil Nadu', deity: 'Goddess Meenakshi', lat: 9.9195, lng: 78.1193, timing: '5:00 AM - 12:30 PM, 4:00 PM - 10:00 PM', specialPuja: 'Kalasanthi Puja', rating: 4.8, category: 'shakti' },
  { id: '7', name: 'Somnath Temple', city: 'Somnath', state: 'Gujarat', deity: 'Lord Shiva', lat: 20.8880, lng: 70.4014, timing: '6:00 AM - 9:00 PM', specialPuja: 'Light & Sound Show 7:45 PM', rating: 4.8, category: 'jyotirlinga' },
  { id: '8', name: 'Siddhivinayak Temple', city: 'Mumbai', state: 'Maharashtra', deity: 'Lord Ganesha', lat: 19.0167, lng: 72.8310, timing: '5:30 AM - 9:00 PM', specialPuja: 'Mangal Aarti', rating: 4.7, category: 'ganesha' },
  { id: '9', name: 'Jagannath Temple', city: 'Puri', state: 'Odisha', deity: 'Lord Jagannath', lat: 19.8044, lng: 85.8180, timing: '5:00 AM - 12:00 PM, 4:00 PM - 11:00 PM', specialPuja: 'Mangal Aarti', rating: 4.8, category: 'vishnu' },
  { id: '10', name: 'Kedarnath Temple', city: 'Kedarnath', state: 'Uttarakhand', deity: 'Lord Shiva', lat: 30.7352, lng: 79.0669, timing: '6:00 AM - 7:00 PM (seasonal)', specialPuja: 'Mahabhishek', rating: 4.9, category: 'jyotirlinga' },
  { id: '11', name: 'Badrinath Temple', city: 'Badrinath', state: 'Uttarakhand', deity: 'Lord Vishnu', lat: 30.7433, lng: 79.4936, timing: '4:30 AM - 9:00 PM (seasonal)', specialPuja: 'Abhishek at 4:30 AM', rating: 4.9, category: 'vishnu' },
  { id: '12', name: 'Rameshwaram Temple', city: 'Rameshwaram', state: 'Tamil Nadu', deity: 'Lord Shiva', lat: 9.2876, lng: 79.3129, timing: '5:00 AM - 1:00 PM, 3:00 PM - 9:00 PM', specialPuja: '22 theerthams bath', rating: 4.8, category: 'jyotirlinga' },
  { id: '13', name: 'Dwarkadheesh Temple', city: 'Dwarka', state: 'Gujarat', deity: 'Lord Krishna', lat: 22.2388, lng: 68.9674, timing: '6:30 AM - 1:00 PM, 5:00 PM - 9:30 PM', specialPuja: 'Abhishek', rating: 4.8, category: 'vishnu' },
  { id: '14', name: 'Akshardham Temple', city: 'New Delhi', state: 'Delhi', deity: 'Lord Swaminarayan', lat: 28.6127, lng: 77.2773, timing: '9:30 AM - 6:30 PM (closed Monday)', specialPuja: 'Light show 7:45 PM', rating: 4.8, category: 'swaminarayan' },
  { id: '15', name: 'ISKCON Temple', city: 'Vrindavan', state: 'Uttar Pradesh', deity: 'Lord Krishna', lat: 27.5709, lng: 77.6966, timing: '4:30 AM - 8:30 PM', specialPuja: 'Mangal Aarti 4:30 AM', rating: 4.7, category: 'vishnu' },
  { id: '16', name: 'Mahakaleshwar Temple', city: 'Ujjain', state: 'Madhya Pradesh', deity: 'Lord Shiva', lat: 23.1793, lng: 75.7689, timing: '4:00 AM - 11:00 PM', specialPuja: 'Bhasma Aarti 4:00 AM', rating: 4.9, category: 'jyotirlinga' },
  { id: '17', name: 'Trimbakeshwar Temple', city: 'Nashik', state: 'Maharashtra', deity: 'Lord Shiva', lat: 19.9351, lng: 73.5288, timing: '5:30 AM - 9:00 PM', specialPuja: 'Rudrabhishek', rating: 4.7, category: 'jyotirlinga' },
  { id: '18', name: 'Puri Jagannath Rath Yatra', city: 'Puri', state: 'Odisha', deity: 'Lord Jagannath', lat: 19.8044, lng: 85.8180, timing: 'Annual Rath Yatra - July', specialPuja: 'Rath Yatra', rating: 4.9, category: 'vishnu' },
  { id: '19', name: 'Nataraja Temple', city: 'Chidambaram', state: 'Tamil Nadu', deity: 'Lord Shiva (Nataraja)', lat: 11.3996, lng: 79.6927, timing: '6:00 AM - 12:00 PM, 5:00 PM - 10:00 PM', specialPuja: 'Thiruvannamalai Deepam', rating: 4.7, category: 'shiva' },
  { id: '20', name: 'Guruvayur Temple', city: 'Guruvayur', state: 'Kerala', deity: 'Lord Krishna', lat: 10.5945, lng: 76.0418, timing: '3:00 AM - 1:00 PM, 4:30 PM - 9:30 PM', specialPuja: 'Usha Puja 3:00 AM', rating: 4.8, category: 'vishnu' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '28.6139')
  const lng = parseFloat(searchParams.get('lng') || '77.2090')
  const radius = parseFloat(searchParams.get('radius') || '500')
  const deity = searchParams.get('deity') || ''
  const state = searchParams.get('state') || ''
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''

  let mandirs = FAMOUS_MANDIRS

  // Filter by deity
  if (deity) mandirs = mandirs.filter(m => m.deity.toLowerCase().includes(deity.toLowerCase()))
  if (state) mandirs = mandirs.filter(m => m.state.toLowerCase().includes(state.toLowerCase()))
  if (category) mandirs = mandirs.filter(m => m.category === category)
  if (query) mandirs = mandirs.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.city.toLowerCase().includes(query.toLowerCase()) ||
    m.deity.toLowerCase().includes(query.toLowerCase())
  )

  // Sort by distance from user location
  const withDistance = mandirs.map(m => {
    const R = 6371
    const dLat = (m.lat - lat) * Math.PI / 180
    const dLng = (m.lng - lng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180) * Math.cos(m.lat*Math.PI/180) * Math.sin(dLng/2)**2
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return { ...m, distance: Math.round(distance) }
  }).sort((a, b) => a.distance - b.distance)

  return NextResponse.json({
    success: true,
    data: withDistance,
    total: withDistance.length,
  }, {
    headers: { 'Cache-Control': 's-maxage=86400' }
  })
}
