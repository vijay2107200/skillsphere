import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyGigs, deleteGig } from '../../store/slices/gigSlice';
import toast from 'react-hot-toast';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };

export default function MyGigs() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myGigs, loading } = useSelector((s) => s.gigs);

  useEffect(() => { dispatch(fetchMyGigs()); }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gig? This cannot be undone.')) return;
    const result = await dispatch(deleteGig(id));
    if (deleteGig.fulfilled.match(result)) toast.success('Gig deleted');
    else toast.error(result.payload || 'Failed to delete');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#0f172a' }}>My Gigs</h1>
          <p className="mt-1" style={{ color: '#64748b' }}>{myGigs.length} gig{myGigs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <button onClick={() => navigate('/post-gig')} className="text-white px-5 py-2 rounded-lg font-medium"
          style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
          + Post New Gig
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#94a3b8' }}>Loading...</div>
      ) : myGigs.length === 0 ? (
        <div className="text-center py-16">
          <p className="mb-4" style={{ color: '#94a3b8' }}>You haven't posted any gigs yet.</p>
          <button onClick={() => navigate('/post-gig')} className="text-white px-6 py-3 rounded-lg font-medium"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
            Post Your First Gig
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myGigs.map((gig) => (
            <div key={gig._id} className="p-5" style={card}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full"
                      style={gig.status === 'open'
                        ? { background: '#d1fae5', color: '#047857' }
                        : gig.status === 'in_progress'
                        ? { background: '#ffedd5', color: '#c2410c' }
                        : { background: '#f1f5f9', color: '#64748b' }}>
                      {gig.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{gig.category}</span>
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: '#0f172a' }}>{gig.title}</h3>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#64748b' }}>{gig.description}</p>
                  <div className="flex gap-4 text-sm" style={{ color: '#64748b' }}>
                    <span>Rs.{gig.budgetMin?.toLocaleString()}  -  Rs.{gig.budgetMax?.toLocaleString()}</span>
                    <span>{gig.proposalCount} proposals</span>
                    <span>Posted {new Date(gig.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link to={`/gigs/${gig._id}`} className="text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                    View
                  </Link>
                  <button onClick={() => handleDelete(gig._id)} className="text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
