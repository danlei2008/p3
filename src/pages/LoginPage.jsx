import logo from "../assets/img/logo.png";
import backgroundLogo from "../assets/img/background-logo.png";
import { useState } from "react";
import { MdEmail, MdLock, MdOutlineEmail, MdOutlineLock } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { auth, signIn, signInWithGoogle } from "../utils/firebase_auth";
import { useTranslation } from "react-i18next";

//new
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  //언어 변경
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  //web login
  const onLogin = async () => {
    var result = await signIn(email, password);
    if(result){
      navigate("/subject-drive");
    }
  };


  //google login
  const onGoogleLogin = async () => {
    await signInWithGoogle();
  };



  return (
      <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundImage: `url('${backgroundLogo}')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <img
          src={logo}
          alt="logo"
          style={{
            position: "absolute",
            top: 40,
            left: 34,
          }}
        ></img>
        <div
          style={{
            display: "flex",
            width: "882px",
            padding: "94px 45px 23px 45px",
            borderRadius: "30px",
            border: "1px solid",
            borderColor: "#000",
            position: "relative",
            gap: "56px",
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              width: "308px",
            }}
          >
            <img
              style={{ width: "139px", marginBottom: "21px" }}
              src={logo}
              alt="logo"
            ></img>
            <div
              style={{
                fontSize: "30px",
                marginBottom: "21px",
                fontWeight: "600",
              }}
            >
              Login
            </div>
              <div style={{ color: "#666", marginTop: "10px"}}>
                If you do not have an<br/>
                account, you can create one<br/>
                <span onClick={() => navigate("/sign-up")} style={{ color: "#b80b92",cursor:'pointer' }}>here</span>.
              </div>
          </div>
          <div>
            <div style={{}}>
              <label style={{ fontSize: "14px" }}>Email</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #ccc",
                  padding: "0.5rem 0",
                  width: "428px",
                }}
              >
                <MdOutlineEmail style={{ marginRight: "0.5rem" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
            <div style={{ textAlign: "left", marginTop: "49px" }}>
              <label style={{ fontSize: "14px" }}>Password</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #ccc",
                  padding: "0.5rem 0",
                }}
              >
                <MdOutlineLock style={{ marginRight: "0.5rem" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>



            <button
              onClick={onLogin}
              style={{
                width: "100%",
                marginTop: "96px",
                padding: "0.75rem",
                backgroundColor: "#C10C99",
                color: "#000",
                borderRadius: "32px",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(193, 12, 153, 0.3)",
              }}
            >
              Login
            </button>



          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
