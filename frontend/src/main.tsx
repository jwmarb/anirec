import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './routes';
import { BrowserRouter, Route, Routes } from 'react-router';
import Providers from '$/providers/index.tsx';
import Settings from '$/routes/settings';
import Search from '$/routes/search';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<App />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/search' element={<Search />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  </StrictMode>
);
