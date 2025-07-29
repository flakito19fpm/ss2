import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Building, User, Phone, Coffee, Grinder, MessageSquare, Wrench, Info, CheckCircle } from 'lucide-react';
import { db } from '../firebaseConfig'; // Importa la instancia de Firestore
import { collection, addDoc } from 'firebase/firestore'; // Importa funciones de Firestore

const ReportForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    reporterName: '',
    phoneNumber: '',
    equipmentType: '', // Ahora será 'Cafetera' o 'Molino'
    equipmentModel: '', // Nuevo campo para el modelo
    issueDescription: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [folioNumber, setFolioNumber] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const generateFolio = () => {
    // Esto es un folio "único" para que se sientan especiales.
    // En un mundo real, esto vendría de tu base de datos.
    return 'CAF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newFolio = generateFolio();
    setFolioNumber(newFolio);

    try {
      // Añade el reporte a la colección 'reports' en Firestore
      await addDoc(collection(db, "reports"), {
        ...formData,
        id: newFolio, // Usamos el folio generado como ID del reporte
        status: 'Pendiente', // Estado inicial del reporte
        date: new Date().toISOString().split('T')[0], // Fecha actual
        assignedTo: null, // Sin asignar al inicio
        workLog: [] // Log de trabajo vacío
      });
      console.log("Documento escrito con ID: ", newFolio);
      setShowConfirmation(true);

      // Reiniciar el formulario después de un breve retraso para la animación
      setTimeout(() => {
        setFormData({
          companyName: '',
          reporterName: '',
          phoneNumber: '',
          equipmentType: '',
          equipmentModel: '',
          issueDescription: ''
        });
      }, 500); 

    } catch (e) {
      console.error("Error al añadir documento: ", e);
      alert('Hubo un error al enviar el reporte. ¿Será que el problema eres tú? Es broma... o no. Revisa la consola.');
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium";
  const labelClasses = "block text-gray-700 text-sm font-semibold mb-2";

  return (
    <motion.div
      className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto my-8 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="text-center mb-8">
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <Coffee className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
          Reporte de Equipo de Café
        </h2>
        <p className="text-gray-600 text-lg">
          ¿Tu café no sabe igual? ¿El molino hace ruidos extraños? ¡Reporta tu problema aquí!
        </p>
      </div>

      <AnimatePresence mode="wait">
        {showConfirmation ? (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              ¡Reporte Enviado con Éxito!
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              Tu reporte ha sido recibido. Tu número de folio es:
            </p>
            <motion.p
              className="text-4xl font-extrabold text-green-600 bg-green-50 py-3 px-6 rounded-xl inline-block tracking-wider"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {folioNumber}
            </motion.p>
            <p className="text-md text-gray-500 mt-6">
              Te contactaremos pronto para solucionar tu problema. ¡Gracias por tu paciencia!
            </p>
            <motion.button
              onClick={() => setShowConfirmation(false)}
              className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Hacer otro reporte
            </motion.button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label htmlFor="companyName" className={labelClasses}>
                <Building className="inline-block w-4 h-4 mr-2 text-blue-500" />
                Nombre de la Cafetería/Empresa:
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={inputClasses}
                placeholder="Ej: Café del Sol"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label htmlFor="reporterName" className={labelClasses}>
                <User className="inline-block w-4 h-4 mr-2 text-purple-500" />
                Nombre de quien reporta:
              </label>
              <input
                type="text"
                id="reporterName"
                name="reporterName"
                value={formData.reporterName}
                onChange={handleChange}
                className={inputClasses}
                placeholder="Ej: Barista Experto"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <label htmlFor="phoneNumber" className={labelClasses}>
                <Phone className="inline-block w-4 h-4 mr-2 text-green-500" />
                Teléfono de contacto:
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={inputClasses}
                placeholder="Ej: +52 55 9876 5432"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <label htmlFor="equipmentType" className={labelClasses}>
                <Wrench className="inline-block w-4 h-4 mr-2 text-red-500" />
                Tipo de Equipo:
              </label>
              <select
                id="equipmentType"
                name="equipmentType"
                value={formData.equipmentType}
                onChange={handleChange}
                className={inputClasses}
                required
              >
                <option value="">Selecciona un tipo</option>
                <option value="Cafetera">Cafetera</option>
                <option value="Molino">Molino</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <label htmlFor="equipmentModel" className={labelClasses}>
                <Info className="inline-block w-4 h-4 mr-2 text-cyan-500" />
                Modelo del Equipo:
              </label>
              <input
                type="text"
                id="equipmentModel"
                name="equipmentModel"
                value={formData.equipmentModel}
                onChange={handleChange}
                className={inputClasses}
                placeholder="Ej: La Marzocco Linea Mini, Baratza Encore"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <label htmlFor="issueDescription" className={labelClasses}>
                <MessageSquare className="inline-block w-4 h-4 mr-2 text-orange-500" />
                Descripción de la falla:
              </label>
              <textarea
                id="issueDescription"
                name="issueDescription"
                value={formData.issueDescription}
                onChange={handleChange}
                rows="6"
                className={`${inputClasses} resize-y`}
                placeholder="Describe el problema con tu cafetera o molino. ¿No calienta? ¿Muele demasiado grueso? ¿Hace ruidos extraños? ¡Cuéntamelo todo!"
                required
              ></textarea>
            </motion.div>

            <motion.button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Send className="w-5 h-5" />
              Enviar Reporte de Café
            </motion.button>

            <motion.div
              className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
            >
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Tu reporte será revisado por nuestros expertos en café. ¡Pronto volverás a disfrutar de una taza perfecta!
              </p>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReportForm;