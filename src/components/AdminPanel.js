import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Users, BarChart2, Coffee, ListTodo, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Tag, Building, User, Phone, Info, Calendar, MessageSquare, LogOut, Wrench, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Ya no necesitamos 'auth' aquí
import { collection, query, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Usuarios predefinidos con sus roles
  const predefinedUsers = [
    { username: 'admin', role: 'Administrador' },
    { username: 'carlos', role: 'Técnico' },
  ];

  const [reports, setReports] = useState([]);

  // Cargar reportes de Firestore
  useEffect(() => {
    const q = query(collection(db, "reports"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReports = [];
      querySnapshot.forEach((doc) => {
        fetchedReports.push({ ...doc.data(), docId: doc.id });
      });
      setReports(fetchedReports);
    }, (error) => {
      console.error("Error al obtener reportes en tiempo real: ", error);
    });
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-red-100 text-red-800 border-red-200';
      case 'En Proceso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Completado': return 'bg-green-100 text-green-800 border-green-200';
      case 'No Reparado': return 'bg-gray-300 text-gray-800 border-gray-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pendiente': return <XCircle className="w-4 h-4 mr-1" />;
      case 'En Proceso': return <Clock className="w-4 h-4 mr-1" />;
      case 'Completado': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'No Reparado': return <AlertTriangle className="w-4 h-4 mr-1" />;
      default: return null;
    }
  };

  const handleReportStatusChange = async (reportDocId, newStatus) => {
    try {
      const reportRef = doc(db, "reports", reportDocId);
      await updateDoc(reportRef, {
        status: newStatus
      });
      console.log(`Reporte ${reportDocId} actualizado a estado: ${newStatus}`);
    } catch (e) {
      console.error("Error al actualizar el estado del reporte: ", e);
      alert("No se pudo actualizar el estado. ¡Firebase está de malas!");
    }
  };

  const handleAssignTechnician = async (reportDocId, technicianUsername) => {
    try {
      const reportRef = doc(db, "reports", reportDocId);
      await updateDoc(reportRef, {
        assignedTo: technicianUsername
      });
      console.log(`Reporte ${reportDocId} asignado a: ${technicianUsername}`);
    } catch (e) {
      console.error("Error al asignar técnico al reporte: ", e);
      alert("No se pudo asignar el técnico. ¡Firebase se puso rebelde!");
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión? ¡La "chamba" no se arregla sola!')) {
      // Como no usamos Firebase Auth para el login, simplemente redirigimos
      navigate('/');
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl p-8 shadow-2xl max-w-6xl mx-auto my-8 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <Settings className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Panel de Administración
          </h2>
          <p className="text-gray-600 text-lg">
            Aquí es donde los verdaderos jefes toman el café... digo, las decisiones.
          </p>
        </div>
        <motion.button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </motion.button>
      </div>

      <div className="flex justify-center mb-8 space-x-4">
        <motion.button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Eye className="w-5 h-5" />
          Resumen
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'reports' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ListTodo className="w-5 h-5" />
          Gestión de Reportes
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-blue-800 mb-2">Total Usuarios</h3>
              <p className="text-blue-700 text-4xl font-extrabold">{predefinedUsers.length}</p>
            </motion.div>

            <motion.div
              className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <ListTodo className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-purple-800 mb-2">Reportes Pendientes</h3>
              <p className="text-purple-700 text-4xl font-extrabold">{reports.filter(r => r.status === 'Pendiente').length}</p>
            </motion.div>

            <motion.div
              className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Coffee className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-amber-800 mb-2">Reportes Completados</h3>
              <p className="text-amber-700 text-4xl font-extrabold">{reports.filter(r => r.status === 'Completado').length}</p>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Reportes</h3>
            <div className="space-y-6">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <motion.div
                    key={report.docId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Tag className="w-5 h-5 text-gray-500" />
                          Folio: {report.id}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          Fecha: {report.date}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center border ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {report.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-gray-700">
                      <p className="flex items-center"><Building className="w-4 h-4 mr-2 text-blue-500" /> <strong>Empresa:</strong> {report.companyName}</p>
                      <p className="flex items-center"><User className="w-4 h-4 mr-2 text-purple-500" /> <strong>Reporta:</strong> {report.reporterName}</p>
                      <p className="flex items-center"><Phone className="w-4 h-4 mr-2 text-green-500" /> <strong>Teléfono:</strong> {report.phoneNumber}</p>
                      <p className="flex items-center"><Coffee className="w-4 h-4 mr-2 text-amber-500" /> <strong>Equipo:</strong> {report.equipmentType} ({report.equipmentModel})</p>
                      <p className="flex items-center"><Wrench className="w-4 h-4 mr-2 text-cyan-500" /> <strong>Asignado a:</strong> {report.assignedTo || 'Sin asignar'}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-800 font-semibold mb-2 flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-orange-500" /> Descripción de la Falla:</p>
                      <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">{report.issueDescription}</p>
                    </div>

                    {/* Historial de Trabajo */}
                    {report.workLog && report.workLog.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-md font-bold text-gray-800 mb-2 flex items-center"><FileText className="w-4 h-4 mr-2" /> Historial de Trabajo:</h4>
                        {report.workLog.map((log, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg shadow-sm mb-2 text-sm border border-gray-100">
                            <p className="text-gray-700"><strong>Fecha:</strong> {log.date} {log.time}</p>
                            <p className="text-gray-700"><strong>Descripción:</strong> {log.description}</p>
                            <p className="text-gray-700"><strong>Costo:</strong> {log.cost > 0 ? `$${log.cost.toFixed(2)}` : 'Sin costo'}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                      <select
                        value={report.status}
                        onChange={(e) => handleReportStatusChange(report.docId, e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Completado">Completado</option>
                        <option value="No Reparado">No Reparado</option>
                      </select>

                      <select
                        value={report.assignedTo || ''}
                        onChange={(e) => handleAssignTechnician(report.docId, e.target.value || null)}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Asignar Técnico</option>
                        {predefinedUsers.filter(u => u.role === 'Técnico').map(tech => (
                          <option key={tech.username} value={tech.username}>{tech.username}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 text-gray-600 text-lg"
                >
                  <p>No hay reportes para mostrar. ¡Todo en orden, jefe!</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPanel;
