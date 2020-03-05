/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// xport const updateData = async (name, email) => {

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUppercase()} Data updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
