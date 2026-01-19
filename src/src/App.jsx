import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList 
} from 'recharts';
import { 
  Calendar, Users, Building, Clock, FileSpreadsheet, Filter, AlertTriangle, BookOpen, UserCheck, Loader2, 
  LayoutDashboard, ChevronDown, CheckSquare, Square, X, UploadCloud, ArrowRight, List, TableProperties 
} from 'lucide-react';

// --- COLORES E IDENTIDAD VISUAL ---
const COLORS = {
  primary: '#2563eb', // Azul Royal
  secondary: '#64748b', // Slate
  success: '#10b981', // Esmeralda
  warning: '#f59e0b', // Ambar
  danger: '#ef4444', // Rojo
  bg: '#f8fafc', // Fondo muy claro
  shifts: {
    'Mañana': '#fbbf24', // Amber 400
    'Tarde': '#F97316',   // Orange 500
    'Noche': '#1e3a8a',   // Blue 900
    'Sin Turno': '#cbd5e1' // Slate 300
  }
};

// --- DATOS DE EJEMPLO ACTUALIZADOS ---
const MOCK_DATA = [
  { Codigo: '009', Nombre: 'VIRTUAL: DICIEMBRE/NOCHE/L-M/6-9/JAKELIN', Estudiantes: 12, Cupo: 50, Inicio: '2025-12-15', Fin: '2026-01-07', SedeOriginal: 'VIRTUAL - I_25-27', Asignatura: 'TALLER - GESTIÓN DE NEGOCIOS', TurnoOriginal: 'YATACO PRINCIPAL - Noche', Horario: '001 - AULA VIRTUAL lu, mi 6-9pm' },
  { Codigo: '002', Nombre: 'VES: SETIEMBRE/ MAQUILLAJE / M y J / NOCHE / AZUCENA', Estudiantes: 12, Cupo: 12, Inicio: '2025-09-16', Fin: '2026-03-17', SedeOriginal: 'VES - I_23-26', Asignatura: 'MAQUILLAJE', TurnoOriginal: 'YATACO PRINCIPAL - Noche', Horario: '001 - VES A-206 ju, ma 6-9pm' },
  { Codigo: '003', Nombre: 'VES: SETIEMBRE / UÑAS / M y J / NOCHE / MILAGROS', Estudiantes: 9, Cupo: 12, Inicio: '2025-09-18', Fin: '2026-03-26', SedeOriginal: 'VES - I_23-26', Asignatura: 'SISTEMA DE UÑAS', TurnoOriginal: 'YATACO PRINCIPAL - Noche', Horario: '001 - VES A-205 ju, ma 6-9pm' },
  { Codigo: '02', Nombre: 'CHORRILLOS/NOVIEMBRE2025/MAQUILLAJE...', Estudiantes: 11, Cupo: 13, Inicio: '2025-11-13', Fin: '2026-05-28', SedeOriginal: 'CHORRILLOS - I_25-26', Asignatura: 'MAQUILLAJE', TurnoOriginal: 'YATACO PRINCIPAL - Mañana', Horario: '001 - CHORRILLOS A-203 ju, ma 10 am-1pm' },
  { Codigo: '013', Nombre: 'CHORRILLOS/NOVIEMBRE2025/DISEÑO DE MIRADA...', Estudiantes: 11, Cupo: 13, Inicio: '2025-11-27', Fin: '2026-02-24', SedeOriginal: 'CHORRILLOS - I_25-26', Asignatura: 'DISEÑO DE MIRADA', TurnoOriginal: 'YATACO PRINCIPAL - Tarde', Horario: '001 - CHORRILLOS A-202 ju, ma 3-6pm' },
  { Codigo: '05', Nombre: 'CHORRILLOS/NOVIEMBRE2025/CIENCIA Y QUIMICA...', Estudiantes: 4, Cupo: 10, Inicio: '2025-11-28', Fin: '2026-03-01', SedeOriginal: 'CHORRILLOS - I_25-26', Asignatura: 'CIENCIA Y QUIMICA CAPILAR', TurnoOriginal: 'YATACO PRINCIPAL - Tarde', Horario: '001 - CHORRILLOS A-TALLER vi 9am-6pm' },
];

// --- PARSER CSV ROBUSTO ---
const parseCSV = (text) => {
  const lines = text.split('\n');
  const result = [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const obj = {};
    let currentLine = lines[i];
    
    const matches = currentLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < currentLine.length; j++) {
      const char = currentLine[j];
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(currentValue); currentValue = ''; }
      else { currentValue += char; }
    }
    values.push(currentValue);

    headers.forEach((header, index) => {
      let val = values[index] ? values[index].trim() : '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
      obj[header] = val;
    });

    if (Object.keys(obj).length > 0) result.push(obj);
  }
  return result;
};

// --- UTILIDADES ---
const getMonthName = (monthNumber) => {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return months[parseInt(monthNumber, 10) - 1] || "Mes Desconocido";
};

// --- COMPONENTE: SELECTOR MULTIPLE DE SEDES ---
const SedeMultiSelect = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-sm font-bold hover:border-blue-500 hover:text-blue-600 transition-colors shadow-sm"
      >
        <Filter size={14} className="text-slate-400" />
        <span>Sedes ({selected.length})</span>
        <ChevronDown size={14} className={`transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
          <div 
            onClick={toggleAll}
            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-100 mb-1"
          >
            {selected.length === options.length && options.length > 0 ? 
              <CheckSquare size={16} className="text-blue-600" /> : 
              <Square size={16} className="text-slate-300" />
            }
            <span className="text-sm font-bold text-slate-700">Seleccionar Todas</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {options.map(option => (
              <div 
                key={option}
                onClick={() => toggleOption(option)}
                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
              >
                {selected.includes(option) ? 
                  <CheckSquare size={16} className="text-blue-600" /> : 
                  <Square size={16} className="text-slate-300" />
                }
                <span className="text-sm text-slate-600 truncate">{option}</span>
              </div>
            ))}
            {options.length === 0 && (
              <div className="p-2 text-xs text-slate-400 text-center">No hay sedes disponibles</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE: PANTALLA DE CARGA (LANDING) ---
const LandingScreen = ({ onUpload, onDemo, isExcelReady }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Building className="text-white" size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Panel Académico</h1>
          <p className="text-blue-100">Gestión inteligente de sedes, turnos y programaciones</p>
        </div>
        
        <div className="p-8">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group relative">
             <input 
               type="file" 
               accept=".csv, .xlsx, .xls" 
               onChange={onUpload}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               disabled={!isExcelReady}
             />
             <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
               {isExcelReady ? <UploadCloud size={32} /> : <Loader2 size={32} className="animate-spin" />}
             </div>
             <h3 className="text-lg font-bold text-slate-700 mb-2">
               {isExcelReady ? 'Sube tu base de datos' : 'Cargando lector...'}
             </h3>
             <p className="text-slate-500 text-sm max-w-xs mx-auto">
               Soporta archivos Excel (.xlsx) y CSV. Detecta automáticamente la estructura de tus datos.
             </p>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <FileSpreadsheet size={16} />
              <span>Compatible con tu último formato</span>
            </div>
            <button 
              onClick={onDemo}
              className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition-colors text-sm"
            >
              Ver datos de prueba <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <p className="mt-6 text-slate-400 text-xs">© 2026 Sistema de Gestión Académica</p>
    </div>
  );
};

// --- COMPONENTE: DASHBOARD GENERAL ---
const GeneralDashboard = ({ allData, groupedData }) => {
  const totalStudents = allData.reduce((acc, curr) => acc + curr.estudiantes, 0);
  const totalCapacity = allData.reduce((acc, curr) => acc + curr.cupo, 0);
  const occupancyRate = totalCapacity > 0 ? ((totalStudents / totalCapacity) * 100).toFixed(1) : 0;
  
  const sedeChartData = Object.keys(groupedData).map(sede => ({
    name: sede,
    Estudiantes: groupedData[sede].reduce((acc, c) => acc + c.estudiantes, 0),
    Cupo: groupedData[sede].reduce((acc, c) => acc + c.cupo, 0)
  })).sort((a, b) => b.Estudiantes - a.Estudiantes);

  const turnoGlobalStats = allData.reduce((acc, curr) => {
    acc[curr.turno] = (acc[curr.turno] || 0) + curr.estudiantes; 
    return acc;
  }, {});
  
  const pieData = Object.keys(turnoGlobalStats).map(key => ({
    name: key,
    value: turnoGlobalStats[key]
  })).filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <LayoutDashboard className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-slate-800">Resumen General de la Academia</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="grid grid-cols-1 gap-4">
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Estudiantes</p>
                <p className="text-3xl font-bold text-slate-800">{totalStudents}</p>
              </div>
              <Users className="text-blue-300" size={32} />
           </div>
           
           <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase mb-1">Ocupación Global</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-800">{occupancyRate}%</p>
                  <span className="text-xs text-green-700">de capacidad</span>
                </div>
              </div>
              <UserCheck className="text-green-300" size={32} />
           </div>

           <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase mb-1">Cursos Activos</p>
                <p className="text-3xl font-bold text-slate-800">{allData.length}</p>
              </div>
              <BookOpen className="text-purple-300" size={32} />
           </div>
        </div>

        <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
           <h3 className="text-sm font-bold text-slate-600 mb-4 text-center">Alumnos por Sede</h3>
           <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={sedeChartData} layout="vertical" margin={{top: 5, right: 45, left: 40, bottom: 5}}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                 <XAxis type="number" hide />
                 <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 10}} />
                 <RechartsTooltip contentStyle={{fontSize: '12px'}} />
                 <Bar dataKey="Estudiantes" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="Estudiantes" position="right" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-600 mb-2">Preferencia de Turnos</h3>
            <div className="h-40 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.shifts[entry.name] || COLORS.secondary} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend iconSize={8} wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] text-center pointer-events-none">
                 <span className="text-lg font-bold text-slate-700">{totalStudents}</span>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTE: MÓDULO DE SEDE ---
const SedeDashboard = ({ sedeName, courses }) => {
  const [viewMode, setViewMode] = useState('detalle'); // 'detalle' | 'resumen'

  const totalStudents = courses.reduce((acc, c) => acc + c.estudiantes, 0);
  const totalCapacity = courses.reduce((acc, c) => acc + c.cupo, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
  
  // --- CÁLCULOS AGREGADOS POR ASIGNATURA ---
  const subjectSummary = useMemo(() => {
    const summary = {};
    courses.forEach(c => {
      const name = c.asignatura;
      if (!summary[name]) {
        summary[name] = { 
          name: name, 
          count: 0, 
          students: 0,
          turnos: new Set()
        };
      }
      summary[name].count += 1;
      summary[name].students += c.estudiantes;
      summary[name].turnos.add(c.turno);
    });
    return Object.values(summary).sort((a, b) => b.students - a.students);
  }, [courses]);

  const uniqueCoursesCount = subjectSummary.length;
  const repeatedCoursesCount = subjectSummary.filter(s => s.count > 1).length;

  const turnoData = useMemo(() => {
    const counts = { 'Mañana': 0, 'Tarde': 0, 'Noche': 0, 'Sin Turno': 0 };
    courses.forEach(c => {
      if (counts[c.turno] !== undefined) counts[c.turno]++;
      else counts['Sin Turno']++;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .filter(item => item.value > 0);
  }, [courses]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300">
      <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-100 flex justify-between items-start">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building className="text-blue-600" size={20} />
                {sedeName}
             </h2>
             <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${occupancyRate >= 90 ? 'border-red-500 text-red-600 bg-red-50' : 'border-green-500 text-green-600 bg-green-50'}`}>
                {occupancyRate}% Ocupado
             </div>
          </div>
          
          {/* MINI RESUMEN HEADER */}
          <div className="flex gap-4 text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">
             <div className="flex flex-col">
                <span className="font-bold text-slate-700 text-sm">{courses.length}</span>
                <span className="text-[10px] uppercase">Grupos</span>
             </div>
             <div className="flex flex-col border-l border-slate-200 pl-4">
                <span className="font-bold text-slate-700 text-sm">{uniqueCoursesCount}</span>
                <span className="text-[10px] uppercase">Únicos</span>
             </div>
             <div className="flex flex-col border-l border-slate-200 pl-4">
                <span className="font-bold text-slate-700 text-sm">{repeatedCoursesCount}</span>
                <span className="text-[10px] uppercase text-orange-500">Repetidos</span>
             </div>
             <div className="flex flex-col border-l border-slate-200 pl-4 ml-auto text-right">
                <span className="font-bold text-blue-600 text-sm">{totalStudents}</span>
                <span className="text-[10px] uppercase">Total Alumnos</span>
             </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        
        {/* SWITCHER VISTA */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button 
             onClick={() => setViewMode('detalle')}
             className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'detalle' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <List size={14} /> Detalle Programación
           </button>
           <button 
             onClick={() => setViewMode('resumen')}
             className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'resumen' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <TableProperties size={14} /> Resumen Asignaturas
           </button>
        </div>

        {viewMode === 'detalle' ? (
          <>
            <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-3">
              <div className="w-20 h-20 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={turnoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={10}
                      outerRadius={30}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {turnoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.shifts[entry.name] || COLORS.secondary} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{fontSize: '12px', padding: '4px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex-grow grid grid-cols-2 gap-y-1 gap-x-2 text-[10px]">
                {turnoData.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.shifts[t.name] }}></div>
                    <span className="text-slate-600 font-medium">{t.name}: <span className="font-bold">{t.value}</span></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-lg">
              <div className="bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                <span>Horarios & Programación</span>
                <span>Ocupación</span>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="text-xs divide-y divide-slate-50">
                    {courses.map((course, idx) => (
                      <tr key={idx} className="group hover:bg-blue-50/40 transition-colors">
                        <td className="p-3 align-top">
                          <div className="font-semibold text-slate-700 mb-1 line-clamp-2" title={course.asignatura}>{course.asignatura}</div>
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase border ${
                              course.turno === 'Mañana' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              course.turno === 'Tarde' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              course.turno === 'Noche' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {course.turno}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                              <Clock size={10} /> {course.horario}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {course.fechaInicio} <span className="mx-1">→</span> {course.fechaFin}
                          </div>
                        </td>
                        <td className="p-3 w-20 align-top text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-slate-700">{course.estudiantes}</span>
                            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${course.estudiantes >= course.cupo ? 'bg-red-500' : 'bg-blue-600'}`} 
                                style={{width: `${Math.min((course.estudiantes/course.cupo)*100, 100)}%`}}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="overflow-hidden border border-slate-100 rounded-lg h-[300px] flex flex-col">
            <div className="bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
               <span className="col-span-8">Asignatura</span>
               <span className="col-span-2 text-center">Grupos</span>
               <span className="col-span-2 text-right">Alumnos</span>
            </div>
            <div className="flex-grow overflow-y-auto">
               <table className="w-full text-left border-collapse">
                 <tbody className="text-xs divide-y divide-slate-50">
                    {subjectSummary.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-3 col-span-8 align-middle">
                           <div className="font-semibold text-slate-700 line-clamp-2" title={sub.name}>{sub.name}</div>
                           <div className="flex gap-1 mt-1">
                              {Array.from(sub.turnos).map(t => (
                                <span key={t} className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">{t}</span>
                              ))}
                           </div>
                        </td>
                        <td className="p-3 col-span-2 text-center align-middle">
                           <span className={`px-2 py-0.5 rounded-full font-bold ${sub.count > 1 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                             {sub.count}
                           </span>
                        </td>
                        <td className="p-3 col-span-2 text-right align-middle">
                           <span className="font-bold text-blue-600 text-sm">{sub.students}</span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const DashboardCursos = () => {
  const [rawData, setRawData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("Todos");
  const [selectedSedes, setSelectedSedes] = useState([]); // Filtro de Sedes
  const [viewMode, setViewMode] = useState('landing');
  const [isExcelLibReady, setIsExcelLibReady] = useState(false);

  // --- CARGA DINÁMICA DE LIBRERÍA EXCEL (SheetJS) ---
  useEffect(() => {
    if (window.XLSX) {
      setIsExcelLibReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setIsExcelLibReady(true);
    document.body.appendChild(script);
  }, []);

  // --- PROCESAMIENTO DE DATOS ---
  const processRow = (row) => {
    const getVal = (key) => row[key] || row[Object.keys(row).find(k => k.trim() === key)] || '';
    
    // DETECCIÓN INTELIGENTE DE SEDE
    const sedeRaw = getVal('SEDE') || getVal('SedeOriginal') || getVal('Período') || '';
    const sede = sedeRaw.split('-')[0].trim();

    const turnoRaw = getVal('Sede - turno') || getVal('TurnoOriginal') || '';
    let turno = 'Sin Turno';
    const lowerTurno = turnoRaw.toLowerCase();
    if (lowerTurno.includes('mañana')) turno = 'Mañana';
    else if (lowerTurno.includes('tarde')) turno = 'Tarde';
    else if (lowerTurno.includes('noche')) turno = 'Noche';

    let fechaInicio = getVal('Fecha inicio') || getVal('Inicio');
    if (typeof fechaInicio === 'number') {
        const date = new Date(Math.round((fechaInicio - 25569)*86400*1000));
        fechaInicio = date.toISOString().split('T')[0];
    }
    let fechaFin = getVal('Fecha fin') || getVal('Fin');
    if (typeof fechaFin === 'number') {
        const date = new Date(Math.round((fechaFin - 25569)*86400*1000));
        fechaFin = date.toISOString().split('T')[0];
    }

    const dateObj = new Date(fechaInicio);
    const year = !isNaN(dateObj.getFullYear()) ? dateObj.getFullYear().toString() : 'N/A';
    const month = !isNaN(dateObj.getMonth()) ? (dateObj.getMonth() + 1).toString().padStart(2, '0') : 'N/A';
    
    const periodKey = (year !== 'N/A' && month !== 'N/A') ? `${year}-${month}` : 'N/A';

    let horario = getVal('Horario semanal') || getVal('Horario') || 'Por definir';
    if (horario.includes(' - ')) {
       const parts = horario.split(' - ');
       if (parts.length > 1) {
          horario = parts.slice(1).join(' - ');
       }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      asignatura: getVal('Asignatura') || getVal('Nombre') || 'Asignatura Desconocida',
      estudiantes: parseInt(getVal('Estudiantes') || 0),
      cupo: parseInt(getVal('Cupo máximo') || getVal('Cupo') || 0),
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      sede: sede || 'Sin Sede',
      turno: turno,
      horario: horario,
      year: year,
      month: month,
      periodKey: periodKey,
      docente: getVal('Docente') || 'Sin Docente'
    };
  };

  const initData = (data) => {
    const processed = data.map(processRow).filter(i => i.sede !== 'Sin Sede' && i.asignatura !== 'Asignatura Desconocida');
    setRawData(processed);
    
    // Al cargar datos nuevos, seleccionar todas las sedes por defecto
    const allSedes = [...new Set(processed.map(d => d.sede))].sort();
    setSelectedSedes(allSedes);
    
    setViewMode('dashboard');
  };

  const handleDemo = () => initData(MOCK_DATA);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        if (!isExcelLibReady) return alert("Cargando lector Excel...");
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = window.XLSX.read(e.target.result, { type: 'binary' });
                const jsonData = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                initData(jsonData);
            } catch (err) { alert("Error al leer Excel"); }
        };
        reader.readAsBinaryString(file);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = parseCSV(e.target.result);
                initData(parsed);
            } catch (err) { alert('Error al leer CSV'); }
        };
        reader.readAsText(file);
    }
  };

  // --- LÓGICA DE FILTRADO Y AGRUPACIÓN ---
  
  // 1. Filtrar por Periodo
  const timeFilteredData = useMemo(() => {
    if (selectedPeriod === 'Todos') return rawData;
    return rawData.filter(item => item.periodKey === selectedPeriod);
  }, [rawData, selectedPeriod]);

  // 2. Filtrar por Sedes Seleccionadas (Nuevo)
  const finalFilteredData = useMemo(() => {
    return timeFilteredData.filter(item => selectedSedes.includes(item.sede));
  }, [timeFilteredData, selectedSedes]);

  // 3. Agrupar por Sede
  const groupedData = useMemo(() => {
    const groups = {};
    finalFilteredData.forEach(item => {
      if (!groups[item.sede]) groups[item.sede] = [];
      groups[item.sede].push(item);
    });
    return Object.keys(groups).sort().reduce((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {});
  }, [finalFilteredData]);

  const uniquePeriods = useMemo(() => {
    const periods = new Set();
    rawData.forEach(d => {
      if (d.periodKey !== 'N/A') periods.add(d.periodKey);
    });
    return Array.from(periods).sort().reverse().map(p => {
      const [y, m] = p.split('-');
      return { value: p, label: `${getMonthName(m)} ${y}` };
    });
  }, [rawData]);

  // Obtener todas las sedes posibles dentro de los datos (independiente del periodo para mantener consistencia en UX)
  const allSedeOptions = useMemo(() => {
    return [...new Set(rawData.map(d => d.sede))].sort();
  }, [rawData]);

  const totalGlobalStudents = finalFilteredData.reduce((acc, curr) => acc + curr.estudiantes, 0);
  const totalGlobalCourses = finalFilteredData.length;

  if (viewMode === 'landing') {
    return (
      <LandingScreen 
        onUpload={handleFileUpload} 
        onDemo={handleDemo} 
        isExcelReady={isExcelLibReady} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 font-sans animate-in fade-in duration-300">
      
      {/* NAVBAR SUPERIOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-blue-200 shadow-lg cursor-pointer" onClick={() => setViewMode('landing')}>
                <Building size={24} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-800 tracking-tight">Panel Académico</h1>
               <div className="flex gap-4 text-xs font-medium text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-blue-500"/> {totalGlobalStudents} Estudiantes</span>
                  <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-blue-500"/> {totalGlobalCourses} Cursos</span>
               </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
             
             {/* Filtro Periodo */}
             <div className="flex items-center px-3 border-r border-slate-300/50">
               <Calendar size={14} className="text-slate-400 mr-2" />
               <span className="text-[10px] uppercase font-bold text-slate-400 mr-2 tracking-wide">Periodo</span>
               <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer hover:text-blue-600 min-w-[140px]"
               >
                 <option value="Todos">Histórico Completo</option>
                 {uniquePeriods.map(p => (
                   <option key={p.value} value={p.value}>{p.label}</option>
                 ))}
               </select>
             </div>

             {/* Filtro Sedes (NUEVO) */}
             <div className="px-2">
                <SedeMultiSelect 
                  options={allSedeOptions} 
                  selected={selectedSedes} 
                  onChange={setSelectedSedes} 
                />
             </div>

             {/* Botón Upload */}
             <label className="ml-2 bg-white hover:bg-white text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-md shadow-sm border border-slate-200 cursor-pointer transition-all flex items-center gap-2 text-sm font-semibold group">
               {isExcelLibReady ? (
                 <FileSpreadsheet size={16} className="text-green-600 group-hover:scale-110 transition-transform" />
               ) : (
                 <Loader2 size={16} className="text-gray-400 animate-spin" />
               )}
               <span className="hidden sm:inline">Nueva Carga</span>
               <input 
                 type="file" 
                 accept=".csv, .xlsx, .xls" 
                 onChange={handleFileUpload} 
                 className="hidden" 
                 disabled={!isExcelLibReady}
               />
             </label>
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* MODULO 1: DASHBOARD GENERAL */}
        {finalFilteredData.length > 0 && (
          <GeneralDashboard 
             allData={finalFilteredData} 
             groupedData={groupedData} 
          />
        )}

        {/* MODULO 2: GRID DE SEDES */}
        {Object.keys(groupedData).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {Object.entries(groupedData).map(([sedeName, courses]) => (
              <SedeDashboard 
                key={sedeName} 
                sedeName={sedeName} 
                courses={courses} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
               <AlertTriangle size={32} className="text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600">No hay datos visibles</h3>
            <p className="text-sm max-w-xs text-center mt-2">
              {selectedSedes.length === 0 
                ? "Selecciona al menos una sede en el filtro." 
                : "No hay cursos para las sedes seleccionadas en este periodo."
              }
            </p>
          </div>
        )}
      </main>

    </div>
  );
};

export default DashboardCursos;
