const localhostIP = "http://localhost:7654";
const deviceIP = "http://172.31.45.221:7654";
export const BASE_URL =
  window.location.hostname === "localhost" ? localhostIP : deviceIP;
