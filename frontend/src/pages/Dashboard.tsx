import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import '../components/Layout.css';

interface Stats {
  totalExecutions: number;
  passedExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
}

interface Execution {
  id: string;
  test_suite_id: string;
  status: string;
  browser_type: string;
  environment_id: string;
  started_at: string;
  completed_at: string | null;
  test_suite?: {
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalExecutions: 0,
    passedExecutions: 0,
    failedExecutions: 0,
    runningExecutions: 0,
  });
  const [recentExecutions, setRecentExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const executions = await apiService.getExecutions();

      // Calculate stats
      const total = executions.length;
      const passed = executions.filter((e: Execution) => e.status === 'passed').length;
      const failed = executions.filter((e: Execution) => e.status === 'failed').length;
      const running = executions.filter((e: Execution) => 
        e.status === 'running' || e.status === 'pending'
      ).length;

      setStats({
        totalExecutions: total,
        passedExecutions: passed,
        failedExecutions: failed,
        runningExecutions: running,
      });

      setRecentExecutions(executions.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your test executions</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Executions</div>
          <div className="stat-value">{stats.totalExecutions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {stats.passedExecutions}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {stats.failedExecutions}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Running</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {stats.runningExecutions}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Executions</h2>
        {recentExecutions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No executions yet</h3>
            <p>Create a test suite and run your first test</p>
            <Link to="/suites">
              <button className="btn btn-primary">Create Test Suite</button>
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Test Suite</th>
                <th style={{ padding: '0.75rem' }}>Browser</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Started At</th>
              </tr>
            </thead>
            <tbody>
              {recentExecutions.map((execution) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link to="/suites">
          <button className="btn btn-primary">Manage Test Suites</button>
        </Link>
        <Link to="/executions">
          <button className="btn btn-secondary">View All Executions</button>
        </Link>
      </div>
    </Layout>
  );
};

export default Dashboard;
