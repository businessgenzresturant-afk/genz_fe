import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const inputClass = 'input-field min-h-[44px] text-base w-full max-w-lg';

export default function AdminPayment() {
  const { token } = useAuth();
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [qrPreviewBust, setQrPreviewBust] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/checkout');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUpiId(typeof data.upiId === 'string' ? data.upiId : '');
        setQrUrl(data.qrUrl || null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveUpiId = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSaveStatus('Saving…');
    setBusy(true);
    try {
      const res = await fetch('/api/settings/checkout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upiId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveStatus(data.error || 'Could not save');
        return;
      }
      setUpiId(data.upiId ?? '');
      setQrUrl(data.qrUrl ?? null);
      setSaveStatus('Saved.');
    } catch {
      setSaveStatus('Network error');
    } finally {
      setBusy(false);
    }
  };

  const uploadQr = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setUploadStatus('Uploading…');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('qr', file);
      const res = await fetch('/api/settings/checkout/qr', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadStatus(data.error || 'Upload failed');
        return;
      }
      setQrUrl(data.qrUrl || null);
      setQrPreviewBust(Date.now());
      setUploadStatus('QR saved to frontend/public/assets.');
      await load();
    } catch {
      setUploadStatus('Network error');
    } finally {
      setBusy(false);
    }
  };

  const removeQr = async () => {
    if (!token) return;
    if (!window.confirm('Remove the saved UPI QR image from the server?')) return;
    setUploadStatus('Removing…');
    setBusy(true);
    try {
      const res = await fetch('/api/settings/checkout/qr', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadStatus(data.error || 'Could not remove');
        return;
      }
      setQrUrl(null);
      setQrPreviewBust(0);
      setUploadStatus('QR removed.');
      await load();
    } catch {
      setUploadStatus('Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-fill min-h-[calc(100vh-4rem)] w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10 pb-16">
      <div className="mx-auto w-full max-w-[min(960px,94vw)]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase text-delivery-700 tracking-wider">Owner</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">Payment &amp; UPI</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              UPI ID is stored in the database. The QR image is saved under{' '}
              <span className="font-mono text-xs bg-slate-100 px-1 rounded">frontend/public/assets/</span> so the
              checkout page can load it from <span className="font-mono text-xs">/assets/upi-qr…</span>.
            </p>
          </div>
          <Link to="/checkout" className="btn-secondary text-sm min-h-[44px] inline-flex items-center rounded-xl">
            View checkout
          </Link>
        </div>

        <section className="panel p-6 md:p-8 mb-8 border border-delivery-200">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">UPI ID</h2>
          {loading ? (
            <p className="text-slate-600">Loading…</p>
          ) : (
            <form onSubmit={saveUpiId} className="space-y-4 max-w-lg">
              <div>
                <label htmlFor="admin-upi-id" className="block text-sm font-medium text-slate-800 mb-1.5">
                  VPA / UPI ID shown at checkout
                </label>
                <input
                  id="admin-upi-id"
                  className={inputClass}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. restaurant@paytm"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy || !token} className="btn-primary min-h-[44px] px-6 rounded-xl">
                  Save UPI ID
                </button>
                {saveStatus && <span className="text-sm text-slate-600">{saveStatus}</span>}
              </div>
            </form>
          )}
        </section>

        <section className="panel p-6 md:p-8 border border-slate-200">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-2">UPI QR image</h2>
          <p className="text-sm text-slate-600 mb-6">
            Upload a PNG or JPEG. It replaces any previous <span className="font-mono text-xs">upi-qr.*</span> in{' '}
            <span className="font-mono text-xs">public/assets/</span>. Checkout only shows the QR block when a file is
            present.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full max-w-[280px] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden aspect-square flex items-center justify-center">
              {qrUrl ? (
                <img
                  src={qrPreviewBust ? `${qrUrl}?t=${qrPreviewBust}` : qrUrl}
                  alt=""
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-sm text-slate-500 px-4 text-center">No QR uploaded yet</span>
              )}
            </div>
            <div className="flex flex-col gap-3 min-w-0">
              <label className="btn-secondary min-h-[44px] px-4 rounded-xl inline-flex items-center justify-center cursor-pointer w-fit">
                <span>Choose image…</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={busy || !token}
                  onChange={uploadQr}
                />
              </label>
              {qrUrl && (
                <button
                  type="button"
                  disabled={busy || !token}
                  onClick={removeQr}
                  className="text-sm font-semibold text-rose-700 hover:text-rose-900 px-2 py-2 rounded-lg hover:bg-rose-50 w-fit"
                >
                  Remove QR file
                </button>
              )}
              {uploadStatus && <p className="text-sm text-slate-600">{uploadStatus}</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
