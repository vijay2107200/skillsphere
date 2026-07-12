import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function PayButton({ proposal, onSuccess }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
        style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
      >
        Pay Rs.{proposal.bidAmount?.toLocaleString()}
      </button>

      {showModal && (
        <PaymentModal
          proposal={proposal}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); if (onSuccess) onSuccess(); }}
        />
      )}
    </>
  );
}

function PaymentModal({ proposal, onClose, onSuccess }) {
  const [step, setStep] = useState('choose');
  const [method, setMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upi, setUpi] = useState('');
  const txnId = 'pay_' + Math.random().toString(36).substr(2, 14).toUpperCase();

  const handlePay = async () => {
    if (method === 'card' && (cardNum.length < 16 || !expiry || !cvv)) {
      toast.error('Please fill all card details'); return;
    }
    if (method === 'upi' && !upi.includes('@')) {
      toast.error('Enter a valid UPI ID'); return;
    }
    setStep('processing');
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await api.post('/payments/mock-pay', {
        proposalId: proposal._id,
        gigId: proposal.gig?._id,
        freelancerId: proposal.freelancer?._id || proposal.freelancer,
        amount: proposal.bidAmount,
        txnId,
      });
    } catch {}
    setStep('success');
  };

  const overlay = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' };
  const modal = { width: '100%', maxWidth: '420px', borderRadius: '1.25rem', overflow: 'hidden', background: '#ffffff', border: '1px solid #fed7aa', boxShadow: '0 25px 60px rgba(234,88,12,0.15)' };
  const inp = { width: '100%', background: '#fffbf5', border: '1px solid #fed7aa', color: '#1e293b', borderRadius: '0.5rem', padding: '0.6rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.875rem' };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}>
      <div style={modal}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>SkillSphere Payments</p>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem' }}>Rs.{proposal.bidAmount?.toLocaleString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Paying for</p>
              <p style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, maxWidth: '150px', textAlign: 'right' }}>{proposal.gig?.title}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>

          {/* Step: Choose */}
          {step === 'choose' && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {['card', 'upi', 'netbanking'].map((m) => (
                  <button key={m} onClick={() => setMethod(m)} style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                    border: '1px solid', textTransform: 'capitalize',
                    background: method === m ? '#fff7ed' : '#fffbf5',
                    borderColor: method === m ? '#f97316' : '#fed7aa',
                    color: method === m ? '#ea580c' : '#78350f',
                  }}>{m === 'netbanking' ? 'Net Banking' : m.toUpperCase()}</button>
                ))}
              </div>

              {method === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ color: '#475569', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Card Number</label>
                    <input style={inp} placeholder="4111 1111 1111 1111" maxLength={16}
                      value={cardNum} onChange={(e) => setCardNum(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ color: '#475569', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Expiry</label>
                      <input style={inp} placeholder="MM/YY" maxLength={5}
                        value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ color: '#475569', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>CVV</label>
                      <input style={inp} placeholder="***" maxLength={3} type="password"
                        value={cvv} onChange={(e) => setCvv(e.target.value)} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Test card: 4111 1111 1111 1111 | 12/26 | 123</p>
                </div>
              )}

              {method === 'upi' && (
                <div>
                  <label style={{ color: '#475569', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>UPI ID</label>
                  <input style={inp} placeholder="yourname@upi" value={upi} onChange={(e) => setUpi(e.target.value)} />
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>Test UPI: test@upi</p>
                </div>
              )}

              {method === 'netbanking' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['SBI', 'HDFC', 'ICICI', 'Axis'].map((bank) => (
                    <button key={bank} style={{
                      padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                      background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c',
                    }}>{bank}</button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                  Cancel
                </button>
                <button onClick={handlePay} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  Pay Now Rs.{proposal.bidAmount?.toLocaleString()}
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '1rem' }}>
                [SSL] 256-bit secured - SkillSphere Payments
              </p>
            </>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ea580c', fontWeight: 700 }}>...</div>
              <p style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.1rem' }}>Processing Payment...</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>Please do not close this window</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#d1fae5', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.75rem', color: '#047857', fontWeight: 700 }}>OK</div>
              <p style={{ color: '#047857', fontWeight: 700, fontSize: '1.2rem' }}>Payment Successful!</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Rs.{proposal.bidAmount?.toLocaleString()} paid successfully</p>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '0.75rem 1rem', margin: '1rem 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Transaction ID</span>
                  <span style={{ color: '#ea580c', fontWeight: 600 }}>{txnId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Amount</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>Rs.{proposal.bidAmount?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Date</span>
                  <span style={{ color: '#0f172a' }}>{new Date().toLocaleString('en-IN')}</span>
                </div>
              </div>
              <button onClick={onSuccess} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ea580c,#f97316)', fontSize: '0.875rem' }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
