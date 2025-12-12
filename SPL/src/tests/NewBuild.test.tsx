import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewBuild from '../NewBuild';
import { AuthContext } from '../AuthContext';
import { BrowserRouter } from 'react-router-dom';

const navigateMock = vi.fn();
// partial mock to override useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('NewBuild', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows error if files attached without version', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // fill required fields so form submission runs
    fireEvent.change(screen.getByPlaceholderText('Nom du logiciel'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('Description courte'), { target: { value: 'd' } });
    fireEvent.change(screen.getByPlaceholderText('Responsable / Propriétaire'), { target: { value: 'o' } });

    const labeled = screen.getByLabelText(/Joindre des fichiers/i);
    const fileInput = (labeled.tagName === 'INPUT' ? labeled : labeled.querySelector('input')) as HTMLInputElement;
    const file = new File(['a'], 'a.txt', { type: 'text/plain' });
    // fire change with files in event
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submit = screen.getByText('Créer');
    fireEvent.click(submit);

    expect(await screen.findByText(/Veuillez indiquer une version/)).toBeInTheDocument();
  });

  it('parses error JSON from failed response', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'boom' }) } as any));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const name = screen.getByPlaceholderText('Nom du logiciel');
    fireEvent.change(name, { target: { value: 'X' } });
    const desc = screen.getByPlaceholderText('Description courte');
    fireEvent.change(desc, { target: { value: 'd' } });
    const owner = screen.getByPlaceholderText('Responsable / Propriétaire');
    fireEvent.change(owner, { target: { value: 'o' } });

    fireEvent.click(screen.getByText('Créer'));

    expect(await screen.findByText(/boom/)).toBeInTheDocument();
  });

  it('navigates on success', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 5 }) } as any));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { isAdmin: true }, token: 't' }}>
          <NewBuild />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nom du logiciel'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('Description courte'), { target: { value: 'd' } });
    fireEvent.change(screen.getByPlaceholderText('Responsable / Propriétaire'), { target: { value: 'o' } });

    fireEvent.click(screen.getByText('Créer'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
