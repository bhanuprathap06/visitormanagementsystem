import { Routes, Route, Navigate } from 'react-router-dom';
import Layout      from './components/Layout';
import Dashboard   from './pages/Dashboard';
import Locations   from './pages/Locations';
import Departments from './pages/Departments';
import Staff       from './pages/Staff';
import Visitors    from './pages/Visitors';
import Tickets     from './pages/Tickets';
import Gate        from './pages/Gate';
import Visits      from './pages/Visits';
import Reports     from './pages/Reports';
import Incidents   from './pages/Incidents';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="locations"   element={<Locations />} />
        <Route path="departments" element={<Departments />} />
        <Route path="staff"       element={<Staff />} />
        <Route path="visitors"    element={<Visitors />} />
        <Route path="tickets"     element={<Tickets />} />
        <Route path="gate"        element={<Gate />} />
        <Route path="visits"      element={<Visits />} />
        <Route path="reports"     element={<Reports />} />
        <Route path="incidents"   element={<Incidents />} />
      </Route>
    </Routes>
  );
}
