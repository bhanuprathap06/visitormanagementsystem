import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import BookTickets from './pages/BookTickets.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MyTickets from './pages/MyTickets.jsx'
import Exhibits from './pages/Exhibits.jsx'
import Events from './pages/Events.jsx'
import Animals from './pages/Animals.jsx'

export default function App() {
  const location = useLocation()
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/tickets" element={<BookTickets />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/exhibits" element={<Exhibits />} />
              <Route path="/events" element={<Events />} />
              <Route path="/animals" element={<Animals />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
