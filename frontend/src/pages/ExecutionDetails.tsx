import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import { useExecutionStream } from '../hooks/useExecutionStream';
import axios from 'axios';
import '../components/Layout.css';

interface ExecutionDetails {
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

interface TestResult {
  id: string;
  test_name: string;
  status: string;
  duration_ms: number;
  error_message: string | null;
}

interface Artifact {
  id: string;
  artifact_type: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

const ExecutionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time updates
  const { isConnected, lastUpdate } = useExecutionStream(id || null, {
    onUpdate: (update) => {
      console.log('Received execution update:', update);
      if (execution && update.status) {
        setExecution({ ...execution, status: update.status });
      }
      // Reload data when execution completes
      if (update.status === 'passed' || update.status === 'failed') {
        loadExecutionDetails();
      }
    },
  });

  useEffect(() => {
    if (id) {
      loadExecutionDetails();
    }
  }, [id]);

  const loadExecutionDetails = async () => {
    try {
      setIsLoading(true);
      
      // Load execution details
      const execResponse = await axios.get(`http://localhost:3100/api/executions/${id}`);
      setExecution(execResponse.data);

      // Load test results
      const resultsResponse = await axios.get(`http://localhost:3100/api/executions/${id}/results`);
      setTestResults(resultsResponse.data.results || []);

      // Load artifacts
      const artifactsResponse = await axios.get(`http://localhost:3100/api/executions/${id}/artifacts`);
      setArtifacts(artifactsResponse.data.artifacts || []);

    } catch (error) {
      console.error('Failed to load execution details:', error);
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

  const getArtifactIcon = (type: string) => {
    const icons: Record<string, string> = {
      video: '🎥',
      screenshot: '📸',
      log: '📄',
      trace: '🔍',
    };
    return icons[type] || '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const downloadArtifact = (artifact: Artifact) => {
    // In production, this would use presigned URLs from MinIO
    window.open(`http://localhost:9000/watt-artifacts/${artifact.file_path}`, '_blank');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading execution details...</div>
      </Layout>
    );
  }

  if (!execution) {
    return (
      <Layout>
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3>Execution not found</h3>
          <Link to="/executions">
            <button className="btn btn-primary">Back to Executions</button>
          </Link>
        </div>
      </Layout>
    );
  }

  const duration = execution.completed_at
    ? ((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(2)
    : 'Running...';

  return (
    <Layout>
      <div className="page-header">
        <h1>Execution Details</h1>
        <p>Detailed information and artifacts</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/executions">
          <button className="btn btn-secondary">← Back to Executions</button>
        </Link>
      </div>

      {/* Execution Overview */}
      <div className="card">
        <h2>Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Execution ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{execution.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Test Suite</div>
            <div>{execution.test_suite?.name || 'Unknown'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Browser</div>
            <div>{execution.browser_type}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Status</div>
            <div>{getStatusBadge(execution.status)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Started</div>
            <div style={{ fontSize: '0.9rem' }}>{new Date(execution.started_at).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Duration</div>
            <div style={{ fontSize: '0.9rem' }}>{duration}s</div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="card">
        <h2>Test Results ({testResults.length})</h2>
        {testResults.length === 0 ? (
          <p style={{ color: '#666' }}>No test results available yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Test Name</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Duration</th>
                <th style={{ padding: '0.75rem' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result) => (
                <tr key={result.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{result.test_name}</td>
                  <td style={{ padding: '0.75rem' }}>{getStatusBadge(result.status)}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{result.duration_ms}ms</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#ef4444' }}>
                    {result.error_message || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Artifacts */}
      <div className="card">
        <h2>Artifacts ({artifacts.length})</h2>
        {artifacts.length === 0 ? (
          <p style={{ color: '#666' }}>No artifacts available</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{getArtifactIcon(artifact.artifact_type)}</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {artifact.artifact_type.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', fontFamily: 'monospace' }}>
                      {artifact.file_path.split('/').pop()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                      {formatFileSize(artifact.file_size)} • {artifact.mime_type}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => downloadArtifact(artifact)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExecutionDetails;
