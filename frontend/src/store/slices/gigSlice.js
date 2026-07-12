import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchGigs = createAsyncThunk('gigs/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/gigs', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch gigs');
  }
});

export const fetchGig = createAsyncThunk('gigs/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/gigs/${id}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch gig');
  }
});

export const createGig = createAsyncThunk('gigs/create', async (gigData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/gigs', gigData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create gig');
  }
});

export const deleteGig = createAsyncThunk('gigs/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/gigs/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete gig');
  }
});

export const fetchMyGigs = createAsyncThunk('gigs/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/gigs/my');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch your gigs');
  }
});

export const submitProposal = createAsyncThunk('gigs/submitProposal', async ({ gigId, ...body }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/proposals/gig/${gigId}`, body);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit proposal');
  }
});

export const fetchMyProposals = createAsyncThunk('gigs/myProposals', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/proposals/my');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch proposals');
  }
});

export const fetchGigProposals = createAsyncThunk('gigs/gigProposals', async (gigId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/proposals/gig/${gigId}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch proposals');
  }
});

export const updateProposalStatus = createAsyncThunk('gigs/updateProposal', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/proposals/${id}/status`, { status });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update proposal');
  }
});

const gigSlice = createSlice({
  name: 'gigs',
  initialState: {
    gigs: [],
    currentGig: null,
    myGigs: [],
    myProposals: [],
    gigProposals: [],
    total: 0,
    pages: 1,
    page: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearGigError: (state) => { state.error = null; },
    clearCurrentGig: (state) => { state.currentGig = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchGigs.pending, pending)
      .addCase(fetchGigs.fulfilled, (state, action) => {
        state.loading = false;
        state.gigs = action.payload.gigs;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.page = action.payload.page;
      })
      .addCase(fetchGigs.rejected, rejected)

      .addCase(fetchGig.pending, pending)
      .addCase(fetchGig.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGig = action.payload.gig;
      })
      .addCase(fetchGig.rejected, rejected)

      .addCase(createGig.pending, pending)
      .addCase(createGig.fulfilled, (state, action) => {
        state.loading = false;
        state.myGigs.unshift(action.payload.gig);
      })
      .addCase(createGig.rejected, rejected)

      .addCase(deleteGig.fulfilled, (state, action) => {
        state.myGigs = state.myGigs.filter((g) => g._id !== action.payload);
      })
      .addCase(deleteGig.rejected, rejected)

      .addCase(fetchMyGigs.pending, pending)
      .addCase(fetchMyGigs.fulfilled, (state, action) => {
        state.loading = false;
        state.myGigs = action.payload.gigs;
      })
      .addCase(fetchMyGigs.rejected, rejected)

      .addCase(submitProposal.pending, pending)
      .addCase(submitProposal.fulfilled, (state) => { state.loading = false; })
      .addCase(submitProposal.rejected, rejected)

      .addCase(fetchMyProposals.pending, pending)
      .addCase(fetchMyProposals.fulfilled, (state, action) => {
        state.loading = false;
        state.myProposals = action.payload.proposals;
      })
      .addCase(fetchMyProposals.rejected, rejected)

      .addCase(fetchGigProposals.pending, pending)
      .addCase(fetchGigProposals.fulfilled, (state, action) => {
        state.loading = false;
        state.gigProposals = action.payload.proposals;
      })
      .addCase(fetchGigProposals.rejected, rejected)

      .addCase(updateProposalStatus.fulfilled, (state, action) => {
        const updated = action.payload.proposal;
        state.gigProposals = state.gigProposals.map((p) =>
          p._id === updated._id ? { ...p, status: updated.status } : p
        );
      });
  },
});

export const { clearGigError, clearCurrentGig } = gigSlice.actions;
export default gigSlice.reducer;
