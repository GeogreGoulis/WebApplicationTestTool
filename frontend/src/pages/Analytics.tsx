import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import '../components/Layout.css';

interface Execution {
  id: string;
  status: string;
  browser_type: string;
  started_at: string;
  duration: number;
  test_suite?: {
    name: string;
  };
}

interface Stats {
  totalExecutions: number;
  passedExecutions: number;
  failedExecutions: number;
  passRate: number;
}

const Analytics: React.FC = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalExecutions: 0,
    passedExecutions: 0,
    failedExecutions: 0,
    passRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:3100/api/executions');
      const allExecutions = response.data.executions || [];

      // Filter by date range
      const now = new Date();
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const filtered = allExecutions.filter((exec: Execution) => 
        new Date(exec.started_at) >= cutoffDate
      );

      setExecutions(filtered);

      // Calculate stats
      const passed = filtered.filter((e: Execution) => e.status === 'passed').length;
      const failed = filtered.filter((e: Execution) => e.status === 'failed').length;
      const total = passed + failed;

      setStats({
        totalExecutions: total,
        passedExecutions: passed,
        failedExecutions: failed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data transformations
  const getExecutionsOverTime = () => {
    const grouped = executions.reduce((acc: any, exec) => {
      const date = new Date(exec.started_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, passed: 0, failed: 0 };
      }
      if (exec.status === 'passed') acc[date].passed++;
      if (exec.status === 'failed') acc[date].failed++;
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getBrowserDistribution = () => {
    const grouped = executions.reduce((acc: any, exec) => {
      const browser = exec.browser_type || 'unknown';
      if (!acc[browser]) {
        acc[browser] = { browser, count: 0 };
      }
      acc[browser].count++;
      return acc;
    }, {});

    return Object.values(grouped);
  };

  const getPassRateBySuite = () => {
    const grouped = executions.reduce((acc: any, exec) => {
      const suite = exec.test_suite?.name || 'Unknown';
      if (!acc[suite]) {
        acc[suite] = { suite, passed: 0, failed: 0 };
      }
      if (exec.status === 'passed') acc[suite].passed++;
      if (exec.status === 'failed') acc[suite].failed++;
      return acc;
    }, {});

    return Object.values(grouped).map((item: any) => ({
      ...item,
      passRate: item.passed + item.failed > 0 
        ? Math.round((item.passed / (item.passed + item.failed)) * 100)
        : 0,
    }));
  };

  const getDurationTrend = () => {
    return executions
      .filter(e => e.duration > 0)
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      .map(exec => ({
        date: new Date(exec.started_at).toLocaleDateString(),
        duration: Math.round(exec.duration / 1000), // Convert to seconds
      }));
  };

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

  if (isLoading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading analytics...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.95rem',
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.85rem', fontWeight: 500 }}>
              Total Executions
            </h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#333' }}>
              {stats.totalExecutions}
            </p>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.85rem', fontWeight: 500 }}>
              Passed
            </h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
              {stats.passedExecutions}
            </p>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.85rem', fontWeight: 500 }}>
              Failed
            </h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>
              {stats.failedExecutions}
            </p>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.85rem', fontWeight: 500 }}>
              Pass Rate
            </h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: stats.passRate >= 80 ? '#10b981' : '#f59e0b' }}>
              {stats.passRate}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* Executions Over Time */}
          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Executions Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getExecutionsOverTime()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="passed" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Browser Distribution */}
          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Browser Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getBrowserDistribution()}
                  dataKey="count"
                  nameKey="browser"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {getBrowserDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pass Rate by Test Suite */}
          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Pass Rate by Test Suite</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getPassRateBySuite()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="suite" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="passRate" fill="#10b981" name="Pass Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Duration Trend */}
          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Duration Trend (seconds)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getDurationTrend()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="duration" stroke="#3b82f6" fill="#93c5fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
