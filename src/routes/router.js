import { createBrowserRouter } from "react-router-dom";
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";
import SubjectDrive from "../pages/SubjectDrive";
import Test from "../pages/Test";
import UsersPage from "../pages/UsersPage";

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  { path: "/sign-up", element: <SignUpPage /> },
  { path: "/subject-drive", element: <SubjectDrive /> },
  { path: "/test", element: <Test /> },
  { path: "/users", element: <UsersPage /> },
]);



export default router;
