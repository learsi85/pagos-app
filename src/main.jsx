import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
const style = document.createElement('style');
style.textContent = `*,*::before,*::after{box-sizing:border-box}body{margin:0;padding:0;font-family:'Inter','Segoe UI',system-ui,sans-serif}button,input,select,textarea{font-family:inherit}input:focus,select:focus,textarea:focus{border-color:#3182ce!important;box-shadow:0 0 0 2px rgba(49,130,206,.2);outline:none}a{text-decoration:none}`;
document.head.appendChild(style);
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
