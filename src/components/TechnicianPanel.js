import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Wrench, CheckCircle, XCircle, Clock, Building, User, Phone, Info, Calendar, Tag, MessageSquare, LogOut, AlertTriangle, DollarSign, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { showInAppNotification } from '../utils/notificationService'; // Importa la función de notificación

const TechnicianPanel = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Pendiente');
  const [loggedInUsername, setLoggedInUsername] = useState(''); // Estado para el nombre de usuario logueado
  const [showWorkLogForm, setShowWorkLogForm] = useState(null);
  const [workLogData, setWorkLogData] = useState({
    description: '',
    date: '',
    time: '',
    cost: ''
  });
  const [delayJustification, setDelayJustification] = useState(''); // Nuevo estado para la justificación

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


  useEffect(() => {
    if (!loggedInUsername) return; // No hacer nada si no hay técnico logueado

    // Escucha cambios en tiempo real en la colección 'reports'
    const q = query(collection(db, "reports"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReports = [];
      querySnapshot.forEach((doc) => {
        fetchedReports.push({ ...doc.data(), docId: doc.id }); // Guarda el doc.id para futuras actualizaciones
      });
      // Filtra los reportes para el técnico logueado (asignados a él o sin asignar)
      const technicianReports = fetchedReports.filter(report => 
        report.assignedTo === loggedInUsername || report.assignedTo === null
      );
      setReports(technicianReports);
    }, (error) => {
      console.error("Error al obtener reportes en tiempo real: ", error);
      // Aquí podrías mostrar un mensaje al usuario
    });

    // Limpia el listener cuando el componente se desmonta
    return () => unsubscribe();
  }, [loggedInUsername]); // Se ejecuta una vez al montar y si cambia el técnico logueado

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'Todos') return true;
    return report.status === filterStatus;
  });

  // Función para calcular la fecha límite
  const calculateDeadline = (assignedDate, zone) => {
    let daysToAdd = 0;
    switch (zone) {
      case 'Cancun':
      case 'Puerto Morelos':
        daysToAdd = 7;
        break;
      case 'Playa del Carmen':
      case 'Puerto Aventuras':
        daysToAdd = 2; // 48 horas = 2 días hábiles
        break;
      case 'Tulum':
        daysToAdd = 3;
        break;
      case 'Otro': // Nuevo caso para la zona "Otro"
        daysToAdd = 10; // 10 días hábiles
        break;
      default:
        return null; // Para zonas no definidas
    }

    let currentDate = new Date(assignedDate);
    let addedDays = 0;

    while (addedDays < daysToAdd) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 6 = Sábado
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Si no es sábado ni domingo
        addedDays++;
      }
    }
    return currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
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


  const handleStatusChange = async (reportDocId, newStatus) => {
    try {
      const reportRef = doc(db, "reports", reportDocId);
      const updateData = { status: newStatus };
      const currentReport = reports.find(r => r.docId === reportDocId);

      // Si el estado cambia a "En Proceso" y no está asignado, asignarlo al técnico actual y registrar assignedAt
      if (newStatus === 'En Proceso' && !currentReport.assignedTo) {
        const assignedAt = new Date().toISOString();
        const deadline = calculateDeadline(assignedAt, currentReport.zone);

        updateData.assignedTo = loggedInUsername;
        updateData.assignedAt = assignedAt;
        if (deadline) {
          updateData.deadline = deadline;
        }
        showInAppNotification(`¡Has tomado el reporte ${currentReport.id}! Fecha límite: ${deadline || 'N/A'}`, 'success'); // Notificación
      }
      // Si se marca como completado, registra la hora de completado
      else if (newStatus === 'Completado') {
        updateData.completedAt = new Date().toISOString();
        // Si está vencido al completarse, pide justificación
        if (currentReport.deadline && new Date(updateData.completedAt) > new Date(currentReport.deadline)) {
          if (!delayJustification.trim()) {
            alert("Este reporte está vencido. Por favor, justifica el retraso antes de marcarlo como completado.");
            return; // Detiene la actualización si no hay justificación
          }
          updateData.delayJustification = delayJustification.trim();
        } else {
          updateData.delayJustification = null; // Limpia justificación si se completa a tiempo
        }
        showInAppNotification(`¡Reporte ${currentReport.id} completado!`, 'success'); // Notificación
      } else {
        // Si cambia de completado a otro estado, limpia completedAt y deadline
        updateData.completedAt = null;
        updateData.delayJustification = null; // Limpia justificación si el estado no es completado
      }

      await updateDoc(reportRef, updateData);
      console.log(`Reporte ${reportDocId} actualizado a estado: ${newStatus}`);
      setDelayJustification(''); // Limpiar el estado de justificación
    } catch (e) {
      console.error("Error al actualizar el estado del reporte: ", e);
      alert("No se pudo actualizar el estado. ¡Firebase está de malas!");
    }
  };

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

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión? ¡La "chamba" no se arregla sola!')) {
      localStorage.removeItem('loggedInTechnician'); // Limpiar el usuario logueado
      navigate('/');
    }
  };

  const handleWorkLogChange = (e) => {
    const { name, value } = e.target;
    setWorkLogData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkLogSubmit = async (e, reportDocId) => {
    e.preventDefault();
    try {
      const reportRef = doc(db, "reports", reportDocId);
      // Obtener el documento actual para no sobrescribir el workLog
      const currentReportDoc = await getDoc(reportRef);
      const currentWorkLog = currentReportDoc.data().workLog || [];

      await updateDoc(reportRef, {
        workLog: [...currentWorkLog, { ...workLogData, cost: parseFloat(workLogData.cost) || 0 }]
      });
      console.log(`Registro de trabajo añadido al reporte ${reportDocId}`);
      showInAppNotification(`Registro de trabajo añadido al reporte ${reportDocId}`, 'info'); // Notificación
      setWorkLogData({ description: '', date: '', time: '', cost: '' });
      setShowWorkLogForm(null); // Cierra el formulario
    } catch (e) {
      console.error("Error al añadir registro de trabajo: ", e);
      alert("No se pudo guardar el registro de trabajo. ¡Firebase se puso rebelde!");
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl p-8 shadow-2xl max-w-5xl mx-auto my-8 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <Wrench className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Panel del Técnico
          </h2>
          <p className="text-gray-600 text-lg">
            ¡Bienvenido, <span className="text-blue-600 font-bold">{loggedInUsername}</span>! Aquí está toda la "chamba" que tienes que hacer. ¡A darle!
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

      <div className="mb-6 flex justify-center space-x-4">
        {['Pendiente', 'En Proceso', 'Completado', 'No Reparado'].map(status => (
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
            {status} ({reports.filter(r => r.status === status).length})
          </motion.button>
        ))}
      </div>

      <div className="space-y-6">
        <AnimatePresence>
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

                <div className="flex justify-end space-x-3 mt-4">
                  {report.status !== 'Completado' && report.status !== 'No Reparado' && (
                    <motion.button
                      onClick={() => handleStatusChange(report.docId, 'Completado')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Completado
                    </motion.button>
                  )}
                  {report.status === 'Pendiente' && (
                    <motion.button
                      onClick={() => handleStatusChange(report.docId, 'En Proceso')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Marcar En Proceso
                    </motion.button>
                  )}
                  {report.status === 'En Proceso' && (
                    <motion.button
                      onClick={() => handleStatusChange(report.docId, 'Pendiente')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Marcar Pendiente
                    </motion.button>
                  )}
                  {report.status !== 'No Reparado' && report.status !== 'Completado' && (
                    <motion.button
                      onClick={() => handleStatusChange(report.docId, 'No Reparado')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      No Reparado
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setShowWorkLogForm(report.docId)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Registrar Trabajo
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showWorkLogForm === report.docId && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={(e) => handleWorkLogSubmit(e, report.docId)}
                      className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4"
                    >
                      <h4 className="text-lg font-bold text-blue-800 flex items-center"><FileText className="w-5 h-5 mr-2" /> Registrar Trabajo Realizado</h4>
                      <div>
                        <label htmlFor={`description-${report.docId}`} className="block text-sm font-medium text-gray-700">Descripción del Trabajo:</label>
                        <textarea
                          id={`description-${report.docId}`}
                          name="description"
                          value={workLogData.description}
                          onChange={handleWorkLogChange}
                          rows="3"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Detalles de la reparación, piezas usadas, etc."
                          required
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor={`date-${report.docId}`} className="block text-sm font-medium text-gray-700">Fecha:</label>
                          <input
                            type="date"
                            id={`date-${report.docId}`}
                            name="date"
                            value={workLogData.date}
                            onChange={handleWorkLogChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor={`time-${report.docId}`} className="block text-sm font-medium text-gray-700">Hora:</label>
                          <input
                            type="time"
                            id={`time-${report.docId}`}
                            name="time"
                            value={workLogData.time}
                            onChange={handleWorkLogChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor={`cost-${report.docId}`} className="block text-sm font-medium text-gray-700">Costo ($):</label>
                          <input
                            type="number"
                            id={`cost-${report.docId}`}
                            name="cost"
                            value={workLogData.cost}
                            onChange={handleWorkLogChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                      </div>
                      {report.deadline && new Date() > new Date(report.deadline) && report.status !== 'Completado' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <label htmlFor={`delayJustification-${report.docId}`} className="block text-sm font-medium text-red-800">
                            <AlertTriangle className="inline-block w-4 h-4 mr-2" />
                            Justificación del Retraso:
                          </label>
                          <textarea
                            id={`delayJustification-${report.docId}`}
                            name="delayJustification"
                            value={delayJustification}
                            onChange={(e) => setDelayJustification(e.target.value)}
                            rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-red-900"
                            placeholder="Explica por qué el reporte se completó después del plazo."
                            required
                          ></textarea>
                        </motion.div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <motion.button
                          type="button"
                          onClick={() => setShowWorkLogForm(null)}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Cancelar
                        </motion.button>
                        <motion.button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Guardar Registro
                        </motion.button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-gray-600 text-lg"
            >
              <p>¡Felicidades! No hay "chamba" pendiente en esta categoría. Ve a tomar un café... si tu cafetera funciona.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TechnicianPanel;