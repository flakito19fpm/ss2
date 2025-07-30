import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Users, BarChart2, Coffee, ListTodo, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Tag, Building, User, Phone, Info, Calendar, MessageSquare, LogOut, Wrench, AlertTriangle, TrendingUp, FileText, Hourglass, CheckSquare, XSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const [loggedInUsername, setLoggedInUsername] = useState(''); // Estado para el nombre de usuario logueado
  const [filterStatus, setFilterStatus] = useState('Pendiente'); // Nuevo estado para el filtro de reportes

  // Usuarios predefinidos con sus roles
  const predefinedUsers = [
    { username: 'admin', role: 'Administrador' },
    { username: 'carlos', role: 'Técnico' },
    { username: 'jonathan', role: 'Técnico' },
    { username: 'gabriel', role: 'Técnico' },
  ];

  const [reports, setReports] = useState([]);

  // Obtener el nombre de usuario del técnico logueado desde localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('loggedInTechnician');
    if (storedUsername) {
      setLoggedInUsername(storedUsername);
    } else {
      // Si no hay usuario logueado, redirigir al login
      navigate('/login-tecnico');
    }
  }, [navigate]);

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
      const updateData = { status: newStatus };

      // Si se marca como completado, registra la hora de completado
      if (newStatus === 'Completado') {
        updateData.completedAt = new Date().toISOString();
      } else {
        // Si cambia de completado a otro estado, limpia completedAt
        updateData.completedAt = null;
      }

      await updateDoc(reportRef, updateData);
      console.log(`Reporte ${reportDocId} actualizado a estado: ${newStatus}`);
    } catch (e) {
      console.error("Error al actualizar el estado del reporte: ", e);
      alert("No se pudo actualizar el estado. ¡Firebase está de malas!");
    }
  };

  const handleAssignTechnician = async (reportDocId, technicianUsername) => {
    try {
      const reportRef = doc(db, "reports", reportDocId);
      const updateData = { assignedTo: technicianUsername };

      // Si se asigna a un técnico (y no estaba asignado antes), registra la hora de asignación
      // Solo actualiza assignedAt si el reporte no tenía un técnico asignado o si se asigna a uno diferente
      const currentReport = reports.find(r => r.docId === reportDocId);
      if (technicianUsername && currentReport?.assignedTo !== technicianUsername) {
        updateData.assignedAt = new Date().toISOString();
      } else if (!technicianUsername) {
        // Si se desasigna, limpia assignedAt y completedAt
        updateData.assignedAt = null;
        updateData.completedAt = null;
      }

      await updateDoc(reportRef, updateData);
      console.log(`Reporte ${reportDocId} asignado a: ${technicianUsername}`);
    } catch (e) {
      console.error("Error al asignar técnico al reporte: ", e);
      alert("No se pudo asignar el técnico. ¡Firebase se puso rebelde!");
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión? ¡La "chamba" no se arregla sola!')) {
      localStorage.removeItem('loggedInTechnician'); // Limpiar el usuario logueado
      navigate('/');
    }
  };

  // Función para calcular la duración
  const calculateDuration = (assignedAt, completedAt) => {
    if (!assignedAt || !completedAt) return 'N/A';

    const start = new Date(assignedAt);
    const end = new Date(completedAt);
    const diffMs = end - start; // Diferencia en milisegundos

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    let result = '';
    if (diffDays > 0) result += `${diffDays}d `;
    if (diffHours > 0) result += `${diffHours}h `;
    if (diffMinutes > 0) result += `${diffMinutes}m `;
    if (diffSeconds > 0 && result === '') result += `${diffSeconds}s`; // Solo segundos si es muy corto

    return result.trim() || 'Menos de 1m';
  };

  // Función para calcular el tiempo de vencido
  const calculateOverdueTime = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const due = new Date(deadline);
    if (now <= due) return null; // No está vencido

    const diffMs = now - due; // Diferencia en milisegundos

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let result = '';
    if (diffDays > 0) result += `${diffDays}d `;
    if (diffHours > 0) result += `${diffHours}h `;
    if (diffMinutes > 0) result += `${diffMinutes}m `;

    return result.trim() || 'Menos de 1m';
  };

  // Función para determinar el color del plazo
  const getDeadlineColor = (report) => {
    if (!report.deadline || report.status === 'Completado' || report.status === 'No Reparado') {
      if (report.status === 'Completado' && report.deadline && new Date(report.completedAt) > new Date(report.deadline)) {
        return 'bg-red-100 text-red-800 border-red-200'; // Completado pero vencido
      } else if (report.status === 'Completado' && report.deadline && new Date(report.completedAt) <= new Date(report.deadline)) {
        return 'bg-green-100 text-green-800 border-green-200'; // Completado a tiempo
      }
      return 'bg-gray-100 text-gray-800 border-gray-200'; // Sin plazo o estado final
    }

    const now = new Date();
    const deadlineDate = new Date(report.deadline);
    const diffHours = (deadlineDate - now) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return 'bg-red-100 text-red-800 border-red-200'; // Vencido
    } else if (diffHours <= 24) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Próximo a vencer (24h)
    }
    return 'bg-blue-100 text-blue-800 border-blue-200'; // A tiempo
  };

  // Función para calcular métricas de productividad
  const getProductivityMetrics = () => {
    const technicianMetrics = {};
    const statusCounts = {
      'Pendiente': 0,
      'En Proceso': 0,
      'Completado': 0,
      'No Reparado': 0
    };
    const deadlineStatusCounts = {
      'onTime': 0,
      'dueSoon': 0,
      'overdue': 0
    };

    predefinedUsers.filter(u => u.role === 'Técnico').forEach(tech => {
      technicianMetrics[tech.username] = {
        completedReports: 0,
        totalDurationMs: 0,
        averageDuration: 'N/A',
        onTimeReports: 0, // Nuevo: reportes completados a tiempo
        totalCompletedReports: 0, // Nuevo: total de reportes completados (para el porcentaje)
        onTimePercentage: 'N/A' // Nuevo: porcentaje de cumplimiento
      };
    });

    reports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;

      // Métricas de cumplimiento de plazos
      if (report.deadline && report.status !== 'Completado' && report.status !== 'No Reparado') {
        const now = new Date();
        const deadlineDate = new Date(report.deadline);
        const diffHours = (deadlineDate - now) / (1000 * 60 * 60);

        if (diffHours <= 0) {
          deadlineStatusCounts.overdue++;
        } else if (diffHours <= 24) {
          deadlineStatusCounts.dueSoon++;
        } else {
          deadlineStatusCounts.onTime++;
        }
      } else if (report.status === 'Completado' && report.deadline) {
        if (new Date(report.completedAt) <= new Date(report.deadline)) {
          deadlineStatusCounts.onTime++;
        } else {
          deadlineStatusCounts.overdue++; // Completado pero vencido
        }
      }


      if (report.status === 'Completado' && report.assignedTo && report.assignedAt && report.completedAt) {
        const tech = technicianMetrics[report.assignedTo];
        if (tech) {
          const start = new Date(report.assignedAt);
          const end = new Date(report.completedAt);
          const duration = end - start;
          
          tech.completedReports++;
          tech.totalDurationMs += duration;

          // Calcular cumplimiento de plazos
          tech.totalCompletedReports++;
          if (report.deadline && new Date(report.completedAt) <= new Date(report.deadline)) {
            tech.onTimeReports++;
          }
        }
      }
    });

    Object.keys(technicianMetrics).forEach(techName => {
      const tech = technicianMetrics[techName];
      if (tech.completedReports > 0) {
        const avgMs = tech.totalDurationMs / tech.completedReports;
        tech.averageDuration = calculateDuration(0, avgMs); // Usamos 0 como start para que calcule solo la duración
      }
      if (tech.totalCompletedReports > 0) {
        tech.onTimePercentage = ((tech.onTimeReports / tech.totalCompletedReports) * 100).toFixed(2) + '%';
      }
    });

    return { technicianMetrics, statusCounts, deadlineStatusCounts };
  };

  const { technicianMetrics, statusCounts, deadlineStatusCounts } = getProductivityMetrics();

  // Reportes filtrados por estado
  const filteredReports = reports.filter(report => {
    if (filterStatus === 'Todos') return true; // Opción para ver todos los reportes
    return report.status === filterStatus;
  });

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
            ¡Bienvenido, <span className="text-blue-600 font-bold">{loggedInUsername}</span>! Aquí es donde los verdaderos jefes toman el café... digo, las decisiones.
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
        <motion.button
          onClick={() => setActiveTab('metrics')}
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'metrics' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <TrendingUp className="w-5 h-5" />
          Métricas
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
            
            <div className="mb-6 flex justify-center space-x-4">
              {['Pendiente', 'En Proceso', 'Completado', 'No Reparado', 'Todos'].map(status => (
                <motion.button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {status} ({reports.filter(r => status === 'Todos' ? true : r.status === status).length})
                </motion.button>
              ))}
            </div>

            <div className="space-y-6">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <motion.div
                    key={report.docId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className={`bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${getDeadlineColor(report)}`}
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
                      {report.assignedAt && report.completedAt && (
                        <p className="flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-500" /> <strong>Duración:</strong> {calculateDuration(report.assignedAt, report.completedAt)}</p>
                      )}
                      {report.deadline && (
                        <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-red-500" /> <strong>Fecha Límite:</strong> {report.deadline}</p>
                      )}
                      {report.deadline && new Date() > new Date(report.deadline) && report.status !== 'Completado' && report.status !== 'No Reparado' && (
                        <p className="flex items-center text-red-600 font-bold"><AlertTriangle className="w-4 h-4 mr-2" /> ¡Vencido por: {calculateOverdueTime(report.deadline)}!</p>
                      )}
                      {report.status === 'Completado' && report.deadline && new Date(report.completedAt) > new Date(report.deadline) && (
                        <p className="flex items-center text-red-600 font-bold"><AlertTriangle className="w-4 h-4 mr-2" /> Completado con retraso: {calculateOverdueTime(report.deadline)}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-800 font-semibold mb-2 flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-orange-500" /> Descripción de la Falla:</p>
                      <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">{report.issueDescription}</p>
                    </div>

                    {report.delayJustification && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-semibold mb-2 flex items-center"><Info className="w-4 h-4 mr-2" /> Justificación del Retraso:</p>
                        <p className="text-red-700">{report.delayJustification}</p>
                      </div>
                    )}

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
                        <option value="">Sin asignar</option> {/* Opción para desasignar */}
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

        {activeTab === 'metrics' && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Métricas de Productividad</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-500" /> Productividad por Técnico</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Técnico</th>
                        <th className="py-3 px-6 text-center">Reportes Completados</th>
                        <th className="py-3 px-6 text-center">Tiempo Promedio</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                      {Object.keys(technicianMetrics).map(techName => (
                        <tr key={techName} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6 text-left">{techName}</td>
                          <td className="py-3 px-6 text-center">{technicianMetrics[techName].completedReports}</td>
                          <td className="py-3 px-6 text-center">{technicianMetrics[techName].averageDuration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-purple-500" /> Reportes por Estado</h4>
                <div className="space-y-3">
                  {Object.keys(statusCounts).map(status => (
                    <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700">{status}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
                        {statusCounts[status]}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md col-span-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-500" /> Cumplimiento de Plazos</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Técnico</th>
                        <th className="py-3 px-6 text-center">A Tiempo</th>
                        <th className="py-3 px-6 text-center">Total Completados</th>
                        <th className="py-3 px-6 text-center">Cumplimiento (%)</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                      {Object.keys(technicianMetrics).map(techName => (
                        <tr key={techName} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6 text-left">{techName}</td>
                          <td className="py-3 px-6 text-center">{technicianMetrics[techName].onTimeReports}</td>
                          <td className="py-3 px-6 text-center">{technicianMetrics[techName].totalCompletedReports}</td>
                          <td className="py-3 px-6 text-center">{technicianMetrics[techName].onTimePercentage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Nuevo Dashboard de Semáforo de Plazos */}
              <motion.div
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md col-span-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-500" /> Semáforo de Plazos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    className="p-5 rounded-lg text-center shadow-md bg-green-50 border border-green-200"
                    whileHover={{ scale: 1.03 }}
                  >
                    <CheckSquare className="w-10 h-10 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-800">{deadlineStatusCounts.onTime}</p>
                    <p className="text-green-700 font-semibold">A Tiempo</p>
                  </motion.div>
                  <motion.div
                    className="p-5 rounded-lg text-center shadow-md bg-yellow-50 border border-yellow-200"
                    whileHover={{ scale: 1.03 }}
                  >
                    <Hourglass className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-yellow-800">{deadlineStatusCounts.dueSoon}</p>
                    <p className="text-yellow-700 font-semibold">Próximos a Vencer</p>
                  </motion.div>
                  <motion.div
                    className="p-5 rounded-lg text-center shadow-md bg-red-50 border border-red-200"
                    whileHover={{ scale: 1.03 }}
                  >
                    <XSquare className="w-10 h-10 text-red-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-800">{deadlineStatusCounts.overdue}</p>
                    <p className="text-red-700 font-semibold">Vencidos</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPanel;