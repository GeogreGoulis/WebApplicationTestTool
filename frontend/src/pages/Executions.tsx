import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import '../components/Layout.css';

interface TestSuite {
  id: string;
  name: string;
}

interface Execution {
  id: string;
  test_suite_id: string;
  status: string;
  browser_type: string;
  environment_id: string;
  started_at: string;
  completed_at: string | null;
  test_suite?: TestSuite;
}

const Executions: React.FC = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    test_suite_id: '',
    browser_type: 'chrome',
    environment_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [executionsData, suitesData] = await Promise.all([
        apiService.getExecutions(),
        apiService.getTestSuites(),
      ]);
      setExecutions(executionsData);
      setTestSuites(suitesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const executionData = {
        suiteId: formData.test_suite_id,
        environmentId: formData.environment_id || 'default',
        browsers: [formData.browser_type],
        parallelCount: 1,
        triggeredBy: 'user',
        triggerSource: 'ui',
      };
      
      await apiService.createExecution(executionData);
      setShowCreateModal(false);
      setFormData({ test_suite_id: '', browser_type: 'chrome', environment_id: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create execution:', error);
      alert('Failed to create execution');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      passed: '#10b981',
      failed: '#ef4444',
      running: '#3b82f6',
      pending: '#f59e0b',
    };

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 600,
          backgroundColor: colors[status] || '#6b7280',
          color: 'white',
        }}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (started: string, completed: string | null) => {
    if (!completed) return 'Running...';
    
    const start = new Date(started).getTime();
    const end = new Date(completed).getTime();
    const duration = (end - start) / 1000;
    
    return `${duration.toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading executions...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Test Executions</h1>
        <p>View and manage test execution history</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ▶️ Run New Test
        </button>
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
          }}>
            <h2 style={{ marginTop: 0 }}>Run New Test</h2>
            <form onSubmit={handleCreateExecution}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Test Suite
                </label>
                <select
                  value={formData.test_suite_id}
                  onChange={(e) => setFormData({ ...formData, test_suite_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="">Select a test suite</option>
                  {testSuites.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Browser
                </label>
                <select
                  value={formData.browser_type}
                  onChange={(e) => setFormData({ ...formData, browser_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="chrome">Chrome</option>
                  <option value="chromium">Chromium</option>
                  <option value="firefox">Firefox</option>
                  <option value="webkit">WebKit</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Environment ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.environment_id}
                  onChange={(e) => setFormData({ ...formData, environment_id: e.target.value })}
                  placeholder="Leave empty for default"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ test_suite_id: '', browser_type: 'chrome', environment_id: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Run Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {executions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">▶️</div>
            <h3>No executions yet</h3>
            <p>Run your first test to see results here</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Test Suite</th>
                <th style={{ padding: '0.75rem' }}>Browser</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Started</th>
                <th style={{ padding: '0.75rem' }}>Duration</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((execution) => (
                <tr key={execution.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {execution.id.substring(0, 8)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {execution.test_suite?.name || 'Unknown'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {execution.browser_type}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {getStatusBadge(execution.status)}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                    {formatDate(execution.started_at)}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                    {getDuration(execution.started_at, execution.completed_at)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link to={`/executions/${execution.id}`}>
                      <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.85rem' }}>
                        View Details
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default Executions;
