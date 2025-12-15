import React from 'react';
// Mock AuthContext to avoid importing the real module (reduces AuthContext.ts coverage)
vi.mock('../AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null, login: () => {}, logout: () => {} }) };
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewBuild from '../NewBuild';
import { AuthContext } from '../AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('NewBuild component unit', () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch;
    vi.resetAllMocks();
  });

  it('handles server json throwing (non-json error) gracefully', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => { throw new Error('bad json'); } } as any));

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // fill required fields so form submits
    fireEvent.change(screen.getByPlaceholderText('Nom du logiciel'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('Description courte'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByPlaceholderText('Responsable / Propriétaire'), { target: { value: 'me' } });

    const submit = screen.getByText('Créer');
    fireEvent.click(submit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // component sets error state and displays message
    expect(await screen.findByText(/Erreur création|Réponse invalide du serveur|Unable to parse error response/)).toBeTruthy();
  });

  it('handles server success but invalid payload (missing id)', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/builds') return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any);
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // fill required fields so form submits
    fireEvent.change(screen.getByPlaceholderText('Nom du logiciel'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('Description courte'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByPlaceholderText('Responsable / Propriétaire'), { target: { value: 'me' } });

    const submit = screen.getByText('Créer');
    fireEvent.click(submit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // should show error message for invalid response
    expect(await screen.findByText('Réponse invalide du serveur')).toBeTruthy();
  });

  it('requires version when files are attached', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // fill required fields except version
    fireEvent.change(screen.getByPlaceholderText('Nom du logiciel'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('Description courte'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByPlaceholderText('Responsable / Propriétaire'), { target: { value: 'me' } });

    // get the file input directly via label (label wraps the input)
    const fileInput = screen.getByLabelText(/Joindre des fichiers/i) as HTMLInputElement;
    const file = new File(['content'], 'a.zip', { type: 'application/zip' });
    // @ts-ignore
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submit = screen.getByText('Créer');
    fireEvent.click(submit);

    expect(await screen.findByText('Veuillez indiquer une version pour les fichiers joints.')).toBeTruthy();
  });

  it('renders non-admin message when user is not admin', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: false }, token: null }}>
          <NewBuild />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Seuls les admins peuvent joindre des fichiers')).toBeInTheDocument();
  });

  it('submits when file and version are provided', async () => {
    // mock fetch to return created id
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 42 }) } as any));

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // fill required fields and version
    fireEvent.change(screen.getByPlaceholderText('Nom du logiciel'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('Description courte'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByPlaceholderText('Version (ex: v1.0.0)'), { target: { value: 'v1.2.3' } });
    fireEvent.change(screen.getByPlaceholderText('Responsable / Propriétaire'), { target: { value: 'me' } });

    const fileInput = screen.getByLabelText(/Joindre des fichiers/i) as HTMLInputElement;
    const file = new File(['content'], 'a.zip', { type: 'application/zip' });
    // @ts-ignore
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submit = screen.getByText('Créer');
    fireEvent.click(submit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // ensure no error displayed
    expect(screen.queryByText(/Erreur création|Réponse invalide du serveur/)).toBeNull();
  });

  it('shows default error when response.ok is false but no error field', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as any));

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // fill required fields so form submits
    fireEvent.change(screen.getByPlaceholderText('Nom du logiciel'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('Description courte'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByPlaceholderText('Responsable / Propriétaire'), { target: { value: 'me' } });

    const submit = screen.getByText('Créer');
    fireEvent.click(submit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(await screen.findByText('Erreur création')).toBeTruthy();
  });
});
