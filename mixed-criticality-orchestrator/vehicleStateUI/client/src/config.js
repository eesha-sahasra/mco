const localhostIP = "http://localhost:5500";
const deviceIP = "http://172.31.45.221:5500";
export const SERVER_URL =
  window.location.hostname === "localhost" ? localhostIP : deviceIP;
export const BROWSER_TAB_URL="http://172.31.45.221";