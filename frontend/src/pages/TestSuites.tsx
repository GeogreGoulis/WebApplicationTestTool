import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import '../components/Layout.css';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  framework: string;
  created_at: string;
}

const TestSuites: React.FC = () => {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    framework: 'playwright',
  });

  useEffect(() => {
    loadTestSuites();
  }, []);

  const loadTestSuites = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getTestSuites();
      setSuites(data.testSuites || data);
    } catch (error) {
      console.error('Failed to load test suites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiService.createTestSuite(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', framework: 'playwright' });
      loadTestSuites();
    } catch (error) {
      console.error('Failed to create test suite:', error);
      alert('Failed to create test suite');
    }
  };

  const handleDeleteSuite = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this test suite?')) {
      return;
    }

    try {
      await apiService.deleteTestSuite(id);
      loadTestSuites();
    } catch (error) {
      console.error('Failed to delete test suite:', error);
      alert('Failed to delete test suite');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading test suites...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Test Suites</h1>
        <p>Manage your test suites</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Test Suite
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
            <h2 style={{ marginTop: 0 }}>Create Test Suite</h2>
            <form onSubmit={handleCreateSuite}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
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
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Framework
                </label>
                <select
                  value={formData.framework}
                  onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="playwright">Playwright</option>
                  <option value="cypress">Cypress</option>
                  <option value="selenium">Selenium</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', framework: 'playwright' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {suites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No test suites yet</h3>
            <p>Create your first test suite to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {suites.map((suite) => (
              <div
                key={suite.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                      {suite.name}
                    </h3>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#666' }}>
                      {suite.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
                      <div>
                        <strong>Framework:</strong> {suite.framework || 'playwright'}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(suite.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteSuite(suite.id)}
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

export default TestSuites;
