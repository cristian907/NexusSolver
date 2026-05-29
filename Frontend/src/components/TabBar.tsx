import '../styles/tabs.css';

export type TabName = 'transport' | 'assignment' | 'ai';
export type TabStatus = 'no iniciado' | 'activo' | 'resuelto';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  transportStatus: TabStatus;
  assignmentStatus: TabStatus;
}

function statusBadgeClass(status: TabStatus) {
  return status === 'no iniciado' ? 'pending' : 'solved';
}

export function TabBar({ activeTab, onTabChange, transportStatus, assignmentStatus }: TabBarProps) {
  return (
    <div className="tab-bar">
      <button
        className={`tab ${activeTab === 'transport' ? 'active' : ''}`}
        onClick={() => onTabChange('transport')}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        Transporte
        <span className={`tab-badge ${statusBadgeClass(transportStatus)}`}>{transportStatus}</span>
      </button>
      <button
        className={`tab ${activeTab === 'assignment' ? 'active' : ''}`}
        onClick={() => onTabChange('assignment')}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Asignación
        <span className={`tab-badge ${statusBadgeClass(assignmentStatus)}`}>{assignmentStatus}</span>
      </button>
      <button
        className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
        onClick={() => onTabChange('ai')}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Análisis IA
        <span className="tab-badge ai">groq / llama3</span>
      </button>
    </div>
  );
}
