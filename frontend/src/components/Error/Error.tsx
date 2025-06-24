import React, { useState, useEffect } from 'react';
import './Error.css';

interface ErrorProps {
  errorCode?: string;
  errorMessage?: string;
  onBack?: () => void;
}

const CUTE_ERROR_MESSAGES = [
  'sumthin happnd...',
  'oopsie!',
  'uh oh...',
  'whoops!',
  'something went wrong...',
  'yikes!',
  'oh no!',
  'well this is awkward...',
  'looks like we have a problem...',
  'error detected!',
  'something broke!',
  'not again...',
  'this is embarrassing...',
  'the gremlins are at it again...',
  'computer says no...',
  'task failed successfully!',
  'everything is fine... (it\'s not)',
  'bad boy!',
  'ugh...',
  'wtf!',
  'what the f*ck!',
  'me sad!',
  'me angy!',
  'the math ain\'t mathing...',
  'the code ain\'t codeing...'
];

const Error: React.FC<ErrorProps> = ({ 
  errorCode = 'UNKNOWN_ERROR', 
  errorMessage = 'sumthin happnd...',
  onBack 
}) => {
  const [randomMessage, setRandomMessage] = useState<string>('sumthin happnd...');

  useEffect(() => {
    // Pick a random message when component mounts
    const randomIndex = Math.floor(Math.random() * CUTE_ERROR_MESSAGES.length);
    setRandomMessage(CUTE_ERROR_MESSAGES[randomIndex]);
  }, []);

  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-emoji">qwq</div>
        <div className="error-message">{randomMessage}</div>
        <div className="error-code">{errorCode}</div>
      </div>
    </div>
  );
};

export default Error; 