import axios, {
  AxiosError,
  AxiosRequestHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const request = axios.create({
  baseURL: process.env.BASE_API_URL,
  timeout: 60000,
});

const onRequestInterceptor = async (config: InternalAxiosRequestConfig) => {
  const response = await generateToken();
  if (response && response?.data?.token) {
    config.headers["Content-Type"] = "application/json";
    config.headers.Authorization = `Bearer ${response?.data?.token}`;
    config.headers = { ...config.headers } as AxiosRequestHeaders;
  }
  return config;
};

const onResponseInterceptor = async (response: AxiosResponse) => {
  return response;
};

const onErrorInterceptor = async (error: AxiosError) => {
  return error;
};

request.interceptors.request.use(onRequestInterceptor);

request.interceptors.response.use(onResponseInterceptor, onErrorInterceptor);

const generateToken = async () => {
  try {
    let url = `${process.env.TLT_AUTHEN_URL}authentication/token/generate`;
    let body = {
      clientKey: process.env.TOKEN_CLIENT_KEY,
      secretKey: process.env.TOKEN_SECRET_KEY,
    };
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

export default request;
