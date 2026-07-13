import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import PayButton from '../../components/common/PayButton';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };

export default function Payments() {
  const { user } = useSelector((s) => s.auth);
  const [payments, setPayments] = useState([]);
  const [pendingProposals, setPendingProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments/my');
      setPayments(data.payments);

      if (user?.role === 'client') {
        const { data: pd } = await api.get('/proposals/my-gigs-accepted');
        setPendingProposals(pd.proposals || []);
      }
    } catch {
      // no data yet
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#0f172a' }}>Payments</h1>
      <p className="mb-8" style={{ color: '#64748b' }}>Manage your payments</p>

      {user?.role === 'client' && pendingProposals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Pending Payments</h2>
          <div className="space-y-3">
            {pendingProposals.map((p) => (
              <div key={p._id} className="p-4 flex items-center justify-between" style={card}>
                <div>
                  <p className="font-medium" style={{ color: '#0f172a' }}>{p.gig?.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
                    Freelancer: {p.freelancer?.name} . Bid: Rs.{p.bidAmount?.toLocaleString()}
                  </p>
                </div>
                <PayButton proposal={p} onSuccess={loadData} />
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Payment History</h2>
      {loading ? (
        <p className="text-center py-8" style={{ color: '#94a3b8' }}>Loading...</p>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={card}>
          <p className="text-4xl mb-3" style={{ color: '#fed7aa' }}>$</p>
          <p style={{ color: '#94a3b8' }}>No payments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p._id} className="p-4 flex items-center justify-between" style={card}>
              <div>
                <p className="font-medium" style={{ color: '#0f172a' }}>{p.gig?.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {user?.role === 'client' ? `To: ${p.freelancer?.name}` : `From: ${p.client?.name}`}
                  {' . '}{new Date(p.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold" style={{ color: '#0f172a' }}>Rs.{p.amount?.toLocaleString()}</span>
                <span className="text-xs px-2 py-1 rounded-full capitalize font-medium"
                  style={p.status === 'paid'
                    ? { background: '#d1fae5', color: '#047857' }
                    : p.status === 'failed'
                    ? { background: '#fee2e2', color: '#dc2626' }
                    : { background: '#fef3c7', color: '#b45309' }}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
