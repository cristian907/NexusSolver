import { useState } from 'react';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import type { TabName } from './components/TabBar';
import { TransportTab } from './features/transportSolver/components/TransportTab';
import { AssignmentTab } from './features/assignmentSolver/components/AssignmentTab';
import { AITab } from './features/aiAnalizer/components/AITab';
import { useTransportSolver } from './features/transportSolver/hooks/useTransportSolver';
import { useAssignmentSolver } from './features/assignmentSolver/hooks/useAssignmentSolver';
import { useAIAnalyzer } from './features/aiAnalizer/hooks/useAIAnalyzer';

import './styles/results.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabName>('transport');

  const transportSolver = useTransportSolver();
  const assignmentSolver = useAssignmentSolver();
  const aiAnalyzer = useAIAnalyzer();

  const transportStatus = transportSolver.phase === 'splash'
    ? 'no iniciado' as const
    : transportSolver.result ? 'resuelto' as const : 'activo' as const;

  const assignmentStatus = assignmentSolver.phase === 'splash'
    ? 'no iniciado' as const
    : assignmentSolver.result ? 'resuelto' as const : 'activo' as const;

  return (
    <>
      <Header />
      <main style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 32px 80px',
      }}>
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          transportStatus={transportStatus}
          assignmentStatus={assignmentStatus}
        />
        {activeTab === 'transport' && <TransportTab solver={transportSolver} />}
        {activeTab === 'assignment' && <AssignmentTab solver={assignmentSolver} />}
        {activeTab === 'ai' && (
          <AITab
            analyzer={aiAnalyzer}
            transportSolver={transportSolver}
            assignmentSolver={assignmentSolver}
          />
        )}
      </main>
    </>
  );
}

export default App;
