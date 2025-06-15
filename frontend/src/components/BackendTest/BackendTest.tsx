import { useState } from 'react';
import { testApi } from '../../services/api';
import './BackendTest.css';

const BackendTest = () => {
  const [backendStatus, setBackendStatus] = useState<string>('');

  const checkBackend = async () => {
    try {
      const response = await testApi.healthCheck();
      setBackendStatus(response);
    } catch (error) {
      setBackendStatus('Error connecting to backend');
    }
  };

  return (
    <div className="backend-test">
      <button
        onClick={checkBackend}
        className="bg-primary px-4 py-2 rounded-lg font-medium text-sm"
      >
        Test Backend
      </button>
      {backendStatus && (
        <div className="backend-status">
          {backendStatus}
        </div>
      )}
    </div>
  );
};

export default BackendTest; 