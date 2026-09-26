import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smarttag-6bea18f8625e.herokuapp.com',
  withCredentials: true,
});

export default api;