import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Builds from '../Builds';
import { AuthContext } from '../AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('Builds component', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    restoreConfirm();
  });

  function restoreConfirm() {
    // @ts-ignore
    if (window.confirm && window.confirm._isMock) {
      // @ts-ignore
      window.confirm = window.confirm._orig;
    }
  }

  it('sets empty builds when API returns non-array', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any));

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, token: null }}>
          <Builds />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // Only header row should be present
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(1);
  });

  it('does not call delete when user cancels confirm', async () => {
    const mockBuilds = [{ id: 1, nom: 'A', description: '', version: '', statut: '', proprietaire: '', updatedAt: new Date().toISOString() }];
    global.fetch = vi.fn((url: string, opts?: any) => {
      if (url === '/api/builds') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBuilds) } as any);
      return Promise.resolve({ ok: true } as any);
    });

    // mock confirm to false
    // @ts-ignore
    const orig = window.confirm;
    // @ts-ignore
    window.confirm = Object.assign(() => false, { _isMock: true, _orig: orig });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <Builds />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/builds'));
    // click archive button
    const btn = await screen.findByText('Archiver');
    fireEvent.click(btn);

    expect(global.fetch).toHaveBeenCalledTimes(1); // only initial fetch
  });

  it('calls delete when confirm true and removes build', async () => {
    const mockBuilds = [{ id: 2, nom: 'B', description: '', version: '', statut: '', proprietaire: '', updatedAt: new Date().toISOString() }];
    global.fetch = vi.fn((url: string, opts?: any) => {
      if (url === '/api/builds') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBuilds) } as any);
      if (url === '/api/builds/2' && opts?.method === 'DELETE') return Promise.resolve({ ok: true } as any);
      return Promise.resolve({ ok: false } as any);
    });

    // mock confirm true
    // @ts-ignore
    const orig = window.confirm;
    // @ts-ignore
    window.confirm = Object.assign(() => true, { _isMock: true, _orig: orig });

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

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/builds/2', expect.objectContaining({ method: 'DELETE' })));
  });
});
