import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, organizationName: string) {
    const response = await this.client.post('/api/auth/register', {
      email,
      password,
      organizationName,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/api/auth/me');
    return response.data;
  }

  // Test Suites
  async getTestSuites() {
    const response = await this.client.get('/api/test-suites');
    return response.data;
  }

  async getTestSuite(id: string) {
    const response = await this.client.get(`/api/test-suites/${id}`);
    return response.data;
  }

  async createTestSuite(data: {
    name: string;
    description?: string;
    framework?: string;
  }) {
    const response = await this.client.post('/api/test-suites', data);
    return response.data;
  }

  async updateTestSuite(
    id: string,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
    }
  ) {
    const response = await this.client.put(`/api/test-suites/${id}`, data);
    return response.data;
  }

  async deleteTestSuite(id: string) {
    await this.client.delete(`/api/test-suites/${id}`);
  }

  // Test Scripts
  async getTestScripts(suiteId: string) {
    const response = await this.client.get(`/api/test-scripts/suite/${suiteId}`);
    return response.data;
  }

  async createTestScript(data: {
    suiteId: string;
    name: string;
    filePath: string;
    framework?: string;
    timeout?: number;
    retryCount?: number;
    tags?: string[];
  }) {
    const response = await this.client.post('/api/test-scripts', data);
    return response.data;
  }

  async deleteTestScript(id: string) {
    await this.client.delete(`/api/test-scripts/${id}`);
  }

  // Environments
  async getEnvironments() {
    const response = await this.client.get('/api/environments');
    return response.data;
  }

  async getEnvironment(id: string) {
    const response = await this.client.get(`/api/environments/${id}`);
    return response.data;
  }

  async createEnvironment(data: {
    name: string;
    baseUrl: string;
    variables?: Record<string, string>;
  }) {
    const response = await this.client.post('/api/environments', data);
    return response.data;
  }

  async updateEnvironment(id: string, data: {
    name?: string;
    baseUrl?: string;
    variables?: Record<string, string>;
  }) {
    const response = await this.client.put(`/api/environments/${id}`, data);
    return response.data;
  }

  async deleteEnvironment(id: string) {
    await this.client.delete(`/api/environments/${id}`);
  }

  // Test Executions (via Core App)
  async getExecutions() {
    const response = await axios.get('http://localhost:3100/api/executions');
    return response.data.executions || [];
  }

  async getExecution(id: string) {
    const response = await axios.get(`http://localhost:3100/api/executions/${id}`);
    return response.data;
  }

  async createExecution(data: {
    suiteId: string;
    environmentId: string;
    browsers: string[];
    parallelCount?: number;
    triggeredBy: string;
    triggerSource: string;
  }) {
    const response = await axios.post('http://localhost:3100/api/executions', data);
    return response.data;
  }

  // Health checks
  async getApiHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
