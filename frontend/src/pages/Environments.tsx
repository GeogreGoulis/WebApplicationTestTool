import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import '../components/Layout.css';

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
  variables: Record<string, string>;
  createdAt: string;
}

const Environments: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    variables: {} as Record<string, string>,
  });

  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getEnvironments();
      setEnvironments(data.environments || data);
    } catch (error) {
      console.error('Failed to load environments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiService.createEnvironment(formData);
      setShowCreateModal(false);
      setFormData({ name: '', baseUrl: '', variables: {} });
      loadEnvironments();
    } catch (error) {
      console.error('Failed to create environment:', error);
      alert('Failed to create environment');
    }
  };

  const handleUpdateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEnv) return;

    try {
      await apiService.updateEnvironment(selectedEnv.id, formData);
      setShowEditModal(false);
      setSelectedEnv(null);
      setFormData({ name: '', baseUrl: '', variables: {} });
      loadEnvironments();
    } catch (error) {
      console.error('Failed to update environment:', error);
      alert('Failed to update environment');
    }
  };

  const handleDeleteEnvironment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this environment?')) {
      return;
    }

    try {
      await apiService.deleteEnvironment(id);
      loadEnvironments();
    } catch (error: any) {
      console.error('Failed to delete environment:', error);
      if (error.response?.data?.code === 'IN_USE') {
        alert('Cannot delete environment that is in use by test executions');
      } else {
        alert('Failed to delete environment');
      }
    }
  };

  const openEditModal = (env: Environment) => {
    setSelectedEnv(env);
    setFormData({
      name: env.name,
      baseUrl: env.baseUrl,
      variables: env.variables || {},
    });
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading environments...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Environments</h1>
        <p>Manage test environments and configurations</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Environment
        </button>
      </div>

      {(showCreateModal || showEditModal) && (
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
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h2 style={{ marginTop: 0 }}>
              {showEditModal ? 'Edit Environment' : 'Create Environment'}
            </h2>
            <form onSubmit={showEditModal ? handleUpdateEnvironment : handleCreateEnvironment}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Production, Staging, Development"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Base URL
                </label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  required
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Variables (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.variables, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, variables: parsed });
                    } catch (err) {
                      // Invalid JSON, keep current value
                    }
                  }}
                  rows={6}
                  placeholder='{"API_KEY": "xxx", "USERNAME": "test"}'
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedEnv(null);
                    setFormData({ name: '', baseUrl: '', variables: {} });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {showEditModal ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {environments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌍</div>
            <h3>No environments yet</h3>
            <p>Create your first test environment to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {environments.map((env) => (
              <div
                key={env.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                      {env.name}
                    </h3>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#667eea', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {env.baseUrl}
                    </p>
                    {Object.keys(env.variables || {}).length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          Variables:
                        </strong>
                        <pre style={{
                          background: '#f5f5f5',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          overflow: 'auto',
                          margin: 0,
                        }}>
                          {JSON.stringify(env.variables, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                      <strong>Created:</strong> {new Date(env.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => openEditModal(env)}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteEnvironment(env.id)}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Environments;
