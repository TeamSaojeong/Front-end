import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GlobalStyle from "./styles/GlobalStyle";
import NotFound from "./pages/NotFound";
import WebLayout from "./layout/WebLayout";
import LoginPage from "./pages/LoginPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <WebLayout />,
    errorElement: <NotFound />,
    children: [
      {
      path: "",
      element: <Navigate to="/login" replace />, //바로 로그인 페이지로
      },
      {
        path: "login",
        element: <LoginPage />,
      },
    ]
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const queryClient = new QueryClient(); 

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyle />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
