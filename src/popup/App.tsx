import { useState, useEffect } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { PendingJobsList } from './components/PendingJobsList';
import { ManualScrapeButton } from './components/ManualScrapeButton';
import './styles/popup.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const q = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(q.matches);
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    q.addEventListener('change', handler);
    return () => q.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`popup ${darkMode ? 'dark' : ''}`}>
      <header>
        <h1>Job Hunter</h1>
        <ConnectionStatus />
      </header>

      <main>
        <ManualScrapeButton />
        <hr />
        <PendingJobsList />
      </main>

      <footer>
        <small>v0.0.1</small>
      </footer>
    </div>
  );
}

export default App;
