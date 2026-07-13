import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchGigs } from '../../store/slices/gigSlice';
import api from '../../api/axios';

const CATEGORIES = [
  'All', 'Web Development', 'Mobile Development', 'Design',
  'Writing', 'Marketing', 'Data Science', 'Video & Animation', 'Other',
];

const inputStyle = { background: '#ffffff', border: '1px solid #fed7aa', color: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' };

export default function BrowseGigs() {
  const dispatch = useDispatch();
  const { gigs, total, pages, loading } = useSelector((s) => s.gigs);
  const { user } = useSelector((s) => s.auth);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ budgetMin: '', budgetMax: '', skills: '', sort: 'newest' });
  const [recommended, setRecommended] = useState([]);

  const buildParams = (pg = page) => {
    const params = { page: pg, limit: 9 };
    if (search) params.search = search;
    if (category !== 'All') params.category = category;
    if (filters.budgetMin) params.budgetMin = filters.budgetMin;
    if (filters.budgetMax) params.budgetMax = filters.budgetMax;
    return params;
  };

  useEffect(() => {
    dispatch(fetchGigs(buildParams()));
  }, [dispatch, page, category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.role === 'freelancer') {
      api.get('/gigs/recommended').then(({ data }) => setRecommended(data.gigs || [])).catch(() => {});
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    dispatch(fetchGigs(buildParams(1)));
  };

  const handleFilterChange = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const applyFilters = () => {
    setPage(1);
    dispatch(fetchGigs(buildParams(1)));
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ budgetMin: '', budgetMax: '', skills: '', sort: 'newest' });
    setPage(1);
    dispatch(fetchGigs({ page: 1, limit: 9, ...(search ? { search } : {}), ...(category !== 'All' ? { category } : {}) }));
  };

  const hasActiveFilters = filters.budgetMin || filters.budgetMax || filters.skills;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1" style={{ color: '#0f172a' }}>Browse Gigs</h1>
      <p className="mb-6" style={{ color: '#64748b' }}>{total} gigs available</p>

      {/* AI Recommendations */}
      {recommended.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Recommended for You</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '2rem', background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff' }}>AI Match</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {recommended.map((gig) => (
              <Link key={gig._id} to={`/gigs/${gig._id}`}
                style={{ flexShrink: 0, width: '240px', background: '#ffffff', border: '2px solid #fed7aa', borderRadius: '1rem', padding: '1rem', textDecoration: 'none', boxShadow: '0 2px 10px rgba(234,88,12,0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#ea580c,#f97316)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#ffedd5', color: '#c2410c', padding: '0.15rem 0.5rem', borderRadius: '2rem' }}>{gig.category}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#d1fae5', color: '#047857', padding: '0.15rem 0.5rem', borderRadius: '2rem' }}>{gig.matchScore} skill{gig.matchScore !== 1 ? 's' : ''} match</span>
                </div>
                <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem', margin: '0 0 0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gig.title}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c' }}>Rs.{gig.budgetMin?.toLocaleString()} — Rs.{gig.budgetMax?.toLocaleString()}</p>
                {gig.matchedSkills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {gig.matchedSkills.slice(0, 3).map((s) => (
                      <span key={s} style={{ fontSize: '0.62rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gigs by title or keyword..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button type="submit" className="px-6 py-2 rounded-lg font-medium text-white" style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #fed7aa', background: hasActiveFilters ? '#ffedd5' : '#ffffff', color: hasActiveFilters ? '#c2410c' : '#78350f', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {hasActiveFilters ? '🔽 Filters (active)' : '🔽 Filters'}
        </button>
      </form>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(234,88,12,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Min Budget (Rs.)</label>
              <input
                type="number"
                name="budgetMin"
                value={filters.budgetMin}
                onChange={handleFilterChange}
                placeholder="e.g. 1000"
                style={{ ...inputStyle, width: '100%' }}
                min={0}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Max Budget (Rs.)</label>
              <input
                type="number"
                name="budgetMax"
                value={filters.budgetMax}
                onChange={handleFilterChange}
                placeholder="e.g. 50000"
                style={{ ...inputStyle, width: '100%' }}
                min={0}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Required Skill</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                placeholder="e.g. React, Python"
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Sort By</label>
              <select name="sort" value={filters.sort} onChange={handleFilterChange} style={{ ...inputStyle, width: '100%' }}>
                <option value="newest">Newest First</option>
                <option value="budget_high">Budget: High to Low</option>
                <option value="budget_low">Budget: Low to High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={applyFilters} style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {filters.budgetMin && <FilterPill label={`Min: Rs.${filters.budgetMin}`} onRemove={() => { setFilters((f) => ({ ...f, budgetMin: '' })); }} />}
          {filters.budgetMax && <FilterPill label={`Max: Rs.${filters.budgetMax}`} onRemove={() => { setFilters((f) => ({ ...f, budgetMax: '' })); }} />}
          {filters.skills && <FilterPill label={`Skill: ${filters.skills}`} onRemove={() => { setFilters((f) => ({ ...f, skills: '' })); }} />}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16" style={{ color: '#94a3b8' }}>Loading gigs...</div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#94a3b8' }}>No gigs found. Try different filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filterGigs(gigs, filters).map((gig) => <GigCard key={gig._id} gig={gig} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className="px-4 py-2 rounded-lg text-sm font-medium"
              style={p === page
                ? { background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#ffffff' }
                : { background: '#ffffff', border: '1px solid #fed7aa', color: '#c2410c' }
              }>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function filterGigs(gigs, filters) {
  let result = [...gigs];
  if (filters.skills) {
    const skill = filters.skills.toLowerCase();
    result = result.filter((g) => g.skills?.some((s) => s.toLowerCase().includes(skill)));
  }
  if (filters.sort === 'budget_high') result.sort((a, b) => b.budgetMax - a.budgetMax);
  if (filters.sort === 'budget_low') result.sort((a, b) => a.budgetMin - b.budgetMin);
  return result;
}

function FilterPill({ label, onRemove }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.7rem' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#c2410c', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1 }}>×</button>
    </span>
  );
}

function GigCard({ gig }) {
  return (
    <Link to={`/gigs/${gig._id}`} className="block p-5 transition-all hover:scale-[1.02] hover:shadow-md"
      style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#ffedd5', color: '#c2410c' }}>
          {gig.category}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded-full"
          style={gig.status === 'open'
            ? { background: '#d1fae5', color: '#047857' }
            : { background: '#f1f5f9', color: '#64748b' }}>
          {gig.status}
        </span>
      </div>
      <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: '#0f172a' }}>{gig.title}</h3>
      <p className="text-sm mb-4 line-clamp-2" style={{ color: '#64748b' }}>{gig.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold" style={{ color: '#0f172a' }}>Rs.{gig.budgetMin?.toLocaleString()} — Rs.{gig.budgetMax?.toLocaleString()}</span>
        <span style={{ color: '#94a3b8' }}>{gig.proposalCount} proposals</span>
      </div>
      {gig.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {gig.skills.slice(0, 3).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded" style={{ background: '#fff7ed', color: '#c2410c' }}>{s}</span>
          ))}
          {gig.skills.length > 3 && <span className="text-xs" style={{ color: '#94a3b8' }}>+{gig.skills.length - 3} more</span>}
        </div>
      )}
    </Link>
  );
}
