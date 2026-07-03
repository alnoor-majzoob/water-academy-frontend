import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastContainer } from './components/layout/ToastContainer';
import type { NavItem } from './components/layout/Sidebar';

import { Dashboard } from './pages/Dashboard';
import { Workspaces } from './pages/Workspaces';
import { ImportData } from './pages/ImportData';
import { Courses } from './pages/Courses';
import { Trainers } from './pages/Trainers';
import { Venues } from './pages/Venues';
import { CalendarPage } from './pages/Calendar';
import { Assignments } from './pages/Assignments';
import { Schedule } from './pages/Schedule';
import { Conflicts } from './pages/Conflicts';
import { Unscheduled } from './pages/Unscheduled';
import { Tasks } from './pages/Tasks';
import { Export } from './pages/Export';
import { Settings } from './pages/Settings';

function AppContent() {
  const [activePage, setActivePage] = useState<NavItem>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':   return <Dashboard setActivePage={setActivePage} />;
      case 'workspaces':  return <Workspaces />;
      case 'import':      return <ImportData />;
      case 'courses':     return <Courses />;
      case 'trainers':    return <Trainers />;
      case 'venues':      return <Venues />;
      case 'calendar':    return <CalendarPage />;
      case 'assignments': return <Assignments />;
      case 'schedule':    return <Schedule />;
      case 'conflicts':   return <Conflicts />;
      case 'unscheduled': return <Unscheduled />;
      case 'tasks':       return <Tasks />;
      case 'export':      return <Export />;
      case 'settings':    return <Settings />;
      default:            return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar activePage={activePage} />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
