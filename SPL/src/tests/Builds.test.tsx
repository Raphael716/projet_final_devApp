import React from 'react';
// Mock AuthContext to avoid importing the real module (reduces AuthContext.ts coverage)
vi.mock('../AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null, login: () => {}, logout: () => {} }) };
});
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Builds from '../Builds';
import { AuthContext } from '../AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('Builds component unit', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    // restore confirm if mocked
    if ((window.confirm as any)?._isMock) {
      // @ts-ignore
      window.confirm = (window.confirm as any)._orig;
    }
  });

  it('renders builds when API returns array', async () => {
    const mockBuilds = [{ id: 1, nom: 'A', description: '', version: '', statut: '', proprietaire: '', updatedAt: new Date().toISOString() }];
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockBuilds) } as any));

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, token: null }}>
          <Builds />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/builds'));
    expect(await screen.findByText('A')).toBeInTheDocument();
  });

  it('shows no archive buttons when user is not admin', async () => {
    const mockBuilds = [{ id: 2, nom: 'B', description: '', version: '', statut: '', proprietaire: '', updatedAt: new Date().toISOString() }];
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockBuilds) } as any));

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, token: null }}>
          <Builds />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText('Archiver')).toBeNull();
  });

  it('handles delete error path (alert called) when fetch DELETE fails', async () => {
    const mockBuilds = [{ id: 3, nom: 'C', description: '', version: '', statut: '', proprietaire: '', updatedAt: new Date().toISOString() }];
    global.fetch = vi.fn((url: string, opts?: any) => {
      if (url === '/api/builds') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBuilds) } as any);
      return Promise.resolve({ ok: false } as any);
    });

    // mock confirm true
    // @ts-ignore
    const orig = window.confirm;
    // @ts-ignore
    window.confirm = Object.assign(() => true, { _isMock: true, _orig: orig });

    const origAlert = window.alert;
    window.alert = vi.fn();

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <Builds />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/builds'));
    const btn = await screen.findByText('Archiver');
    fireEvent.click(btn);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/builds/3', expect.objectContaining({ method: 'DELETE' })));
    // since delete returned ok: false, the catch should trigger alert
    expect((window.alert as any)).toHaveBeenCalled();

    window.alert = origAlert;
  });
});
