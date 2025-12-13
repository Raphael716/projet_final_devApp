cypress/e2e/features/parcours_critiques/parcours_critiques.steps.js [29:37]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    onBeforeLoad(win) {
      const token = 'admin-token';
      const ADMIN = { id: 7, email: 'admin@example.com', username: 'Admin', isAdmin: true };
      win.localStorage.setItem('spl_token', token);
      win.localStorage.setItem('spl_user', JSON.stringify(ADMIN));
      win.localStorage.setItem('auth_token', token);
      win.localStorage.setItem('auth_user', JSON.stringify(ADMIN));
    },
  });
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



cypress/e2e/features/parcours_critiques/parcours_critiques.steps.js [74:82]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    onBeforeLoad(win) {
      const token = 'admin-token';
      const ADMIN = { id: 7, email: 'admin@example.com', username: 'Admin', isAdmin: true };
      win.localStorage.setItem('spl_token', token);
      win.localStorage.setItem('spl_user', JSON.stringify(ADMIN));
      win.localStorage.setItem('auth_token', token);
      win.localStorage.setItem('auth_user', JSON.stringify(ADMIN));
    },
  });
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



