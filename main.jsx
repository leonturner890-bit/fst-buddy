import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminApp from './components/admin/AdminApp.jsx';
import './styles.css';

function Root() {
  const [route, setRoute] = React.useState(window.location.hash);

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route === '#admin' ? <AdminApp /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
