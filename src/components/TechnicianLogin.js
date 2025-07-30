import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, Coffee, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Solo necesitamos auth aquí

const TechnicianLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Usuarios predefinidos con sus credenciales
  const predefinedUsers = {
    'admin@kaawa.com': { password: 'Claudio1976+', role: 'Administrador' },
    'carlos@kaawa.com': { password: 'robusta25', role: 'Técnico' },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const userEntry = predefinedUsers[email];

    if (!userEntry) {
      setError('Credenciales incorrectas. ¿Seguro que eres un técnico y no un impostor que quiere café gratis?');
      return;
    }

    try {
      // Autenticar con Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);

      // Si la autenticación es exitosa, redirigir según el rol predefinido
      if (userEntry.role === 'Administrador') {
        navigate('/panel-admin');
      } else if (userEntry.role === 'Técnico') {
        navigate('/panel-tecnico');
      } else {
        setError('Rol de usuario no reconocido. Contacta al administrador.');
      }
    } catch (error) {
      console.error("Error al iniciar sesión: ", error);
      let errorMessage = "Error al iniciar sesión. ";
      if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage += "Credenciales incorrectas. ¿Seguro que eres un técnico y no un impostor que quiere café gratis?";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage += "Demasiados intentos fallidos. Intenta de nuevo más tarde.";
      } else {
        errorMessage += error.message;
      }
      setError(errorMessage);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium";
  const labelClasses = "block text-gray-700 text-sm font-semibold mb-2";

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Fondo con imagen de herramientas y café */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-75"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586306747134-269337767b6f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-gray-900/70"></div>

      <motion.div
        className="relative z-10 bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl max-w-md mx-auto border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Acceso para Héroes del Café
          </h2>
          <p className="text-gray-600 text-lg">
            ¡El mundo del café te necesita! Ingresa para salvar el día.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className={labelClasses}>
              <User className="inline-block w-4 h-4 mr-2 text-blue-500" />
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="usuario" // Placeholder con ejemplos
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClasses}>
              <Lock className="inline-block w-4 h-4 mr-2 text-purple-500" />
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="pass" // Placeholder con ejemplos
              required
            />
          </div>

          {error && (
            <motion.p
              className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Zap className="w-5 h-5" />
            ¡A Salvar Cafeteras!
          </motion.button>
        </form>

        <motion.div
          className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Coffee className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">
            "Cada cafetera reparada es una sonrisa más en el mundo. ¡Tu misión es crucial!"
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default TechnicianLogin;
