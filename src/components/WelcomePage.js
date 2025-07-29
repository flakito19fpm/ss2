import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Wrench, ArrowRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const WelcomePage = () => {
  return (
    <motion.div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Fondo con imagen de granos de café y equipos */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-75"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-gray-900/70"></div>

      <motion.div
        className="relative z-10 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-3xl text-center border border-gray-200"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
      >
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
          initial={{ rotate: 0, scale: 0 }}
          animate={{ rotate: 360, scale: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 10, delay: 0.5 }}
        >
          <Coffee className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h1
          className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Bienvenido al Centro de Soporte Técnico
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
            de Café Kaawa
          </span>
        </motion.h1>

        <motion.p
          className="text-lg text-gray-700 mb-8 max-w-prose mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          En nuestra plataforma, nos dedicamos a asegurar el óptimo funcionamiento de sus cafeteras y molinos.
          Reporte cualquier incidencia de manera eficiente y reciba la asistencia especializada que su equipo merece.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Link
            to="/reportar"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Wrench className="w-6 h-6 mr-3" />
            Reportar un Problema
            <ArrowRight className="w-5 h-5 ml-3" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Botón "escondido" para el acceso de técnicos */}
      <motion.div
        className="absolute bottom-4 right-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <Link
          to="/login-tecnico"
          className="p-3 rounded-full bg-gray-800/30 text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-300"
          title="Acceso para Técnicos"
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          <Settings className="w-6 h-6" />
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default WelcomePage;