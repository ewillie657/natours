/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_lNFUvfSdl08p9Am7k6QjbQG500P84YN0CU');

export const bookTour = async tourId => {
  try {
    // 1) GET CHECKOUT SESSION FROM API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) CREATE CHECKOUT FORM + CHARGE CREDIT CARD
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
