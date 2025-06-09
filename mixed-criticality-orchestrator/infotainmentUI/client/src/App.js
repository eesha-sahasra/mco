import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import Home from "./components/Home";
import AppStore from "./components/AppStore";
import Games from "./components/Games";
import AppBar from "./components/AppBar";
import Music from "./components/Music";
import Ott from "./components/Ott";

function App() {
  const appRouter = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "appStore",
      element: <AppStore />,
    },
    {
      path: "games",
      element: <Games />,
    },
    {
      path: "music",
      element: <Music />,
    },
    {
      path: "ott",
      element: <Ott />,
    },
  ]);

  return (
    <div className="root-container" style={{ backgroundColor: "#1f2124" }}>
      <AppBar />
      <RouterProvider router={appRouter}></RouterProvider>
    </div>
  );
}

export default App;
