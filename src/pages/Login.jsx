import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';

export default function Login() {
  const { token, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(username, password);
    } catch (ex) {
      setErr(errMsg(ex));
      setBusy(false);
    }
  };

  return (
    <form className="card login stack" onSubmit={submit}>
      <h2>Login ERP</h2>
      <label>Username
        <input value={username} onChange={e => setUsername(e.target.value)} required />
      </label>
      <label>Password
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      {err && <p className="error">{err}</p>}
      <button disabled={busy}>{busy ? 'Masuk...' : 'Masuk'}</button>
    </form>
  );
}
