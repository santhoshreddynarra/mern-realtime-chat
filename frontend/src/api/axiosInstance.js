import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // Matches backend port
  withCredentials: true, // Crucial for sending/receiving HTTP-only cookies later
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
