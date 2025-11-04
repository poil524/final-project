import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",  // backend
  withCredentials: true,             // send cookie
});

export default axiosClient;
