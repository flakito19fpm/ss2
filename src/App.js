import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReportForm from './components/ReportForm';
import WelcomePage from './components/WelcomePage';
import TechnicianLogin from './components/TechnicianLogin';
import TechnicianPanel from './components/TechnicianPanel';
import AdminPanel from './components/AdminPanel'; // Importa el panel de admin

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/reportar" element={<ReportForm />} />
            <Route path="/login-tecnico" element={<TechnicianLogin />} />
            <Route path="/panel-tecnico" element={<TechnicianPanel />} />
            <Route path="/panel-admin" element={<AdminPanel />} /> {/* Ruta para el panel de admin */}
          </Routes>
        </motion.div>
      </div>
    </Router>
  );
};

export default App;