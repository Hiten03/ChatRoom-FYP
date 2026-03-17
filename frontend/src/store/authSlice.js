import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuth: false,
  user: null,
  otp: {
    phone: '',
    hash: '',
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set authenticated user and flag
    setAuth: (state, action) => {
      const {user} = action.payload;
      state.user = user;
      if(user === null){
        state.isAuth = false;
      }else{
        state.isAuth = true;
      }
    },

    // Store OTP details
    setOtp: (state, action) => {
      state.otp = {
        phone: action.payload.phone,
        hash: action.payload.hash,
      };
    },

    // Optional: Logout / Reset auth state
    resetAuth: () => initialState,
  },
});

// Action creators
export const { setAuth, setOtp, resetAuth } = authSlice.actions;

// Reducer
export default authSlice.reducer;
